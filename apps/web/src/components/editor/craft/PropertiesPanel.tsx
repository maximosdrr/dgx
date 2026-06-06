'use client';
import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { useVariableDetector, VarType, DetectedVariable } from '@/hooks/useVariableDetector';

// ── Document properties ────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'PROPOSTA', label: 'Proposta' },
  { value: 'OUTRO', label: 'Outro' },
];

const PAGE_PADDINGS = [
  { value: '38px', label: 'Estreita (1.0cm)' },
  { value: '57px', label: 'Normal (1.5cm)' },
  { value: '76px', label: 'Larga (2.0cm)' },
  { value: '95px', label: 'Muito larga (2.5cm)' },
];

const BASE_FONTS = [
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Calibri', sans-serif", label: 'Calibri' },
];

const VAR_TYPES: { value: VarType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'currency', label: 'Moeda' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
];

const TYPE_COLOR: Record<VarType, string> = {
  text: '#3b82f6',
  number: '#8b5cf6',
  date: '#10b981',
  currency: '#059669',
  cpf: '#f59e0b',
  cnpj: '#f97316',
};

// ── DocumentProps ──────────────────────────────────────────────────────────

interface DocumentPropsFormProps {
  name: string;
  category: string;
  description: string;
  pagePadding: string;
  baseFont: string;
  onChange: (field: string, value: string) => void;
}

const DocumentProps = ({ name, category, description, pagePadding, baseFont, onChange }: DocumentPropsFormProps) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
      <input value={name} onChange={(e) => onChange('name', e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
      <select value={category} onChange={(e) => onChange('category', e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm bg-white">
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
      <input value={description} onChange={(e) => onChange('description', e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm" />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Margem da página</label>
      <select value={pagePadding} onChange={(e) => onChange('pagePadding', e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm bg-white">
        {PAGE_PADDINGS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Fonte base</label>
      <select value={baseFont} onChange={(e) => onChange('baseFont', e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm bg-white">
        {BASE_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
    </div>
  </div>
);

// ── VariablesPanel ─────────────────────────────────────────────────────────

interface VariablesPanelProps {
  typeMeta: Record<string, VarType>;
  onTypeChange: (name: string, type: VarType) => void;
}

const VariablesPanel = ({ typeMeta, onTypeChange }: VariablesPanelProps) => {
  const variables = useVariableDetector(typeMeta);

  const scrollToVariable = (name: string) => {
    // Find a DOM element that contains {{name}} and scroll it into view
    const canvas = document.getElementById('craft-canvas-scroll');
    if (!canvas) return;
    const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent?.includes(`{{${name}}`) || node.textContent?.includes(name)) {
        (node.parentElement as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const el = node.parentElement as HTMLElement | null;
        if (el) {
          el.style.outline = '2px solid #f59e0b';
          el.style.outlineOffset = '2px';
          setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
        }
        break;
      }
      node = walker.nextNode();
    }
  };

  if (variables.length === 0) {
    return (
      <div style={{ padding: '16px 4px', color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
        <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '10px', opacity: 0.5 }}>{'{ }'}</div>
        <p style={{ textAlign: 'center' }}>
          Use <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>{'{{nome_variavel}}'}</code> em
          qualquer bloco de texto para criar uma variável.
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', color: '#d1d5db', fontSize: '11px' }}>
          Ex: Este contrato é celebrado por {'{{nome_contratante}}'}.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {variables.map((v: DetectedVariable) => (
        <div
          key={v.name}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 10px',
            background: '#fff',
            borderLeft: `3px solid ${TYPE_COLOR[v.type] ?? '#3b82f6'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#111',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {'{}'}  {v.name}
            </span>
            <button
              onClick={() => scrollToVariable(v.name)}
              title="Localizar no documento"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: '13px', padding: '0 2px', flexShrink: 0,
              }}
            >
              ↗
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Tipo:</span>
            <select
              value={v.type}
              onChange={(e) => onTypeChange(v.name, e.target.value as VarType)}
              style={{
                flex: 1, border: '1px solid #e5e7eb', borderRadius: '4px',
                padding: '2px 4px', fontSize: '11px', background: '#fff',
                color: TYPE_COLOR[v.type] ?? '#374151', fontWeight: 500,
              }}
            >
              {VAR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── PropertiesPanel (main) ─────────────────────────────────────────────────

export interface PropertiesPanelProps {
  form: { name: string; category: string; description: string };
  pagePadding: string;
  baseFont: string;
  onFormChange: (field: string, value: string) => void;
  typeMeta: Record<string, VarType>;
  onTypeChange: (name: string, type: VarType) => void;
}

type Tab = 'props' | 'vars';

export const PropertiesPanel = ({
  form,
  pagePadding,
  baseFont,
  onFormChange,
  typeMeta,
  onTypeChange,
}: PropertiesPanelProps) => {
  const { selected } = useEditor((state) => {
    const selectedSet = state.events.selected;
    const selectedId = selectedSet && selectedSet.size > 0 ? Array.from(selectedSet)[0] : null;

    if (selectedId && state.nodes[selectedId]) {
      return {
        selected: {
          id: selectedId,
          settings: state.nodes[selectedId].related?.toolbar as React.ComponentType | undefined,
          name: state.nodes[selectedId].data.displayName || state.nodes[selectedId].data.name,
        },
      };
    }
    return { selected: null };
  });

  // When no block selected, default to Variables tab.
  // When a block is selected, default to Props tab.
  const [tab, setTab] = useState<Tab>('vars');
  const prevSelected = React.useRef<typeof selected>(null);
  if (selected !== prevSelected.current) {
    prevSelected.current = selected;
    // Block just selected → switch to props; deselected → switch to vars
    if (selected && tab !== 'props') setTab('props');
    if (!selected && tab !== 'vars') setTab('vars');
  }

  // Variables for badge count
  const variables = useVariableDetector(typeMeta);

  // Tab bar style helper
  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1,
    padding: '6px 0',
    fontSize: '11px',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
    color: tab === t ? '#3b82f6' : '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        width: '240px',
        minWidth: '240px',
        background: '#f9fafb',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        flexShrink: 0,
        padding: '0 4px',
      }}>
        <button style={tabStyle('props')} onClick={() => setTab('props')}>
          {selected ? selected.name : 'Documento'}
        </button>
        <button style={tabStyle('vars')} onClick={() => setTab('vars')}>
          Variáveis
          {variables.length > 0 && (
            <span style={{
              marginLeft: '5px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '99px',
              padding: '0 5px',
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: '16px',
              display: 'inline-block',
            }}>
              {variables.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        {tab === 'props' ? (
          selected ? (
            selected.settings
              ? React.createElement(selected.settings)
              : <p style={{ fontSize: '12px', color: '#9ca3af' }}>Sem propriedades configuráveis.</p>
          ) : (
            <DocumentProps
              name={form.name}
              category={form.category}
              description={form.description}
              pagePadding={pagePadding}
              baseFont={baseFont}
              onChange={onFormChange}
            />
          )
        ) : (
          <div>
            <p style={{
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              Variáveis do documento
              {variables.length > 0 && (
                <span style={{
                  background: '#dbeafe', color: '#1d4ed8',
                  borderRadius: '99px', padding: '1px 7px',
                  fontSize: '10px', fontWeight: 700,
                }}>
                  {variables.length}
                </span>
              )}
            </p>
            <VariablesPanel typeMeta={typeMeta} onTypeChange={onTypeChange} />
          </div>
        )}
      </div>
    </div>
  );
};
