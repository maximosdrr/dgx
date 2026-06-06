'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import Toolbar from './Toolbar';
import { VariableHighlight } from './extensions/VariableHighlight';
import { extractVariables, formatVariableLabel } from '@/lib/variables';

interface Props {
  initialContent?: string;
  onChange?: (html: string, variables: string[]) => void;
}

export default function TemplateEditor({ initialContent = '', onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do template aqui. Use o botão { } Variável para inserir campos dinâmicos…' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      VariableHighlight,
    ],
    content: initialContent || '<p></p>',
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const vars = extractVariables(html);
      onChange?.(html, vars);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-6',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  const html = editor.getHTML();
  const variables = extractVariables(html);
  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <Toolbar editor={editor} />

      <div className="flex">
        {/* Editor area */}
        <div className="flex-1 min-h-[480px] overflow-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Variables side panel */}
        <div className="w-56 border-l bg-gray-50 p-4 shrink-0">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Variáveis detectadas
          </h4>
          {variables.length === 0 ? (
            <p className="text-xs text-gray-400">
              Nenhuma. Use <strong>{'{ } Variável'}</strong> para inserir.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {variables.map((v) => (
                <li key={v}>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().insertContent(`{{${v}}}`).run()}
                    title="Clique para inserir novamente"
                    className="w-full text-left px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 font-mono hover:bg-blue-100 transition"
                  >
                    {`{{${v}}}`}
                    <span className="block text-blue-500 font-sans font-normal truncate">
                      {formatVariableLabel(v)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-400">{chars} caracteres</p>
          </div>
        </div>
      </div>
    </div>
  );
}
