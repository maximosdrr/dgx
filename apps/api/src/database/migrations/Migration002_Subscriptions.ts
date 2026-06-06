import { Migration } from '@mikro-orm/migrations';

export class Migration002_Subscriptions extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TYPE plan_slug AS ENUM ('FREE', 'STARTER', 'PRO');
      CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED');

      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        plan plan_slug NOT NULL DEFAULT 'FREE',
        status subscription_status NOT NULL DEFAULT 'ACTIVE',
        abacate_pay_billing_id VARCHAR(255),
        abacate_pay_customer_id VARCHAR(255),
        tax_id VARCHAR(20),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX idx_subscriptions_billing_id ON subscriptions(abacate_pay_billing_id);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TABLE IF EXISTS subscriptions;
      DROP TYPE IF EXISTS subscription_status;
      DROP TYPE IF EXISTS plan_slug;
    `);
  }
}
