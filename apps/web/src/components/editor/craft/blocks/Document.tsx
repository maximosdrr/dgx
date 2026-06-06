'use client';
import { useNode, useEditor } from '@craftjs/core';

interface DocumentProps {
  children?: React.ReactNode;
}

/** Root canvas container — represents the A4 document body */
export const Document = ({ children }: DocumentProps) => {
  const { connectors: { connect } } = useNode();
  const { id } = useNode();
  const { isEmpty } = useEditor((state) => ({
    isEmpty:
      !!state.nodes[id] &&
      (state.nodes[id].data.nodes ?? []).length === 0,
  }));

  return (
    <div
      ref={(el) => { if (el) connect(el); }}
      style={{
        // Must be a large fixed minimum so the drop zone fills the A4 area.
        // Using '100%' resolves to 'auto' when parent only has minHeight, not height.
        minHeight: '930px',
        outline: 'none',
        position: 'relative',
      }}
    >
      {isEmpty ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            userSelect: 'none',
            pointerEvents: 'none',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '36px', opacity: 0.4 }}>📄</span>
          <p style={{ fontSize: '14px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', lineHeight: 1.5 }}>
            Arraste um bloco da biblioteca para começar
          </p>
        </div>
      ) : null}
      {children}
    </div>
  );
};

Document.craft = {
  displayName: 'Documento',
  isCanvas: true,
  rules: {
    canDrag: () => false,
    canMoveIn: () => true,
  },
};
