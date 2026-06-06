'use client';
import { Frame, Element, useEditor } from '@craftjs/core';
import { Document } from './blocks/Document';

interface EditorCanvasProps {
  initialData?: string;
  defaultChildren?: React.ReactNode;
}

/** Inner component — needs to be inside <Editor> context to use useEditor */
function CanvasInner({ initialData, defaultChildren }: EditorCanvasProps) {
  const { isDragging } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
  }));

  return (
    <div
      id="craft-canvas-scroll"
      style={{
        flex: 1,
        overflow: 'auto',
        background: '#e5e7eb',
        padding: '32px 24px 60px',
        position: 'relative',
      }}
    >
      {/* Portal target for floating action bars */}
      <div
        id="craft-actions-portal"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 40,
        }}
      />

      {/* A4 page simulation — 794px wide, at least full A4 height */}
      <div
        style={{
          width: '794px',
          // Explicit minHeight so '100%' in child Document resolves correctly.
          // 1123px = A4 at 96dpi. Height is NOT fixed so page can grow.
          minHeight: '1123px',
          margin: '0 auto',
          background: '#ffffff',
          boxShadow: isDragging
            ? '0 0 0 3px #3b82f6, 0 4px 24px rgba(0,0,0,0.12)'
            : '0 4px 24px rgba(0,0,0,0.12)',
          borderRadius: '2px',
          padding: '60px',
          boxSizing: 'border-box',
          position: 'relative',
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: '12pt',
          color: '#111',
          lineHeight: 1.6,
          transition: 'box-shadow 0.15s',
        }}
      >
        {initialData ? (
          <Frame data={initialData} />
        ) : (
          <Frame>
            <Element is={Document} canvas>
              {defaultChildren}
            </Element>
          </Frame>
        )}
      </div>

      {/* Multi-page stub */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          disabled
          title="Multi-página disponível em breve"
          style={{
            padding: '8px 20px',
            border: '2px dashed #9ca3af',
            borderRadius: '8px',
            background: 'transparent',
            color: '#9ca3af',
            fontSize: '13px',
            cursor: 'not-allowed',
          }}
        >
          + Adicionar página
        </button>
      </div>
    </div>
  );
}

export const EditorCanvas = (props: EditorCanvasProps) => <CanvasInner {...props} />;
