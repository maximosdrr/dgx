'use client';
import { useNode } from '@craftjs/core';
import { useRef, useEffect } from 'react';

export interface ColumnsBlockProps {
  columns: 2 | 3;
  col1: string;
  col2: string;
  col3: string;
  gap: number;
  fontSize: number;
}

const ColumnsBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as ColumnsBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Número de colunas</label>
        <div className="flex gap-2">
          {([2, 3] as const).map((c) => (
            <button key={c}
              onClick={() => setProp((p: ColumnsBlockProps) => { p.columns = c; })}
              className={`flex-1 py-1 text-sm border rounded ${props.columns === c ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {c} colunas
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Espaço entre colunas (px)</label>
        <input type="number" min={0} max={60} value={props.gap}
          onChange={(e) => setProp((p: ColumnsBlockProps) => { p.gap = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tamanho do texto (pt)</label>
        <input type="number" min={6} max={24} value={props.fontSize}
          onChange={(e) => setProp((p: ColumnsBlockProps) => { p.fontSize = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
    </div>
  );
};

function useColRef(initial: string, onChange: (v: string) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const init = useRef(false);
  const focused = useRef(false);
  useEffect(() => {
    if (ref.current && !init.current) { ref.current.innerHTML = initial; init.current = true; }
  }, []); // intentionally empty — initial only used on first mount
  useEffect(() => {
    if (ref.current && init.current && !focused.current && ref.current.innerHTML !== initial) {
      ref.current.innerHTML = initial;
    }
  }, [initial]);
  return {
    ref,
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    onFocus: () => { focused.current = true; },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => { focused.current = false; onChange(e.currentTarget.innerHTML); },
  };
}

export const ColumnsBlock = ({
  columns = 2,
  col1 = '<p>Conteúdo coluna 1</p>',
  col2 = '<p>Conteúdo coluna 2</p>',
  col3 = '<p>Conteúdo coluna 3</p>',
  gap = 16,
  fontSize = 11,
}: Partial<ColumnsBlockProps>) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();

  const c1 = useColRef(col1, (v) => setProp((p: ColumnsBlockProps) => { p.col1 = v; }));
  const c2 = useColRef(col2, (v) => setProp((p: ColumnsBlockProps) => { p.col2 = v; }));
  const c3 = useColRef(col3, (v) => setProp((p: ColumnsBlockProps) => { p.col3 = v; }));

  const colStyle: React.CSSProperties = {
    flex: 1,
    minHeight: '2em',
    outline: 'none',
    fontSize: `${fontSize}pt`,
    lineHeight: 1.5,
    wordBreak: 'break-word',
    padding: '4px 0',
  };

  return (
    <div
      ref={(el) => { if (el) connect(drag(el)); }}
      style={{ display: 'flex', gap: `${gap}px`, margin: '8px 0' }}
    >
      <div ref={c1.ref} contentEditable suppressContentEditableWarning onFocus={c1.onFocus} onBlur={c1.onBlur} style={colStyle} />
      <div ref={c2.ref} contentEditable suppressContentEditableWarning onFocus={c2.onFocus} onBlur={c2.onBlur} style={colStyle} />
      {columns === 3 && (
        <div ref={c3.ref} contentEditable suppressContentEditableWarning onFocus={c3.onFocus} onBlur={c3.onBlur} style={colStyle} />
      )}
    </div>
  );
};

ColumnsBlock.craft = {
  displayName: 'Colunas',
  props: { columns: 2, col1: '<p>Conteúdo coluna 1</p>', col2: '<p>Conteúdo coluna 2</p>', col3: '<p>Conteúdo coluna 3</p>', gap: 16, fontSize: 11 } as ColumnsBlockProps,
  related: { toolbar: ColumnsBlockSettings },
};
