import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { BillingModule } from '../billing/billing.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [BillingModule, StorageModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
