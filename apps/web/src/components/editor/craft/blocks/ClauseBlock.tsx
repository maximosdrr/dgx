'use client';
import { useNode } from '@craftjs/core';
import { useRef, useEffect } from 'react';
import {
  applyVariableHighlight,
  clearEditableSelection,
  convertVariableBeforeCursor,
  deleteVariableChipBeforeCursor,
  parseContentWithVariables,
  rememberEditableSelection,
} from '@/lib/editor/variableParser';

export interface ClauseBlockProps {
  number: string;
  title: string;
  content: string;
  showNumber: boolean;
}

const ClauseBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as ClauseBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Número da cláusula</label>
        <input value={props.number}
          onChange={(e) => setProp((p: ClauseBlockProps) => { p.number = e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <button onClick={() => setProp((p: ClauseBlockProps) => { p.showNumber = !p.showNumber; })}
          className={`w-full py-1 text-sm border rounded ${props.showNumber ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          {props.showNumber ? 'Ocultar número' : 'Mostrar número'}
        </button>
      </div>
    </div>
  );
};

const useEditableRef = (
  initialContent: string,
  onBlur: (html: string) => void,
  options: { field: keyof ClauseBlockProps; highlightVariables?: boolean; onInputChange?: (html: string) => void }
) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);
  const focused = useRef(false);
  const highlightVariables = options.highlightVariables ?? false;

  const decorate = (html: string) => highlightVariables ? parseContentWithVariables(html) : html;

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.dataset.craftPropField = String(options.field);
      ref.current.innerHTML = decorate(initialContent);
      initialized.current = true;
    }
  }, []); // intentionally empty — initialContent only used on first mount

  useEffect(() => {
    if (ref.current && initialized.current && !focused.current) {
      const parsedContent = decorate(initialContent);
      if (ref.current.innerHTML !== parsedContent) ref.current.innerHTML = parsedContent;
    }
  }, [initialContent]);

  useEffect(() => () => {
    if (ref.current) clearEditableSelection(ref.current);
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    rememberEditableSelection(el, String(options.field));
    options.onInputChange?.(el.innerHTML);

    if (!highlightVariables) return;
    requestAnimationFrame(() => {
      if (convertVariableBeforeCursor(el)) options.onInputChange?.(el.innerHTML);
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    rememberEditableSelection(el, String(options.field));
    if (!highlightVariables || e.key !== '}') return;

    requestAnimationFrame(() => {
      if (convertVariableBeforeCursor(el)) options.onInputChange?.(el.innerHTML);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    rememberEditableSelection(e.currentTarget, String(options.field));
    if (highlightVariables && e.key === 'Backspace' && deleteVariableChipBeforeCursor(e.currentTarget)) {
      e.preventDefault();
      options.onInputChange?.(e.currentTarget.innerHTML);
    }
  };

  const handlers = {
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
      focused.current = true;
      rememberEditableSelection(e.currentTarget, String(options.field));
    },
    onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => rememberEditableSelection(e.currentTarget, String(options.field)),
    onKeyUp: handleKeyUp,
    onKeyDown: handleKeyDown,
    onInput: handleInput,
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      focused.current = false;
      if (highlightVariables) applyVariableHighlight(e.currentTarget);
      onBlur(e.currentTarget.innerHTML);
    },
  };

  return { ref, handlers };
};

export const ClauseBlock = ({
  number = '1',
  title = 'DAS DISPOSIÇÕES GERAIS',
  content = '<p>Inserir o conteúdo da cláusula aqui...</p>',
  showNumber = true,
}: Partial<ClauseBlockProps>) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const titleEdit = useEditableRef(
    title,
    (html) => setProp((p: ClauseBlockProps) => { p.title = html; }),
    { field: 'title' },
  );
  const contentEdit = useEditableRef(
    content,
    (html) => setProp((p: ClauseBlockProps) => { p.content = html; }),
    {
      field: 'content',
      highlightVariables: true,
      onInputChange: (html) => setProp((p: ClauseBlockProps) => { p.content = html; }),
    },
  );

  return (
    <div
      ref={(el) => { if (el) { connect(drag(el)); containerRef.current = el; } }}
      style={{ margin: '12px 0' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
        {showNumber && (
          <span style={{ fontWeight: 700, fontSize: '12pt', minWidth: '1.5em' }}>{number}.</span>
        )}
        <div
          ref={titleEdit.ref}
          contentEditable
          suppressContentEditableWarning
          {...titleEdit.handlers}
          style={{
            fontWeight: 700,
            fontSize: '12pt',
            textTransform: 'uppercase',
            outline: 'none',
            flex: 1,
            letterSpacing: '0.02em',
          }}
        />
      </div>
      <div
        ref={contentEdit.ref}
        contentEditable
        suppressContentEditableWarning
        {...contentEdit.handlers}
        style={{
          fontSize: '12pt',
          lineHeight: 1.7,
          textAlign: 'justify',
          outline: 'none',
          minHeight: '1.5em',
          wordBreak: 'break-word',
          marginLeft: showNumber ? '1.8em' : 0,
        }}
      />
    </div>
  );
};

ClauseBlock.craft = {
  displayName: 'Cláusula',
  props: {
    number: '1',
    title: 'DAS DISPOSIÇÕES GERAIS',
    content: '<p>Inserir o conteúdo da cláusula aqui...</p>',
    showNumber: true,
  } as ClauseBlockProps,
  related: { toolbar: ClauseBlockSettings },
};
