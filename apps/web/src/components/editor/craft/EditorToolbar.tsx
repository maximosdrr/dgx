'use client';
import { useEditor } from '@craftjs/core';
import { useState } from 'react';
import { useAutoSave, SaveStatus } from '@/hooks/useAutoSave';
import { useVariableDetector, VarType } from '@/hooks/useVariableDetector';
import { api } from '@/lib/api';
import { renderCraftToHtml } from '@/lib/craftRenderer';

interface EditorToolbarProps {
  templateId?: string;
  form: { name: string; category: string; description: string };
  onFormChange: (field: string, value: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  savedFlash: boolean;
  typeMeta?: Record<string, VarType>;
  onBack: () => void;
  onOpenStarterModal?: () => void;
}

function SaveStatusBadge({ status, lastSaved }: { status: SaveStatus; lastSaved: Date | null }) {
  if (status === 'saving') return <span style={{ fontSize: '12px', color: '#6b7280' }}>Salvando…</span>;
  if (status === 'saved' && lastSaved)
    return <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>;
  if (status === 'error') return <span style={{ fontSize: '12px', color: '#ef4444' }}>Erro ao salvar</span>;
  return null;
}

interface PreviewModalProps {
  templateId: string;
  variables: { name: string }[];
  onClose: () => void;
  getCraftJson: () => Record<string, unknown>;
}

function PreviewModal({ templateId, variables, onClose, getCraftJson }: PreviewModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      // Save current state first
      const craftJson = getCraftJson();
      const html = renderCraftToHtml(craftJson, values);
      const varRegex = /\{\{(\w+)\}\}/g;
      const vars = new Set<string>();
      let m: RegExpExecArray | null;
      const jsonStr = JSON.stringify(craftJson);
      while ((m = varRegex.exec(jsonStr)) !== null) vars.add(m[1]);

      await api.put(`/templates/${templateId}`, {
        schema: { craftJson, content: html },
        variables: Array.from(vars),
      });

      const { data } = await api.post('/documents/generate', {
        templateId,
        variables: values,
      });
      const docId: string = (data.data ?? data).id;

      // Poll for completion
      let attempts = 0;
      const poll = async (): Promise<void> => {
        const { data: doc } = await api.get(`/documents/${docId}`);
        const d = doc.data ?? doc;
        if (d.status === 'DONE') {
          setPdfUrl(d.presignedUrl);
          setGenerating(false);
        } else if (d.status === 'FAILED' || attempts > 30) {
          setError('Falha ao gerar o PDF');
          setGenerating(false);
        } else {
          attempts++;
          setTimeout(poll, 1500);
        }
      };
      await poll();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao gerar PDF');
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Preencher e visualizar</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 0 }}>
          {/* Variable inputs */}
          <div style={{ width: '240px', minWidth: '240px', padding: '16px', borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '12px' }}>
              {variables.length > 0 ? `${variables.length} variáveis detectadas` : 'Nenhuma variável encontrada'}
            </p>
            {variables.map(({ name }) => (
              <div key={name} style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '3px' }}>
                  {name}
                </label>
                <input
                  value={values[name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  placeholder={`{{${name}}}`}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                width: '100%', marginTop: '12px', padding: '8px', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? 'Gerando…' : '⬇ Gerar PDF'}
            </button>
          </div>

          {/* PDF preview */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', minHeight: '400px' }}>
            {pdfUrl ? (
              <iframe src={pdfUrl} style={{ width: '100%', height: '500px', border: 'none' }} title="Preview do PDF" />
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                <p style={{ fontSize: '13px' }}>Preencha as variáveis e clique em<br />"Gerar PDF" para visualizar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const EditorToolbar = ({
  templateId,
  form,
  onFormChange,
  onSave,
  saving,
  savedFlash,
  typeMeta = {},
  onBack,
  onOpenStarterModal,
}: EditorToolbarProps) => {
  const { actions, query, canUndo, canRedo } = useEditor((state, q) => ({
    canUndo: q.history.canUndo(),
    canRedo: q.history.canRedo(),
  }));
  const { saveStatus, lastSaved } = useAutoSave({ templateId, form, variableMeta: typeMeta });
  const variables = useVariableDetector(typeMeta);
  const [showPreview, setShowPreview] = useState(false);

  const getCraftJson = () => JSON.parse(query.serialize()) as Record<string, unknown>;

  return (
    <>
      <div style={{
        height: '52px', background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0, zIndex: 20, position: 'relative',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280', padding: '4px 8px', borderRadius: '6px' }}>
            ←
          </button>
          <input
            value={form.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            placeholder="Nome do template"
            style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#111', width: '200px', background: 'transparent' }}
          />
        </div>

        {/* Center — undo / redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => actions.history.undo()}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: canUndo ? 'pointer' : 'not-allowed', opacity: canUndo ? 1 : 0.4, fontSize: '13px' }}>
            ↩
          </button>
          <button
            onClick={() => actions.history.redo()}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: canRedo ? 'pointer' : 'not-allowed', opacity: canRedo ? 1 : 0.4, fontSize: '13px' }}>
            ↪
          </button>
          <span style={{ width: '1px', background: '#e5e7eb', height: '20px', margin: '0 6px' }} />
          {templateId && <SaveStatusBadge status={saveStatus} lastSaved={lastSaved} />}
          {savedFlash && <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Salvo</span>}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'flex-end' }}>
          {onOpenStarterModal && (
            <button onClick={onOpenStarterModal}
              style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '7px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
              Modelos
            </button>
          )}
          {templateId && (
            <button
              onClick={() => setShowPreview(true)}
              style={{ padding: '6px 14px', border: '1px solid #3b82f6', borderRadius: '7px', background: '#eff6ff', cursor: 'pointer', fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
              ↗ Preencher e visualizar
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '7px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {showPreview && templateId && (
        <PreviewModal
          templateId={templateId}
          variables={variables}
          onClose={() => setShowPreview(false)}
          getCraftJson={getCraftJson}
        />
      )}
    </>
  );
};
