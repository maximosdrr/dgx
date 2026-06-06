import { z } from 'zod';
import { TemplateCategory } from '../types/enums';

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(TemplateCategory).default(TemplateCategory.OUTRO),
  schema: z.record(z.unknown()).optional(),
  variables: z.array(z.string()).optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;

export interface TemplateResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  schema?: Record<string, unknown>;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
