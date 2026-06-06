'use client';
import { useNode } from '@craftjs/core';

export type VarType = 'text' | 'number' | 'date' | 'currency' | 'cpf' | 'cnpj';

export interface VariableBlockProps {
  name: string;
  label: string;
  type: VarType;
  prefix: string;
  suffix: string;
}

const TYPE_COLORS: Record<VarType, string> = {
  text: '#3b82f6',
  number: '#8b5cf6',
  date: '#10b981',
  currency: '#059669',
  cpf: '#f59e0b',
  cnpj: '#f97316',
};

const TYPE_LABELS: Record<VarType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Data',
  currency: 'Valor',
  cpf: 'CPF',
  cnpj: 'CNPJ',
};

const VariableBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as VariableBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nome da variável</label>
        <input value={props.name}
          onChange={(e) => setProp((p: VariableBlockProps) => { p.name = e.target.value.replace(/\s/g, '_').toLowerCase(); })}
          placeholder="nome_variavel"
          className="w-full border rounded px-2 py-1 text-sm font-mono" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Rótulo (exibição)</label>
        <input value={props.label}
          onChange={(e) => setProp((p: VariableBlockProps) => { p.label = e.target.value; })}
          placeholder="Ex: Nome do Cliente"
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
        <select value={props.type}
          onChange={(e) => setProp((p: VariableBlockProps) => { p.type = e.target.value as VarType; })}
          className="w-full border rounded px-2 py-1 text-sm bg-white">
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Prefixo</label>
          <input value={props.prefix}
            onChange={(e) => setProp((p: VariableBlockProps) => { p.prefix = e.target.value; })}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sufixo</label>
          <input value={props.suffix}
            onChange={(e) => setProp((p: VariableBlockProps) => { p.suffix = e.target.value; })}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
    </div>
  );
};

export const VariableBlock = ({
  name = 'variavel',
  label = '',
  type = 'text',
  prefix = '',
  suffix = '',
}: Partial<VariableBlockProps>) => {
  const { connectors: { connect, drag } } = useNode();
  const color = TYPE_COLORS[type] || '#3b82f6';
  const display = label || name;

  return (
    <span
      ref={(el) => { if (el) connect(drag(el)); }}
      title={`{{${name}}} — ${TYPE_LABELS[type]}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: '4px',
        padding: '1px 7px',
        fontSize: '11pt',
        color,
        fontWeight: 500,
        cursor: 'default',
        userSelect: 'none',
        margin: '0 2px',
      }}
    >
      {prefix && <span style={{ opacity: 0.6 }}>{prefix}</span>}
      <span style={{ fontFamily: 'monospace', fontSize: '10pt' }}>{'{{'}</span>
      <span>{display}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '10pt' }}>{'}}'}</span>
      {suffix && <span style={{ opacity: 0.6 }}>{suffix}</span>}
    </span>
  );
};

VariableBlock.craft = {
  displayName: 'Variável',
  props: { name: 'variavel', label: '', type: 'text', prefix: '', suffix: '' } as VariableBlockProps,
  related: { toolbar: VariableBlockSettings },
};
