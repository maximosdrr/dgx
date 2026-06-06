import {
  Controller, Get, Post, Body, Headers, RawBodyRequest, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserPayload } from '@docgen/shared';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: UserPayload) {
    const [sub, plan] = await Promise.all([
      this.billingService.getCurrentSubscription(user.sub),
      this.billingService.getEffectivePlan(user.sub),
    ]);
    return { subscription: sub, plan };
  }

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: UserPayload) {
    return this.billingService.subscribe(dto, user);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-abacatepay-signature') signature: string,
  ) {
    const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    await this.billingService.handleWebhook(raw, signature ?? '');
    return { received: true };
  }
}
