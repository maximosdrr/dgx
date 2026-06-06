import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AbacatePayService } from './abacatepay.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, AbacatePayService],
  exports: [BillingService],
})
export class BillingModule {}
