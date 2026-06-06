'use client';
import { useNode } from '@craftjs/core';
import { useRef } from 'react';
import { api } from '@/lib/api';

export interface ImageBlockProps {
  src: string;
  alt: string;
  width: number;
  align: 'left' | 'center' | 'right';
  templateId?: string;
}

const ImageBlockSettings = ({ templateId }: { templateId?: string }) => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props as ImageBlockProps }));
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!templateId) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/templates/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProp((p: ImageBlockProps) => { p.src = data.url; });
    } catch {
      alert('Erro ao fazer upload da imagem');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">URL da imagem</label>
        <input value={props.src}
          onChange={(e) => setProp((p: ImageBlockProps) => { p.src = e.target.value; })}
          placeholder="https://..."
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      {templateId && (
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          <button onClick={() => fileRef.current?.click()}
            className="w-full py-1.5 text-sm border border-dashed rounded hover:bg-gray-50 text-gray-600">
            ↑ Upload de arquivo
          </button>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Texto alternativo</label>
        <input value={props.alt}
          onChange={(e) => setProp((p: ImageBlockProps) => { p.alt = e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Largura (%)</label>
        <input type="number" min={10} max={100} value={props.width}
          onChange={(e) => setProp((p: ImageBlockProps) => { p.width = +e.target.value; })}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alinhamento</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a}
              onClick={() => setProp((p: ImageBlockProps) => { p.align = a; })}
              className={`flex-1 py-1 text-xs border rounded ${props.align === a ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'}`}>
              {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ImageBlock = ({
  src = '',
  alt = '',
  width = 100,
  align = 'center',
  // templateId is stored in craft.props and read by ImageBlockSettings via useNode — not used in render
}: Partial<Omit<ImageBlockProps, 'templateId'>>) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(el) => { if (el) connect(drag(el)); }}
      style={{ textAlign: align, margin: '8px 0' }}
    >
      {src ? (
        <img src={src} alt={alt} style={{ width: `${width}%`, maxWidth: '100%', borderRadius: '4px' }} />
      ) : (
        <div style={{
          width: `${width}%`,
          maxWidth: '100%',
          minHeight: '80px',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '12pt',
        }}>
          🖼 Imagem (configure no painel)
        </div>
      )}
    </div>
  );
};

// Settings needs templateId context — pass via CraftEditor wrapper
ImageBlock.craft = {
  displayName: 'Imagem',
  props: { src: '', alt: '', width: 100, align: 'center', templateId: undefined } as ImageBlockProps,
  related: { toolbar: ImageBlockSettings },
};
