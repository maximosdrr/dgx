'use client';
import { useNode } from '@craftjs/core';

export interface SignatureBlockProps {
  party: string;
  role: string;
  showDate: boolean;
  showLine: boolean;
  align: 'left' | 'center' | 'right';
  marginTop: number;
}

const SignatureBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as SignatureBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Parte / Signatário</label>
        <input value={props.party}
          onChange={(e) => setProp((p: SignatureBlockProps) => { p.party = e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cargo / Função</label>
        <input value={props.role}
          onChange={(e) => setProp((p: SignatureBlockProps) => { p.role = e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a}
              onClick={() => setProp((p: SignatureBlockProps) => { p.align = a; })}
              className={`flex-1 py-1 text-xs border rounded ${props.align === a ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setProp((p: SignatureBlockProps) => { p.showLine = !p.showLine; })}
          className={`flex-1 py-1 text-xs border rounded ${props.showLine ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          Linha
        </button>
        <button onClick={() => setProp((p: SignatureBlockProps) => { p.showDate = !p.showDate; })}
          className={`flex-1 py-1 text-xs border rounded ${props.showDate ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          Data
        </button>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Margem superior (px)</label>
        <input type="number" min={0} max={120} value={props.marginTop}
          onChange={(e) => setProp((p: SignatureBlockProps) => { p.marginTop = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
    </div>
  );
};

export const SignatureBlock = ({
  party = 'CONTRATANTE',
  role = '',
  showDate = true,
  showLine = true,
  align = 'center',
  marginTop = 40,
}: Partial<SignatureBlockProps>) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(el) => { if (el) connect(drag(el)); }}
      style={{ textAlign: align, marginTop: `${marginTop}px`, margin: `${marginTop}px 0 12px` }}
    >
      <div style={{ display: 'inline-block', minWidth: '220px', textAlign: 'center' }}>
        {showLine && (
          <div style={{ borderTop: '1px solid #374151', marginBottom: '6px', width: '100%' }} />
        )}
        <div style={{ fontWeight: 700, fontSize: '11pt', textTransform: 'uppercase' }}>{party}</div>
        {role && <div style={{ fontSize: '10pt', color: '#6b7280', marginTop: '2px' }}>{role}</div>}
        {showDate && (
          <div style={{ fontSize: '10pt', color: '#6b7280', marginTop: '6px' }}>
            Local e Data: ___________________
          </div>
        )}
      </div>
    </div>
  );
};

SignatureBlock.craft = {
  displayName: 'Assinatura',
  props: { party: 'CONTRATANTE', role: '', showDate: true, showLine: true, align: 'center', marginTop: 40 } as SignatureBlockProps,
  related: { toolbar: SignatureBlockSettings },
};
