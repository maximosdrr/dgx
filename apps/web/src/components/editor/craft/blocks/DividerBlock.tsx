'use client';
import { useNode } from '@craftjs/core';

export interface DividerBlockProps {
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  marginTop: number;
  marginBottom: number;
  thickness: number;
}

const DividerBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as DividerBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Estilo</label>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <button key={s}
              onClick={() => setProp((p: DividerBlockProps) => { p.style = s; })}
              className={`flex-1 py-1 text-xs border rounded ${props.style === s ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {s === 'solid' ? 'Sólido' : s === 'dashed' ? 'Tracejado' : 'Pontilhado'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cor</label>
        <input type="color" value={props.color}
          onChange={(e) => setProp((p: DividerBlockProps) => { p.color = e.target.value; })}
          className="w-8 h-8 cursor-pointer border rounded" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Espessura (px)</label>
        <input type="number" min={1} max={8} value={props.thickness}
          onChange={(e) => setProp((p: DividerBlockProps) => { p.thickness = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Margem superior (px)</label>
          <input type="number" min={0} max={60} value={props.marginTop}
            onChange={(e) => setProp((p: DividerBlockProps) => { p.marginTop = +e.target.value; })}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Margem inferior (px)</label>
          <input type="number" min={0} max={60} value={props.marginBottom}
            onChange={(e) => setProp((p: DividerBlockProps) => { p.marginBottom = +e.target.value; })}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
    </div>
  );
};

export const DividerBlock = ({
  style = 'solid',
  color = '#d1d5db',
  marginTop = 12,
  marginBottom = 12,
  thickness = 1,
}: Partial<DividerBlockProps>) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(el) => { if (el) connect(drag(el)); }} style={{ margin: `${marginTop}px 0 ${marginBottom}px` }}>
      <hr style={{ borderTop: `${thickness}px ${style} ${color}`, border: 'none', borderTopStyle: style, borderTopWidth: `${thickness}px`, borderTopColor: color }} />
    </div>
  );
};

DividerBlock.craft = {
  displayName: 'Divisor',
  props: { style: 'solid', color: '#d1d5db', marginTop: 12, marginBottom: 12, thickness: 1 } as DividerBlockProps,
  related: { toolbar: DividerBlockSettings },
};
