import { Entity, PrimaryKey, Property, ManyToOne, Enum, Ref, Opt } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { PlanSlug, SubscriptionStatus } from '@docgen/shared';
import { User } from './user.entity';

@Entity({ tableName: 'subscriptions' })
export class Subscription {
  @PrimaryKey({ type: 'uuid' })
  id: string & Opt = uuidv4();

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @Enum(() => PlanSlug)
  plan: PlanSlug & Opt = PlanSlug.FREE;

  @Enum(() => SubscriptionStatus)
  status: SubscriptionStatus & Opt = SubscriptionStatus.ACTIVE;

  @Property({ nullable: true })
  abacatePayBillingId?: string;

  @Property({ nullable: true })
  abacatePayCustomerId?: string;

  @Property({ nullable: true, type: 'text' })
  taxId?: string;

  @Property({ nullable: true })
  currentPeriodStart?: Date;

  @Property({ nullable: true })
  currentPeriodEnd?: Date;

  @Property()
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}
