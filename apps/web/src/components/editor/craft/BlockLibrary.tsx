'use client';
import { useEditor } from '@craftjs/core';
import React, { useState } from 'react';
import { TextBlock } from './blocks/TextBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ClauseBlock } from './blocks/ClauseBlock';
import { ColumnsBlock } from './blocks/ColumnsBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { SpacerBlock } from './blocks/SpacerBlock';
import { TableBlock } from './blocks/TableBlock';
import { VariableBlock } from './blocks/VariableBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { SignatureBlock } from './blocks/SignatureBlock';

interface BlockDef {
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  label: string;
  icon: string;
  preview: string;
}

interface BlockGroup {
  name: string;
  blocks: BlockDef[];
}

const BLOCK_GROUPS: BlockGroup[] = [
  {
    name: 'Texto',
    blocks: [
      { component: TextBlock, label: 'Parágrafo', icon: '¶', preview: 'Bloco de texto livre com formatação' },
      { component: HeadingBlock, label: 'Título', icon: 'H', preview: 'Cabeçalho H1 / H2 / H3', props: { level: 'h2', content: 'Título' } },
    ],
  },
  {
    name: 'Estrutura',
    blocks: [
      { component: ClauseBlock, label: 'Cláusula', icon: '§', preview: 'Cláusula numerada com título e corpo' },
      { component: ColumnsBlock, label: 'Colunas', icon: '⣿', preview: 'Layout em 2 ou 3 colunas' },
      { component: DividerBlock, label: 'Divisor', icon: '—', preview: 'Linha horizontal' },
      { component: SpacerBlock, label: 'Espaço', icon: '↕', preview: 'Espaço em branco configurável' },
    ],
  },
  {
    name: 'Dados',
    blocks: [
      { component: TableBlock, label: 'Tabela', icon: '⊞', preview: 'Tabela de dados editável' },
      { component: VariableBlock, label: 'Variável', icon: '{}', preview: 'Campo substituível ao gerar PDF' },
    ],
  },
  {
    name: 'Mídia',
    blocks: [
      { component: ImageBlock, label: 'Imagem', icon: '🖼', preview: 'Imagem por URL ou upload' },
    ],
  },
  {
    name: 'Jurídico',
    blocks: [
      { component: SignatureBlock, label: 'Assinatura', icon: '✍', preview: 'Campo de assinatura com linha' },
    ],
  },
];

function DraggableBlock({ def }: { def: BlockDef }) {
  const { connectors } = useEditor();
  const element = React.createElement(def.component as React.ComponentType<any>, def.props ?? {});

  return (
    <div
      ref={(el) => { if (el) connectors.create(el, element); }}
      title={def.preview}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 10px',
        borderRadius: '6px',
        cursor: 'grab',
        userSelect: 'none',
        border: '1px solid #e5e7eb',
        background: '#fff',
        marginBottom: '4px',
        fontSize: '13px',
        color: '#374151',
        transition: 'background 0.1s, border-color 0.1s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#eff6ff';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = '#fff';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
      }}
    >
      <span style={{ width: '20px', textAlign: 'center', fontSize: '14px', opacity: 0.7 }}>{def.icon}</span>
      <span style={{ fontWeight: 500 }}>{def.label}</span>
    </div>
  );
}

export const BlockLibrary = () => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  return (
    <div
      style={{
        width: '220px',
        minWidth: '220px',
        background: '#f9fafb',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        padding: '12px 10px',
        userSelect: 'none',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '2px' }}>
        Blocos
      </p>
      {BLOCK_GROUPS.map((group) => (
        <div key={group.name} style={{ marginBottom: '8px' }}>
          <button
            onClick={() => toggle(group.name)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              padding: '4px 2px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px',
            }}
          >
            <span>{group.name}</span>
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{collapsed[group.name] ? '▶' : '▼'}</span>
          </button>
          {!collapsed[group.name] && (
            <div>
              {group.blocks.map((def) => (
                <DraggableBlock key={def.label} def={def} />
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: '16px', padding: '10px 8px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ fontSize: '11px', color: '#1d4ed8', lineHeight: 1.4 }}>
          💡 <strong>Arraste</strong> um bloco para o documento ao lado.
        </p>
      </div>
    </div>
  );
};
