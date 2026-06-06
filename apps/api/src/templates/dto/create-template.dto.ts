import { IsString, IsEnum, IsOptional, MaxLength, IsArray, IsObject } from 'class-validator';
import { TemplateCategory } from '@docgen/shared';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory = TemplateCategory.OUTRO;

  @IsObject()
  @IsOptional()
  schema?: Record<string, unknown>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];
}
