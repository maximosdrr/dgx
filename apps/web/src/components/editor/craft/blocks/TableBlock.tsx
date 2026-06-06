'use client';
import { useNode } from '@craftjs/core';
import { useState } from 'react';

export interface TableBlockProps {
  rows: number;
  cols: number;
  headers: string[];
  data: string[][];
  striped: boolean;
  bordered: boolean;
  fontSize: number;
}

const TableBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as TableBlockProps }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Linhas</label>
          <input type="number" min={1} max={30} value={props.rows}
            onChange={(e) => {
              const r = +e.target.value;
              setProp((p: TableBlockProps) => {
                p.rows = r;
                while (p.data.length < r) p.data.push(Array(p.cols).fill(''));
                p.data = p.data.slice(0, r);
              });
            }}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Colunas</label>
          <input type="number" min={1} max={10} value={props.cols}
            onChange={(e) => {
              const c = +e.target.value;
              setProp((p: TableBlockProps) => {
                p.cols = c;
                p.headers = p.headers.slice(0, c);
                while (p.headers.length < c) p.headers.push(`Col ${p.headers.length + 1}`);
                p.data = p.data.map((row) => {
                  const r = row.slice(0, c);
                  while (r.length < c) r.push('');
                  return r;
                });
              });
            }}
            className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tamanho do texto (pt)</label>
        <input type="number" min={6} max={18} value={props.fontSize}
          onChange={(e) => setProp((p: TableBlockProps) => { p.fontSize = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setProp((p: TableBlockProps) => { p.striped = !p.striped; })}
          className={`flex-1 py-1 text-xs border rounded ${props.striped ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          Listrado
        </button>
        <button onClick={() => setProp((p: TableBlockProps) => { p.bordered = !p.bordered; })}
          className={`flex-1 py-1 text-xs border rounded ${props.bordered ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
          Bordas
        </button>
      </div>
    </div>
  );
};

export const TableBlock = ({
  rows = 3,
  cols = 3,
  headers = ['Coluna 1', 'Coluna 2', 'Coluna 3'],
  data = [['', '', ''], ['', '', ''], ['', '', '']],
  striped = true,
  bordered = true,
  fontSize = 11,
}: Partial<TableBlockProps>) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const [editCell, setEditCell] = useState<{ type: 'header' | 'data'; row: number; col: number } | null>(null);

  const tdStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: `${fontSize}pt`,
    borderTop: bordered ? '1px solid #d1d5db' : undefined,
    borderBottom: bordered ? '1px solid #d1d5db' : undefined,
    borderLeft: bordered ? '1px solid #d1d5db' : undefined,
    borderRight: bordered ? '1px solid #d1d5db' : undefined,
  };

  const updateHeader = (col: number, val: string) =>
    setProp((p: TableBlockProps) => { p.headers[col] = val; });

  const updateCell = (row: number, col: number, val: string) =>
    setProp((p: TableBlockProps) => { p.data[row][col] = val; });

  return (
    <div ref={(el) => { if (el) connect(drag(el)); }} style={{ margin: '8px 0', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.slice(0, cols).map((h, ci) => (
              <th key={ci} style={{ ...tdStyle, background: '#f3f4f6', fontWeight: 700 }}
                onDoubleClick={() => setEditCell({ type: 'header', row: 0, col: ci })}>
                {editCell?.type === 'header' && editCell.col === ci ? (
                  <input
                    autoFocus
                    defaultValue={h}
                    onBlur={(e) => { updateHeader(ci, e.target.value); setEditCell(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: 700, fontSize: `${fontSize}pt` }}
                  />
                ) : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, rows).map((row, ri) => (
            <tr key={ri} style={{ background: striped && ri % 2 === 1 ? '#f9fafb' : undefined }}>
              {row.slice(0, cols).map((cell, ci) => (
                <td key={ci} style={tdStyle}
                  onDoubleClick={() => setEditCell({ type: 'data', row: ri, col: ci })}>
                  {editCell?.type === 'data' && editCell.row === ri && editCell.col === ci ? (
                    <input
                      autoFocus
                      defaultValue={cell}
                      onBlur={(e) => { updateCell(ri, ci, e.target.value); setEditCell(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: `${fontSize}pt` }}
                    />
                  ) : cell || <span style={{ color: '#9ca3af', fontSize: '10pt' }}>clique duas vezes</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

TableBlock.craft = {
  displayName: 'Tabela',
  props: {
    rows: 3,
    cols: 3,
    headers: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
    data: [['', '', ''], ['', '', ''], ['', '', '']],
    striped: true,
    bordered: true,
    fontSize: 11,
  } as TableBlockProps,
  related: { toolbar: TableBlockSettings },
};
