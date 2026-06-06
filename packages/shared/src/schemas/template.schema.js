"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTemplateSchema = exports.CreateTemplateSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
exports.CreateTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.nativeEnum(enums_1.TemplateCategory).default(enums_1.TemplateCategory.OUTRO),
    schema: zod_1.z.record(zod_1.z.unknown()).optional(),
    variables: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateTemplateSchema = exports.CreateTemplateSchema.partial();
//# sourceMappingURL=template.schema.js.map