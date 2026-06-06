"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateDocumentSchema = void 0;
const zod_1 = require("zod");
exports.GenerateDocumentSchema = zod_1.z.object({
    templateId: zod_1.z.string().uuid(),
    variables: zod_1.z.record(zod_1.z.string()),
});
//# sourceMappingURL=document.schema.js.map