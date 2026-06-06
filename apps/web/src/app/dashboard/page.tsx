'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import GenerateModal from './generate-modal';
import { Navbar } from '@/components/layout/Navbar';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  variables: string[];
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Template | null>(null);

  useEffect(() => {
    api.get('/templates')
      .then(({ data }) => setTemplates(data.data ?? data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar authenticated />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Meus templates</h2>

        {loading && <p className="text-gray-500">Carregando...</p>}

        {!loading && templates.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">Nenhum template ainda.</p>
            <Link href="/templates/new" className="text-blue-600 hover:underline mt-2 inline-block">
              Criar primeiro template
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border p-5 space-y-2 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  {tpl.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(tpl.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="font-semibold">{tpl.name}</h3>
              {tpl.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{tpl.description}</p>
              )}
              <p className="text-xs text-gray-400">{tpl.variables.length} variáveis</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setGenerating(tpl)}
                  className="flex-1 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                >
                  Gerar PDF
                </button>
                <Link
                  href={`/templates/${tpl.id}/edit`}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {generating && (
        <GenerateModal
          template={generating}
          onClose={() => setGenerating(null)}
          onSuccess={() => {
            setGenerating(null);
            router.push('/documents');
          }}
        />
      )}
    </div>
  );
}
