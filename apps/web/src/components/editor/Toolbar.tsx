'use client';

import { Editor } from '@tiptap/react';
import { useState } from 'react';

interface Props {
  editor: Editor;
}

const Btn = ({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-sm font-medium transition ${
      active
        ? 'bg-gray-200 text-gray-900'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

export default function Toolbar({ editor }: Props) {
  const [varModal, setVarModal] = useState(false);
  const [varName, setVarName] = useState('');

  function insertVariable() {
    const name = varName.trim().replace(/\s+/g, '_').toLowerCase();
    if (!name) return;
    editor.chain().focus().insertContent(`{{${name}}}`).run();
    setVarName('');
    setVarModal(false);
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b bg-gray-50">
        {/* Text style */}
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito (Ctrl+B)">
          <strong>B</strong>
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico (Ctrl+I)">
          <em>I</em>
        </Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado (Ctrl+U)">
          <span className="underline">U</span>
        </Btn>
        <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <span className="line-through">S</span>
        </Btn>

        <Sep />

        {/* Headings */}
        <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
          H1
        </Btn>
        <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
          H2
        </Btn>
        <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
          H3
        </Btn>

        <Sep />

        {/* Alignment */}
        <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinhar à esquerda">
          ⬅
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centralizar">
          ☰
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinhar à direita">
          ➡
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar">
          ≡
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">
          • —
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          1. —
        </Btn>

        <Sep />

        {/* Table */}
        <Btn active={false} onClick={insertTable} title="Inserir tabela">
          ⊞ Tabela
        </Btn>

        <Sep />

        {/* Variable */}
        <button
          type="button"
          onClick={() => setVarModal(true)}
          title="Inserir variável"
          className="px-3 py-1 rounded text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {'{ } Variável'}
        </button>

        <Sep />

        {/* History */}
        <Btn active={false} onClick={() => editor.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">
          ↩
        </Btn>
        <Btn active={false} onClick={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Y)">
          ↪
        </Btn>
      </div>

      {varModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-lg">Inserir variável</h3>
            <p className="text-sm text-gray-500">
              Será inserido como <code className="bg-gray-100 px-1 rounded">{'{{nome_variavel}}'}</code>
            </p>
            <input
              autoFocus
              type="text"
              placeholder="ex: nome_cliente"
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insertVariable()}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">
              Use apenas letras, números e underscore. Espaços viram <code>_</code>.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setVarModal(false); setVarName(''); }}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertVariable}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
