import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { Subscription } from '../common/entities/subscription.entity';
import { Document } from '../common/entities/document.entity';
import { Template } from '../common/entities/template.entity';
import { User } from '../common/entities/user.entity';
import { PlanSlug, SubscriptionStatus, UserPayload } from '@docgen/shared';
import { AbacatePayService } from './abacatepay.service';
import { PLANS, Plan } from './plans';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly abacatePay: AbacatePayService,
    private readonly config: ConfigService,
  ) {}

  getPlans(): Plan[] {
    return Object.values(PLANS);
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const em = this.em.fork();
    return em.findOne(
      Subscription,
      { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  async getEffectivePlan(userId: string): Promise<Plan> {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) return PLANS[PlanSlug.FREE];

    const plan = PLANS[sub.plan as PlanSlug];
    if (!plan) return PLANS[PlanSlug.FREE];

    if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
      const em = this.em.fork();
      const fresh = await em.findOneOrFail(Subscription, { id: sub.id });
      fresh.status = SubscriptionStatus.EXPIRED;
      await em.flush();
      return PLANS[PlanSlug.FREE];
    }

    return plan;
  }

  async checkDocumentLimit(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    if (plan.documentsPerMonth === Infinity) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const em = this.em.fork();
    const count = await em.count(Document, {
      user: { id: userId },
      createdAt: { $gte: startOfMonth },
    });

    if (count >= plan.documentsPerMonth) {
      throw new HttpException(
        `Plan limit reached: ${plan.documentsPerMonth} documents/month on ${plan.name} plan. Upgrade to generate more.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async checkTemplateLimit(userId: string): Promise<void> {
    const plan = await this.getEffectivePlan(userId);
    if (plan.templatesMax === Infinity) return;

    const em = this.em.fork();
    const count = await em.count(Template, {
      user: { id: userId },
      isActive: true,
    });

    if (count >= plan.templatesMax) {
      throw new HttpException(
        `Plan limit reached: ${plan.templatesMax} templates on ${plan.name} plan. Upgrade to create more.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async subscribe(dto: SubscribeDto, user: UserPayload): Promise<{ checkoutUrl: string }> {
    const plan = PLANS[dto.planSlug as PlanSlug];
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.priceInCents === 0) throw new BadRequestException('Free plan does not require payment');

    const em = this.em.fork();
    const dbUser = await em.findOneOrFail(User, { id: user.sub });

    const customer = await this.abacatePay.createOrGetCustomer(dbUser.name, dbUser.email, dto.taxId);
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');

    const billing = await this.abacatePay.createBilling({
      customerName: dbUser.name,
      customerEmail: dbUser.email,
      customerTaxId: dto.taxId,
      productName: plan.name,
      productExternalId: plan.slug,
      priceInCents: plan.priceInCents,
      returnUrl: `${appUrl}/billing/success`,
      metadata: { userId: user.sub, planSlug: plan.slug },
    });

    const sub = em.create(Subscription, {
      user: dbUser,
      plan: plan.slug,
      status: SubscriptionStatus.PENDING,
      abacatePayBillingId: billing.id,
      abacatePayCustomerId: customer.id,
      taxId: dto.taxId,
    });
    await em.flush();

    this.logger.log(`Subscription ${sub.id} pending for user ${user.sub} plan ${plan.slug}`);
    return { checkoutUrl: billing.url };
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    if (!this.abacatePay.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(payload);
    const billingId: string = event?.data?.id ?? event?.id;
    const eventType: string = event?.event ?? event?.type;

    if (!billingId) {
      this.logger.warn('Webhook missing billing id', event);
      return;
    }

    const em = this.em.fork();
    const sub = await em.findOne(Subscription, { abacatePayBillingId: billingId });
    if (!sub) {
      this.logger.warn(`No subscription found for billing ${billingId}`);
      return;
    }

    if (eventType === 'billing.paid' || eventType === 'BILLING_PAID') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      sub.status = SubscriptionStatus.ACTIVE;
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = periodEnd;
      await em.flush();
      this.logger.log(`Subscription ${sub.id} activated via webhook`);
    } else if (['billing.cancelled', 'billing.expired', 'BILLING_CANCELLED'].includes(eventType)) {
      sub.status = SubscriptionStatus.CANCELLED;
      await em.flush();
      this.logger.log(`Subscription ${sub.id} cancelled via webhook`);
    }
  }
}
