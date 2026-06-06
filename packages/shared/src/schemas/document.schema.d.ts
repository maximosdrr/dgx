import { z } from 'zod';
import { DocumentStatus } from '../types/enums';
export declare const GenerateDocumentSchema: z.ZodObject<{
    templateId: z.ZodString;
    variables: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    variables: Record<string, string>;
    templateId: string;
}, {
    variables: Record<string, string>;
    templateId: string;
}>;
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
//# sourceMappingURL=document.schema.d.ts.map