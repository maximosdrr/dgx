import { PlanSlug } from '@docgen/shared';

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  priceInCents: number;
  documentsPerMonth: number;
  templatesMax: number;
  features: string[];
}

export const PLANS: Record<PlanSlug, Plan> = {
  [PlanSlug.FREE]: {
    slug: PlanSlug.FREE,
    name: 'Grátis',
    description: 'Para testar a plataforma',
    priceInCents: 0,
    documentsPerMonth: 5,
    templatesMax: 3,
    features: ['5 documentos/mês', 'Até 3 templates', 'PDF padrão'],
  },
  [PlanSlug.STARTER]: {
    slug: PlanSlug.STARTER,
    name: 'Starter',
    description: 'Para freelancers e pequenas equipes',
    priceInCents: 2990,
    documentsPerMonth: 100,
    templatesMax: 20,
    features: ['100 documentos/mês', 'Até 20 templates', 'PDF com branding', 'Suporte por e-mail'],
  },
  [PlanSlug.PRO]: {
    slug: PlanSlug.PRO,
    name: 'Pro',
    description: 'Para empresas e alto volume',
    priceInCents: 9900,
    documentsPerMonth: Infinity,
    templatesMax: Infinity,
    features: [
      'Documentos ilimitados',
      'Templates ilimitados',
      'PDF com branding',
      'API access',
      'Suporte prioritário',
    ],
  },
};
