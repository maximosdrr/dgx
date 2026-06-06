'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  variables: string[];
}

interface Props {
  template: Template;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateModal({ template, onClose, onSuccess }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(template.variables.map((v) => [v, ''])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setError('');
    setLoading(true);
    try {
      await api.post('/documents/generate', {
        templateId: template.id,
        variables: values,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error?.title ?? 'Erro ao gerar documento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gerar: {template.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {template.variables.length === 0 && (
            <p className="text-gray-500 text-sm">Este template não tem variáveis.</p>
          )}

          {template.variables.map((variable) => (
            <div key={variable}>
              <label className="block text-sm font-medium mb-1">
                {variable.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                value={values[variable] ?? ''}
                onChange={(e) => setValues({ ...values, [variable]: e.target.value })}
                placeholder={`{{${variable}}}`}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Gerando PDF...' : 'Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
