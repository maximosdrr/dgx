'use client';
import { Editor } from '@craftjs/core';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RenderNode } from './RenderNode';
import { EditorCanvas } from './EditorCanvas';
import { BlockLibrary } from './BlockLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { EditorToolbar } from './EditorToolbar';
import type { VarType } from '@/hooks/useVariableDetector';
import {
  Document,
  TextBlock,
  HeadingBlock,
  ClauseBlock,
  ColumnsBlock,
  DividerBlock,
  SpacerBlock,
  TableBlock,
  VariableBlock,
  ImageBlock,
  SignatureBlock,
} from './blocks';
import { renderCraftToHtml } from '@/lib/craftRenderer';
import { api } from '@/lib/api';

const RESOLVER = {
  Document,
  TextBlock,
  HeadingBlock,
  ClauseBlock,
  ColumnsBlock,
  DividerBlock,
  SpacerBlock,
  TableBlock,
  VariableBlock,
  ImageBlock,
  SignatureBlock,
};

export interface CraftEditorProps {
  templateId?: string;
  initialSchema?: Record<string, unknown>;
  initialForm?: { name: string; category: string; description: string };
  /** Pre-existing variable type metadata loaded from saved schema */
  initialTypeMeta?: Record<string, VarType>;
  /** Called after manual save — used by new-template page to get the ID */
  onSaved?: (templateId: string) => void;
  onOpenStarterModal?: () => void;
  savedFlash?: boolean;
}

const DEFAULT_FORM = { name: '', category: 'OUTRO', description: '' };

export const CraftEditor = ({
  templateId,
  initialSchema,
  initialForm = DEFAULT_FORM,
  initialTypeMeta = {},
  onSaved,
  onOpenStarterModal,
  savedFlash = false,
}: CraftEditorProps) => {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [pagePadding, setPagePadding] = useState('60px');
  const [baseFont, setBaseFont] = useState("'Times New Roman', serif");
  const [editorKey, setEditorKey] = useState(0);
  const [typeMeta, setTypeMeta] = useState<Record<string, VarType>>(initialTypeMeta);

  const handleFormChange = useCallback((field: string, value: string) => {
    if (field === 'pagePadding') { setPagePadding(value); return; }
    if (field === 'baseFont') { setBaseFont(value); return; }
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleTypeChange = useCallback((name: string, type: VarType) => {
    setTypeMeta((prev) => ({ ...prev, [name]: type }));
  }, []);

  const initialData = initialSchema ? JSON.stringify(initialSchema) : undefined;

  // Default initial content for blank templates
  const defaultChildren = (
    <ClauseBlock
      number="1"
      title="DAS DISPOSIÇÕES GERAIS"
      content="<p>Inserir o conteúdo da cláusula aqui...</p>"
      showNumber
    />
  );

  return (
    <Editor
      resolver={RESOLVER}
      onRender={RenderNode}
      key={editorKey}
    >
      <InnerEditor
        templateId={templateId}
        form={form}
        pagePadding={pagePadding}
        baseFont={baseFont}
        saving={saving}
        setSaving={setSaving}
        savedFlash={savedFlash}
        initialData={initialData}
        defaultChildren={defaultChildren}
        onFormChange={handleFormChange}
        typeMeta={typeMeta}
        onTypeChange={handleTypeChange}
        onSaved={onSaved}
        onOpenStarterModal={onOpenStarterModal}
        onBack={() => router.push('/dashboard')}
        onResetEditor={() => setEditorKey((k) => k + 1)}
      />
    </Editor>
  );
};

// InnerEditor is inside <Editor> context so all Craft.js hooks work
interface InnerEditorProps {
  templateId?: string;
  form: { name: string; category: string; description: string };
  pagePadding: string;
  baseFont: string;
  saving: boolean;
  setSaving: (v: boolean) => void;
  savedFlash: boolean;
  initialData?: string;
  defaultChildren: React.ReactNode;
  onFormChange: (field: string, value: string) => void;
  typeMeta: Record<string, VarType>;
  onTypeChange: (name: string, type: VarType) => void;
  onSaved?: (id: string) => void;
  onOpenStarterModal?: () => void;
  onBack: () => void;
  onResetEditor: () => void;
}

import { useEditor } from '@craftjs/core';

function InnerEditor({
  templateId,
  form,
  pagePadding,
  baseFont,
  saving,
  setSaving,
  savedFlash,
  initialData,
  defaultChildren,
  onFormChange,
  typeMeta,
  onTypeChange,
  onSaved,
  onOpenStarterModal,
  onBack,
}: InnerEditorProps) {
  const { query } = useEditor();

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Nome do template é obrigatório'); return; }
    setSaving(true);
    try {
      const craftJson = JSON.parse(query.serialize()) as Record<string, unknown>;
      const jsonStr = JSON.stringify(craftJson);
      const varRegex = /\{\{(\w+)\}\}/g;
      const vars = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = varRegex.exec(jsonStr)) !== null) vars.add(m[1]);
      const html = renderCraftToHtml(craftJson);

      if (templateId) {
        await api.put(`/templates/${templateId}`, {
          name: form.name,
          description: form.description || undefined,
          category: form.category,
          schema: { craftJson, content: html, variableMeta: typeMeta },
          variables: Array.from(vars),
        });
        onSaved?.(templateId);
      } else {
        const { data } = await api.post('/templates', {
          name: form.name,
          description: form.description || undefined,
          category: form.category,
          schema: { craftJson, content: html, variableMeta: typeMeta },
          variables: Array.from(vars),
        });
        const newId: string = (data.data ?? data).id;
        onSaved?.(newId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <EditorToolbar
        templateId={templateId}
        form={form}
        onFormChange={onFormChange}
        onSave={handleSave}
        saving={saving}
        savedFlash={savedFlash}
        typeMeta={typeMeta}
        onBack={onBack}
        onOpenStarterModal={onOpenStarterModal}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <BlockLibrary />
        <EditorCanvas
          initialData={initialData}
          defaultChildren={defaultChildren}
        />
        <PropertiesPanel
          form={form}
          pagePadding={pagePadding}
          baseFont={baseFont}
          onFormChange={onFormChange}
          typeMeta={typeMeta}
          onTypeChange={onTypeChange}
        />
      </div>
    </div>
  );
}
