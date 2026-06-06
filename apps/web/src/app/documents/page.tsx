'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Document {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  presignedUrl?: string;
  expiresAt?: string;
  variables: Record<string, string>;
  createdAt: string;
  template?: { name: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  DONE: 'Pronto',
  FAILED: 'Erro',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  DONE: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents')
      .then(({ data }) => setDocs(data.data ?? data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">DocGen</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Templates</Link>
          <Link href="/documents" className="font-semibold">Documentos</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Documentos gerados</h2>

        {loading && <p className="text-gray-500">Carregando...</p>}

        {!loading && docs.length === 0 && (
          <p className="text-gray-500 text-center py-16">Nenhum documento ainda.</p>
        )}

        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white border rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">{doc.template?.name ?? 'Template removido'}</p>
                <p className="text-xs text-gray-400">
                  {new Date(doc.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[doc.status]}`}>
                  {STATUS_LABEL[doc.status]}
                </span>
                {doc.status === 'DONE' && doc.presignedUrl && (
                  <a
                    href={doc.presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Baixar PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
