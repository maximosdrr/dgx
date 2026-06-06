'use client';
import { useNode } from '@craftjs/core';
import { useRef, useEffect } from 'react';

export interface HeadingBlockProps {
  content: string;
  level: 'h1' | 'h2' | 'h3';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  bold: boolean;
}

const HeadingBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as HeadingBlockProps }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nível</label>
        <div className="flex gap-1">
          {(['h1', 'h2', 'h3'] as const).map((l) => (
            <button key={l}
              onClick={() => setProp((p: HeadingBlockProps) => { p.level = l; })}
              className={`flex-1 py-1 text-xs border rounded font-semibold ${props.level === l ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a}
              onClick={() => setProp((p: HeadingBlockProps) => { p.textAlign = a; })}
              className={`flex-1 py-1 text-xs border rounded ${props.textAlign === a ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cor</label>
        <input type="color" value={props.color}
          onChange={(e) => setProp((p: HeadingBlockProps) => { p.color = e.target.value; })}
          className="w-8 h-8 cursor-pointer border rounded" />
      </div>
      <div>
        <button onClick={() => setProp((p: HeadingBlockProps) => { p.bold = !p.bold; })}
          className={`w-full py-1 text-sm font-bold border rounded ${props.bold ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          Negrito
        </button>
      </div>
    </div>
  );
};

const LEVEL_STYLES: Record<string, React.CSSProperties> = {
  h1: { fontSize: '22pt', margin: '16px 0 8px' },
  h2: { fontSize: '17pt', margin: '14px 0 6px' },
  h3: { fontSize: '14pt', margin: '12px 0 4px' },
};

export const HeadingBlock = ({
  content = 'Título',
  level = 'h2',
  textAlign = 'left',
  color = '#111111',
  bold = true,
}: Partial<HeadingBlockProps>) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const divRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);
  const focused = useRef(false);

  useEffect(() => {
    if (divRef.current && !initialized.current) {
      divRef.current.innerHTML = content;
      initialized.current = true;
    }
  }, []); // intentionally empty — content only used on first mount

  useEffect(() => {
    if (divRef.current && initialized.current && !focused.current) {
      if (divRef.current.innerHTML !== content) divRef.current.innerHTML = content;
    }
  }, [content]);

  const sharedStyle: React.CSSProperties = {
    ...LEVEL_STYLES[level],
    textAlign,
    color,
    fontWeight: bold ? 700 : 600,
    outline: 'none',
    wordBreak: 'break-word',
  };

  const refCallback = (el: HTMLDivElement | null) => {
    if (el) {
      connect(drag(el));
      divRef.current = el;
      if (!initialized.current) {
        el.innerHTML = content;
        initialized.current = true;
      }
    }
  };

  const handleFocus = () => { focused.current = true; };
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    focused.current = false;
    setProp((p: HeadingBlockProps) => { p.content = e.currentTarget.innerHTML; });
  };

  if (level === 'h1') {
    return <h1 ref={refCallback} contentEditable suppressContentEditableWarning onFocus={handleFocus} onBlur={handleBlur} style={sharedStyle} />;
  }
  if (level === 'h2') {
    return <h2 ref={refCallback} contentEditable suppressContentEditableWarning onFocus={handleFocus} onBlur={handleBlur} style={sharedStyle} />;
  }
  return <h3 ref={refCallback} contentEditable suppressContentEditableWarning onFocus={handleFocus} onBlur={handleBlur} style={sharedStyle} />;
};

HeadingBlock.craft = {
  displayName: 'Título',
  props: { content: 'Título', level: 'h2', textAlign: 'left', color: '#111111', bold: true } as HeadingBlockProps,
  related: { toolbar: HeadingBlockSettings },
};
