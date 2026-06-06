export enum TemplateCategory {
  CONTRATO = 'CONTRATO',
  CERTIFICADO = 'CERTIFICADO',
  PROPOSTA = 'PROPOSTA',
  OUTRO = 'OUTRO',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
}

export enum SignatureType {
  WRITTEN = 'WRITTEN',
  FACIAL = 'FACIAL',
}

export enum PlanSlug {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}
