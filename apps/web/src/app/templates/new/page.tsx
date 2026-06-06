'use client';
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StarterTemplate } from '@/lib/starterTemplates';

const CraftEditor = dynamic(() => import('@/components/editor/craft/CraftEditor').then((m) => m.CraftEditor), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af', fontSize: '14px' }}>
      Carregando editor…
    </div>
  ),
});

const StarterTemplateModal = dynamic(() => import('@/components/editor/StarterTemplateModal'), { ssr: false });

export default function NewTemplatePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [selected, setSelected] = useState<StarterTemplate | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const handleSelect = useCallback((tpl: StarterTemplate | null) => {
    setSelected(tpl);
    setEditorKey((k) => k + 1);
    setShowModal(false);
  }, []);

  const handleSaved = useCallback((templateId: string) => {
    router.push(`/templates/${templateId}/edit?saved=1`);
  }, [router]);

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#f3f4f6' }}>
      {!showModal && (
        <CraftEditor
          key={editorKey}
          initialSchema={selected?.craftJson}
          initialForm={{
            name: selected?.name ?? '',
            category: selected?.category ?? 'OUTRO',
            description: selected?.description ?? '',
          }}
          onSaved={handleSaved}
          onOpenStarterModal={() => setShowModal(true)}
        />
      )}
      {showModal && (
        <>
          <div style={{ height: '100vh', background: '#f3f4f6' }} />
          <StarterTemplateModal onSelect={handleSelect} />
        </>
      )}
    </div>
  );
}
