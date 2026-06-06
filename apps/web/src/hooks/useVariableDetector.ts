import { useEditor } from '@craftjs/core';
import { useMemo, useRef } from 'react';
import { extractVariables } from '@/lib/editor/variableParser';

export type VarType = 'text' | 'number' | 'date' | 'currency' | 'cpf' | 'cnpj';

export interface DetectedVariable {
  name: string;
  type: VarType;
}

/**
 * Scans Craft.js node props for variable chips and bare {{varname}} occurrences.
 * Merges with caller-supplied typeMeta so user-set types survive re-scans.
 */
export function useVariableDetector(
  typeMeta: Record<string, VarType> = {}
): DetectedVariable[] {
  const { serializedProps } = useEditor((state) => {
    const props = Object.values(state.nodes).map((node) => node.data.props);
    return { serializedProps: JSON.stringify(props) };
  });

  const typeMetaRef = useRef(typeMeta);
  typeMetaRef.current = typeMeta;

  return useMemo(() => {
    try {
      const propsList = JSON.parse(serializedProps) as Record<string, unknown>[];
      const found = new Map<string, DetectedVariable>();

      propsList.forEach((props) => {
        Object.values(props ?? {}).forEach((value) => {
          if (typeof value !== 'string') return;
          extractVariables(value).forEach((name) => {
            if (!found.has(name)) {
              found.set(name, { name, type: typeMetaRef.current[name] ?? 'text' });
            }
          });
        });
      });

      Object.entries(typeMetaRef.current).forEach(([name, type]) => {
        if (found.has(name)) {
          found.set(name, { name, type });
        }
      });

      return Array.from(found.values());
    } catch {
      return [];
    }
  }, [serializedProps]);
}
