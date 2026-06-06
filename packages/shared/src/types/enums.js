"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.PlanSlug = exports.DocumentStatus = exports.TemplateCategory = void 0;
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["CONTRATO"] = "CONTRATO";
    TemplateCategory["CERTIFICADO"] = "CERTIFICADO";
    TemplateCategory["PROPOSTA"] = "PROPOSTA";
    TemplateCategory["OUTRO"] = "OUTRO";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["PROCESSING"] = "PROCESSING";
    DocumentStatus["DONE"] = "DONE";
    DocumentStatus["FAILED"] = "FAILED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var PlanSlug;
(function (PlanSlug) {
    PlanSlug["FREE"] = "FREE";
    PlanSlug["STARTER"] = "STARTER";
    PlanSlug["PRO"] = "PRO";
})(PlanSlug || (exports.PlanSlug = PlanSlug = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PENDING"] = "PENDING";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=enums.js.map