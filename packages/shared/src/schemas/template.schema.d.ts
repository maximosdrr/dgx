import { z } from 'zod';
import { TemplateCategory } from '../types/enums';
export declare const CreateTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodNativeEnum<typeof TemplateCategory>>;
    schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    variables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: TemplateCategory;
    description?: string | undefined;
    schema?: Record<string, unknown> | undefined;
    variables?: string[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    category?: TemplateCategory | undefined;
    schema?: Record<string, unknown> | undefined;
    variables?: string[] | undefined;
}>;
export declare const UpdateTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TemplateCategory>>>;
    schema: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    variables: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    category?: TemplateCategory | undefined;
    schema?: Record<string, unknown> | undefined;
    variables?: string[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    category?: TemplateCategory | undefined;
    schema?: Record<string, unknown> | undefined;
    variables?: string[] | undefined;
}>;
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
//# sourceMappingURL=template.schema.d.ts.map