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

export interface TextBlockProps {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  bold: boolean;
  italic: boolean;
  lineHeight: number;
}

const AlignBtn = ({ current, value, label, onChange }: { current: string; value: string; label: string; onChange: (v: string) => void }) => (
  <button
    onClick={() => onChange(value)}
    className={`flex-1 py-1 text-xs border rounded ${current === value ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}
  >{label}</button>
);

const TextBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as TextBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tamanho (pt)</label>
        <input type="number" min={6} max={72} value={props.fontSize}
          onChange={(e) => setProp((p: TextBlockProps) => { p.fontSize = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Fonte</label>
        <select value={props.fontFamily}
          onChange={(e) => setProp((p: TextBlockProps) => { p.fontFamily = e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm bg-white">
          <option value="inherit">Padrão</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cor do texto</label>
        <input type="color" value={props.color}
          onChange={(e) => setProp((p: TextBlockProps) => { p.color = e.target.value; })}
          className="w-8 h-8 cursor-pointer border rounded" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left','center','right','justify'] as const).map((a) => (
            <AlignBtn key={a} current={props.textAlign} value={a}
              label={a === 'left' ? '⇤' : a === 'center' ? '⇔' : a === 'right' ? '⇥' : '≡'}
              onChange={(v) => setProp((p: TextBlockProps) => { p.textAlign = v as typeof p.textAlign; })} />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setProp((p: TextBlockProps) => { p.bold = !p.bold; })}
          className={`flex-1 py-1 text-sm font-bold border rounded ${props.bold ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>B</button>
        <button onClick={() => setProp((p: TextBlockProps) => { p.italic = !p.italic; })}
          className={`flex-1 py-1 text-sm italic border rounded ${props.italic ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>I</button>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Espaçamento de linha</label>
        <select value={props.lineHeight}
          onChange={(e) => setProp((p: TextBlockProps) => { p.lineHeight = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm bg-white">
          {[1, 1.2, 1.5, 1.6, 2].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
    </div>
  );
};

export const TextBlock = ({
  content = '<p>Clique para editar...</p>',
  fontSize = 12,
  fontFamily = 'inherit',
  color = '#111111',
  textAlign = 'left',
  bold = false,
  italic = false,
  lineHeight = 1.6,
}: Partial<TextBlockProps>) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const divRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);
  const focused = useRef(false);

  useEffect(() => {
    if (divRef.current && !initialized.current) {
      divRef.current.innerHTML = parseContentWithVariables(content);
      initialized.current = true;
    }
  }, []); // intentionally empty — content only used on first mount

  useEffect(() => {
    if (divRef.current && initialized.current && !focused.current) {
      const parsedContent = parseContentWithVariables(content);
      if (divRef.current.innerHTML !== parsedContent) {
        divRef.current.innerHTML = parsedContent;
      }
    }
  }, [content]);

  useEffect(() => () => {
    if (divRef.current) clearEditableSelection(divRef.current);
  }, []);

  const syncContent = (html: string) => {
    setProp((p: TextBlockProps) => { p.content = html; });
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    rememberEditableSelection(el, 'content');
    syncContent(el.innerHTML);

    requestAnimationFrame(() => {
      if (convertVariableBeforeCursor(el)) syncContent(el.innerHTML);
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    rememberEditableSelection(el, 'content');
    if (e.key !== '}') return;

    requestAnimationFrame(() => {
      if (convertVariableBeforeCursor(el)) syncContent(el.innerHTML);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    rememberEditableSelection(e.currentTarget, 'content');
    if (e.key === 'Backspace' && deleteVariableChipBeforeCursor(e.currentTarget)) {
      e.preventDefault();
      syncContent(e.currentTarget.innerHTML);
    }
  };

  return (
    <div
      ref={(el) => {
        if (el) {
          connect(drag(el));
          divRef.current = el;
          el.dataset.craftPropField = 'content';
          if (!initialized.current) {
            el.innerHTML = parseContentWithVariables(content);
            initialized.current = true;
          }
        }
      }}
      contentEditable
      suppressContentEditableWarning
      onFocus={(e) => {
        focused.current = true;
        rememberEditableSelection(e.currentTarget, 'content');
      }}
      onMouseUp={(e) => rememberEditableSelection(e.currentTarget, 'content')}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onBlur={(e) => {
        focused.current = false;
        applyVariableHighlight(e.currentTarget);
        syncContent(e.currentTarget.innerHTML);
      }}
      style={{
        fontSize: `${fontSize}pt`,
        fontFamily,
        color,
        textAlign,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? 'italic' : 'normal',
        lineHeight,
        minHeight: '1.5em',
        outline: 'none',
        wordBreak: 'break-word',
        padding: '4px 0',
      }}
    />
  );
};

TextBlock.craft = {
  displayName: 'Texto',
  props: {
    content: '<p>Clique para editar...</p>',
    fontSize: 12,
    fontFamily: 'inherit',
    color: '#111111',
    textAlign: 'left',
    bold: false,
    italic: false,
    lineHeight: 1.6,
  } as TextBlockProps,
  related: { toolbar: TextBlockSettings },
};
