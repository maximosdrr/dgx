import { IsEnum, IsString, Matches } from 'class-validator';
import { PlanSlug } from '@docgen/shared';

export class SubscribeDto {
  @IsEnum(PlanSlug)
  planSlug: PlanSlug;

  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, { message: 'taxId must be CPF (11 digits) or CNPJ (14 digits)' })
  taxId: string;
}
