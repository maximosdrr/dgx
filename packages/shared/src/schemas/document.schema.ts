import { z } from 'zod';
import { DocumentStatus } from '../types/enums';

export const GenerateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.string()),
});

export type GenerateDocumentDto = z.infer<typeof GenerateDocumentSchema>;

export interface DocumentResponse {
  id: string;
  userId: string;
  templateId: string;
  status: DocumentStatus;
  s3Key?: string;
  presignedUrl?: string;
  expiresAt?: string;
  variables: Record<string, string>;
  createdAt: string;
}
