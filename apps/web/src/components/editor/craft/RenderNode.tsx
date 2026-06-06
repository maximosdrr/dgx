'use client';
import { useNode, useEditor } from '@craftjs/core';
import { useRef, useEffect, useState, createElement } from 'react';
import ReactDOM from 'react-dom';

export const RenderNode = ({ render }: { render: React.ReactElement }) => {
  const { id } = useNode();
  const { actions, query, isActive } = useEditor((state, q) => ({
    isActive: q.getEvent('selected').contains(id),
  }));
  const {
    connectors: { drag },
    isDraggable,
    displayName,
    parentId,
  } = useNode((node) => ({
    isDraggable: query.node(node.id).isDraggable(),
    displayName: node.data.displayName || node.data.name,
    parentId: node.data.parent,
  }));

  // A block is deletable if it has a parent (i.e. it's not ROOT itself).
  // We do NOT rely on query.node(id).isDeletable() because Craft.js incorrectly
  // returns false for children of a canvas whose parent has canDrag: () => false.
  const canDelete = id !== 'ROOT' && parentId !== undefined;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Resolve portal target after mount (DOM is ready)
  useEffect(() => {
    setPortalTarget(document.getElementById('craft-actions-portal'));
  }, []);

  // Recalculate floating bar position whenever selection state changes
  useEffect(() => {
    if (!isActive || !wrapperRef.current) { setPos(null); return; }
    const rect = wrapperRef.current.getBoundingClientRect();
    const canvas = document.getElementById('craft-canvas-scroll');
    const scrollTop = canvas?.scrollTop ?? 0;
    const scrollLeft = canvas?.scrollLeft ?? 0;
    const canvasRect = canvas?.getBoundingClientRect();
    setPos({
      top: rect.top + scrollTop - (canvasRect?.top ?? 0) - 28,
      left: rect.left + scrollLeft - (canvasRect?.left ?? 0),
      width: rect.width,
    });
  }, [isActive]);

  // Keyboard Delete/Backspace: delete selected block when focus is NOT inside
  // an editable element (contentEditable div, input, textarea)
  useEffect(() => {
    if (!isActive || !canDelete) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          (active as HTMLElement).isContentEditable)
      ) return;
      e.preventDefault();
      actions.delete(id);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, canDelete, id, actions]);

  const getIndex = () => {
    if (!parentId) return -1;
    const parentNode = query.node(parentId).get();
    return parentNode?.data?.nodes?.indexOf(id) ?? -1;
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = getIndex();
    if (parentId && idx > 0) actions.move(id, parentId, idx - 1);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = getIndex();
    if (parentId) {
      const parentNode = query.node(parentId).get();
      const siblings = parentNode?.data?.nodes ?? [];
      if (idx < siblings.length - 1) actions.move(id, parentId, idx + 2);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDelete) actions.delete(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nodeData = query.node(id).get();
      const idx = getIndex();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const freshTree = query
        .parseReactElement(createElement(nodeData.data.type as any, nodeData.data.props))
        .toNodeTree();
      if (parentId) actions.addNodeTree(freshTree, parentId, idx + 1);
    } catch { /* noop */ }
  };

  const actionBar = isActive && pos ? (
    <div
      style={{
        position: 'absolute',
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        width: `${pos.width}px`,
        height: '26px',
        background: '#3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        zIndex: 50,
        borderRadius: '4px 4px 0 0',
        userSelect: 'none',
        fontSize: '11px',
        color: '#fff',
        pointerEvents: 'all',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.15)',
      }}
    >
      {/* Drag handle + label */}
      <span
        ref={(el) => { if (el && isDraggable) drag(el); }}
        style={{
          cursor: isDraggable ? 'grab' : 'default',
          display: 'flex', alignItems: 'center', gap: '4px',
          flex: 1, minWidth: 0, overflow: 'hidden',
        }}
      >
        {isDraggable && <span style={{ opacity: 0.8 }}>⠿</span>}
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
      </span>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
        <ActionBtn onClick={handleMoveUp} title="Mover para cima">↑</ActionBtn>
        <ActionBtn onClick={handleMoveDown} title="Mover para baixo">↓</ActionBtn>
        <ActionBtn onClick={handleDuplicate} title="Duplicar">⧉</ActionBtn>
        {canDelete && (
          <ActionBtn onClick={handleDelete} title="Deletar (Del)" danger>✕</ActionBtn>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          outline: isActive ? '2px solid #3b82f6' : undefined,
          outlineOffset: '1px',
        }}
      >
        {render}
      </div>
      {portalTarget && actionBar
        ? ReactDOM.createPortal(actionBar, portalTarget)
        : actionBar}
    </>
  );
};

function ActionBtn({
  onClick, title, children, danger,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        color: danger ? '#fca5a5' : '#fff',
        cursor: 'pointer',
        padding: '0 5px',
        fontSize: '13px',
        lineHeight: '26px',
        borderRadius: '3px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
