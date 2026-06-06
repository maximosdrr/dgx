'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const CraftEditor = dynamic(() => import('@/components/editor/craft/CraftEditor').then((m) => m.CraftEditor), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af', fontSize: '14px' }}>
      Carregando editor…
    </div>
  ),
});

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [initialSchema, setInitialSchema] = useState<Record<string, unknown> | undefined>(undefined);
  const [initialForm, setInitialForm] = useState({ name: '', category: 'OUTRO', description: '' });
  const [initialTypeMeta, setInitialTypeMeta] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedFlash, setSavedFlash] = useState(searchParams.get('saved') === '1');

  useEffect(() => {
    if (savedFlash) { const t = setTimeout(() => setSavedFlash(false), 3000); return () => clearTimeout(t); }
  }, [savedFlash]);

  useEffect(() => {
    api.get(`/templates/${id}`)
      .then(({ data }) => {
        const tpl = data.data ?? data;
        setInitialForm({
          name: tpl.name ?? '',
          category: tpl.category ?? 'OUTRO',
          description: tpl.description ?? '',
        });
        const schema = tpl.schema as Record<string, unknown> | null;
        if (schema?.craftJson && typeof schema.craftJson === 'object') {
          setInitialSchema(schema.craftJson as Record<string, unknown>);
        }
        if (schema?.variableMeta && typeof schema.variableMeta === 'object') {
          setInitialTypeMeta(schema.variableMeta as Record<string, string>);
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af', fontSize: '14px' }}>
        Carregando template…
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <CraftEditor
        templateId={id}
        initialSchema={initialSchema}
        initialForm={initialForm}
        initialTypeMeta={initialTypeMeta as Record<string, import('@/hooks/useVariableDetector').VarType>}
        savedFlash={savedFlash}
        onSaved={() => setSavedFlash(true)}
      />
    </div>
  );
}
