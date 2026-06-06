'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const TemplateEditor = dynamic(
  () => import('@/components/editor/TemplateEditor'),
  { ssr: false, loading: () => <div className="h-96 border rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Carregando editor…</div> },
);

const CATEGORIES = [
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'PROPOSTA', label: 'Proposta' },
  { value: 'OUTRO', label: 'Outro' },
];

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [form, setForm] = useState({ name: '', description: '', category: 'OUTRO' });
  const [initialContent, setInitialContent] = useState('');
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(searchParams.get('saved') === '1');

  useEffect(() => {
    if (saved) setTimeout(() => setSaved(false), 3000);
  }, [saved]);

  useEffect(() => {
    api.get(`/templates/${id}`)
      .then(({ data }) => {
        const tpl = data.data ?? data;
        setForm({
          name: tpl.name,
          description: tpl.description ?? '',
          category: tpl.category,
        });
        const html = (tpl.schema?.content as string) ?? '';
        setInitialContent(html);
        setContent(html);
        setVariables(tpl.variables ?? []);
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleEditorChange = useCallback((html: string, vars: string[]) => {
    setContent(html);
    setVariables(vars);
  }, []);

  async function handleSave() {
    setError('');
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    if (!content || content === '<p></p>') { setError('Conteúdo não pode estar vazio'); return; }

    setSaving(true);
    try {
      await api.put(`/templates/${id}`, {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        schema: { content },
        variables,
      });
      setSaved(true);
    } catch (err: any) {
      const msg = err.response?.data?.error?.detail ?? err.response?.data?.error?.title;
      setError(msg ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Carregando template…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-xl">←</Link>
          <h1 className="text-lg font-semibold">Editar template</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">✓ Salvo</span>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nome do template *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Conteúdo do template</label>
            {variables.length > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                {variables.length} variável{variables.length !== 1 ? 'is' : ''} detectada{variables.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {initialContent !== undefined && (
            <TemplateEditor initialContent={initialContent} onChange={handleEditorChange} />
          )}
        </div>

        <div className="text-xs text-gray-400 pb-8">
          💡 Use <strong>{'{ } Variável'}</strong> na toolbar para inserir campos como <code>{'{{nome_cliente}}'}</code>.
        </div>
      </main>
    </div>
  );
}
