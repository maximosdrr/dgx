'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

interface Plan {
  slug: string;
  name: string;
  description: string;
  priceInCents: number;
  documentsPerMonth: number;
  templatesMax: number;
  features: string[];
}

interface CurrentPlan {
  plan: Plan;
  subscription: { status: string; currentPeriodEnd?: string } | null;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Grátis';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + '/mês';
}

function formatLimit(n: number): string {
  return n === Infinity || n > 10000 ? 'Ilimitado' : String(n);
}

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [taxId, setTaxId] = useState('');
  const [showTaxInput, setShowTaxInput] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/billing/plans'),
      api.get('/billing/subscription').catch(() => ({ data: null })),
    ])
      .then(([plansRes, subRes]) => {
        setPlans(plansRes.data.data ?? plansRes.data);
        const subData = subRes.data?.data ?? subRes.data;
        if (subData) setCurrent(subData);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubscribe(planSlug: string) {
    setError('');
    const cleanTaxId = taxId.replace(/\D/g, '');
    if (cleanTaxId.length !== 11 && cleanTaxId.length !== 14) {
      setError('CPF deve ter 11 dígitos ou CNPJ 14 dígitos');
      return;
    }
    setSubscribing(planSlug);
    try {
      const { data } = await api.post('/billing/subscribe', { planSlug, taxId: cleanTaxId });
      const { checkoutUrl } = data.data ?? data;
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.response?.data?.error?.title ?? 'Erro ao iniciar pagamento');
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar authenticated />
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <p className="text-gray-500">Carregando planos...</p>
        </div>
      </div>
    );
  }

  const currentPlanSlug = current?.plan?.slug ?? 'FREE';

  return (
    <div className="min-h-screen">
      <Navbar authenticated />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Escolha seu plano</h2>
          {current?.subscription?.currentPeriodEnd && (
            <p className="text-gray-500 mt-2 text-sm">
              Plano atual: <strong>{current.plan.name}</strong> —
              renova em {new Date(current.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-6">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.slug === currentPlanSlug;
            const isPro = plan.slug === 'PRO';

            return (
              <div
                key={plan.slug}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  isPro ? 'border-blue-600 shadow-lg' : 'border-gray-200'
                }`}
              >
                {isPro && (
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">
                    Mais popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold mb-1">{formatPrice(plan.priceInCents)}</p>

                <ul className="space-y-2 my-6 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {formatLimit(plan.documentsPerMonth)} docs/mês
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {formatLimit(plan.templatesMax)} templates
                  </li>
                  {plan.features.slice(2).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg">
                    Plano atual
                  </div>
                ) : plan.priceInCents === 0 ? (
                  <div className="text-center py-2 text-sm text-gray-400">
                    Grátis — sem ação necessária
                  </div>
                ) : showTaxInput === plan.slug ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="CPF ou CNPJ (somente números)"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={subscribing === plan.slug}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {subscribing === plan.slug ? 'Aguarde...' : 'Ir para pagamento'}
                    </button>
                    <button
                      onClick={() => setShowTaxInput(null)}
                      className="w-full py-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTaxInput(plan.slug)}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                      isPro
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Assinar {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Pagamento via Pix ou boleto. Processado por AbacatePay.
        </p>
      </main>
    </div>
  );
}
