'use client';
import { useNode } from '@craftjs/core';

export interface SpacerBlockProps {
  height: number;
}

const SpacerBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as SpacerBlockProps }));
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Altura (px)</label>
      <input type="number" min={4} max={200} value={props.height}
        onChange={(e) => setProp((p: SpacerBlockProps) => { p.height = +e.target.value; })}
        className="w-full border rounded px-2 py-1 text-sm" />
    </div>
  );
};

export const SpacerBlock = ({ height = 24 }: Partial<SpacerBlockProps>) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div
      ref={(el) => { if (el) connect(drag(el)); }}
      style={{ height: `${height}px`, minHeight: `${height}px` }}
      className="w-full select-none opacity-0 hover:opacity-100 transition-opacity"
      aria-label={`Espaço de ${height}px`}
    >
      <div className="h-full flex items-center justify-center">
        <div className="w-full border-t border-dashed border-blue-200 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-xs text-blue-300 bg-white px-1">{height}px</span>
        </div>
      </div>
    </div>
  );
};

SpacerBlock.craft = {
  displayName: 'Espaço',
  props: { height: 24 } as SpacerBlockProps,
  related: { toolbar: SpacerBlockSettings },
};
