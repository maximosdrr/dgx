import { useEditor } from '@craftjs/core';
import { useMemo, useRef } from 'react';

export type VarType = 'text' | 'number' | 'date' | 'currency' | 'cpf' | 'cnpj';

export interface DetectedVariable {
  name: string;
  type: VarType;
}

const VAR_REGEX = /\{\{([a-zA-Z0-9_]+)\}\}/g;

/**
 * Scans the Craft.js serialised JSON for {{varname}} occurrences.
 * Merges with caller-supplied typeMeta so user-set types survive re-scans.
 */
export function useVariableDetector(
  typeMeta: Record<string, VarType> = {}
): DetectedVariable[] {
  const { query } = useEditor();
  // Use a serialised-JSON hash as the dependency so we react to every text change,
  // not just node count changes.
  const { serialized } = useEditor((state) => {
    // Build a lightweight change-key: join all prop values that look like text
    const keys = Object.values(state.nodes)
      .map((n) => JSON.stringify(n.data.props))
      .join('|');
    return { serialized: keys };
  });

  const typeMetaRef = useRef(typeMeta);
  typeMetaRef.current = typeMeta;

  return useMemo(() => {
    try {
      const json = query.serialize();
      const found = new Map<string, DetectedVariable>();
      VAR_REGEX.lastIndex = 0;
      let m: RegExpExecArray | null;
      const rx = new RegExp(VAR_REGEX.source, 'g');
      while ((m = rx.exec(json)) !== null) {
        const name = m[1];
        if (!found.has(name)) {
          found.set(name, { name, type: typeMetaRef.current[name] ?? 'text' });
        }
      }
      return Array.from(found.values());
    } catch {
      return [];
    }
  }, [serialized, query]);
}
