import { useEditor } from '@craftjs/core';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { renderCraftToHtml } from '@/lib/craftRenderer';
import type { VarType } from './useVariableDetector';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  templateId: string | undefined;
  form: { name: string; category: string; description: string };
  variableMeta?: Record<string, VarType>;
  debounceMs?: number;
}

export function useAutoSave({ templateId, form, variableMeta = {}, debounceMs = 2000 }: UseAutoSaveOptions) {
  const { query } = useEditor();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const variableMetaRef = useRef(variableMeta);
  variableMetaRef.current = variableMeta;

  // Track editor state changes via node count changes (simple heuristic)
  const { stateKey } = useEditor((state) => ({
    stateKey: Object.keys(state.nodes).join(','),
  }));

  useEffect(() => {
    if (!templateId) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const craftJson = JSON.parse(query.serialize()) as Record<string, unknown>;
        const jsonStr = JSON.stringify(craftJson);

        // Extract variables
        const varRegex = /\{\{(\w+)\}\}/g;
        const vars = new Set<string>();
        let m: RegExpExecArray | null;
        while ((m = varRegex.exec(jsonStr)) !== null) vars.add(m[1]);

        const html = renderCraftToHtml(craftJson);
        const { name, category, description } = formRef.current;

        setSaveStatus('saving');
        await api.put(`/templates/${templateId}`, {
          name,
          description: description || undefined,
          category,
          schema: { craftJson, content: html, variableMeta: variableMetaRef.current },
          variables: Array.from(vars),
        });
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch {
        setSaveStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stateKey, templateId, debounceMs]);

  return { saveStatus, lastSaved };
}
