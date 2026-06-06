/** Converts a serialized Craft.js JSON state → HTML string for PDF generation */

interface CraftNode {
  type: { resolvedName: string } | string;
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName?: string;
  parent?: string;
  hidden?: boolean;
  nodes: string[];
  linkedNodes: Record<string, string>;
}

type CraftState = Record<string, CraftNode>;

function applyVars(text: string, vars?: Record<string, string>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function resolvedName(node: CraftNode): string {
  if (typeof node.type === 'string') return node.type;
  return node.type?.resolvedName ?? 'Unknown';
}

function renderNode(id: string, state: CraftState, vars?: Record<string, string>): string {
  const node = state[id];
  if (!node || node.hidden) return '';

  const p = node.props as Record<string, any>;
  const children = (node.nodes || []).map((cid) => renderNode(cid, state, vars)).join('');

  switch (resolvedName(node)) {
    case 'Document':
      return `<div style="font-family:inherit">${children}</div>`;

    case 'TextBlock': {
      const style = [
        `font-size:${p.fontSize ?? 12}pt`,
        `font-family:${p.fontFamily ?? 'inherit'}`,
        `color:${p.color ?? '#111'}`,
        `text-align:${p.textAlign ?? 'left'}`,
        `font-weight:${p.bold ? 700 : 400}`,
        `font-style:${p.italic ? 'italic' : 'normal'}`,
        `line-height:${p.lineHeight ?? 1.6}`,
        'margin:0 0 6px',
        'word-break:break-word',
      ].join(';');
      return `<div style="${style}">${applyVars(p.content ?? '', vars)}</div>`;
    }

    case 'HeadingBlock': {
      const lvl = p.level ?? 'h2';
      const sizes: Record<string, string> = { h1: '22pt', h2: '17pt', h3: '14pt' };
      const style = [
        `font-size:${sizes[lvl] ?? '17pt'}`,
        `color:${p.color ?? '#111'}`,
        `text-align:${p.textAlign ?? 'left'}`,
        `font-weight:${p.bold ? 700 : 600}`,
        'margin:14px 0 6px',
      ].join(';');
      return `<${lvl} style="${style}">${applyVars(p.content ?? '', vars)}</${lvl}>`;
    }

    case 'ClauseBlock': {
      const num = p.showNumber ? `<span style="font-weight:700">${p.number ?? ''}. </span>` : '';
      const title = `<div style="font-weight:700;font-size:12pt;text-transform:uppercase;margin-bottom:4px">${num}${applyVars(p.title ?? '', vars)}</div>`;
      const indent = p.showNumber ? '1.8em' : '0';
      const body = `<div style="font-size:12pt;line-height:1.7;text-align:justify;margin-left:${indent}">${applyVars(p.content ?? '', vars)}</div>`;
      return `<div style="margin:12px 0">${title}${body}</div>`;
    }

    case 'ColumnsBlock': {
      const cols = p.columns ?? 2;
      const gap = p.gap ?? 16;
      const fs = p.fontSize ?? 11;
      const colStyle = `flex:1;font-size:${fs}pt;line-height:1.5;word-break:break-word`;
      let html = `<div style="display:flex;gap:${gap}px;margin:8px 0">`;
      html += `<div style="${colStyle}">${applyVars(p.col1 ?? '', vars)}</div>`;
      html += `<div style="${colStyle}">${applyVars(p.col2 ?? '', vars)}</div>`;
      if (cols === 3) html += `<div style="${colStyle}">${applyVars(p.col3 ?? '', vars)}</div>`;
      html += '</div>';
      return html;
    }

    case 'DividerBlock': {
      const mt = p.marginTop ?? 12;
      const mb = p.marginBottom ?? 12;
      const thick = p.thickness ?? 1;
      const style = `border:none;border-top:${thick}px ${p.style ?? 'solid'} ${p.color ?? '#d1d5db'};margin:${mt}px 0 ${mb}px`;
      return `<hr style="${style}" />`;
    }

    case 'SpacerBlock':
      return `<div style="height:${p.height ?? 24}px"></div>`;

    case 'TableBlock': {
      const rows: number = p.rows ?? 3;
      const cols: number = p.cols ?? 3;
      const headers: string[] = (p.headers as string[]) ?? [];
      const data: string[][] = (p.data as string[][]) ?? [];
      const striped: boolean = p.striped ?? true;
      const bordered: boolean = p.bordered ?? true;
      const fs: number = p.fontSize ?? 11;
      const bdr = bordered ? 'border:1px solid #d1d5db;' : '';
      const thStyle = `padding:6px 10px;background:#f3f4f6;font-weight:700;font-size:${fs}pt;${bdr}`;
      const tdStyle = `padding:6px 10px;font-size:${fs}pt;${bdr}`;

      let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0"><thead><tr>';
      headers.slice(0, cols).forEach((h) => { html += `<th style="${thStyle}">${applyVars(h, vars)}</th>`; });
      html += '</tr></thead><tbody>';
      data.slice(0, rows).forEach((row, ri) => {
        const bg = striped && ri % 2 === 1 ? 'background:#f9fafb;' : '';
        html += `<tr style="${bg}">`;
        row.slice(0, cols).forEach((cell) => { html += `<td style="${tdStyle}">${applyVars(cell, vars)}</td>`; });
        html += '</tr>';
      });
      html += '</tbody></table>';
      return html;
    }

    case 'VariableBlock': {
      const varName = p.name ?? 'variavel';
      const val = vars?.[varName] ?? `{{${varName}}}`;
      return `<span>${p.prefix ?? ''}${val}${p.suffix ?? ''}</span>`;
    }

    case 'ImageBlock':
      if (!p.src) return '';
      return `<div style="text-align:${p.align ?? 'center'};margin:8px 0"><img src="${p.src}" alt="${p.alt ?? ''}" style="width:${p.width ?? 100}%;max-width:100%;border-radius:4px" /></div>`;

    case 'SignatureBlock': {
      const mt = p.marginTop ?? 40;
      const align = p.align ?? 'center';
      const line = p.showLine ? '<div style="border-top:1px solid #374151;margin-bottom:6px"></div>' : '';
      const date = p.showDate ? '<div style="font-size:10pt;color:#6b7280;margin-top:6px">Local e Data: ___________________</div>' : '';
      const role = p.role ? `<div style="font-size:10pt;color:#6b7280;margin-top:2px">${p.role}</div>` : '';
      return `<div style="text-align:${align};margin-top:${mt}px;margin-bottom:12px"><div style="display:inline-block;min-width:220px;text-align:center">${line}<div style="font-weight:700;font-size:11pt;text-transform:uppercase">${p.party ?? 'CONTRATANTE'}</div>${role}${date}</div></div>`;
    }

    default:
      return children;
  }
}

export function renderCraftToHtml(
  craftJson: string | Record<string, unknown>,
  vars?: Record<string, string>
): string {
  try {
    const state: CraftState =
      typeof craftJson === 'string' ? JSON.parse(craftJson) : (craftJson as CraftState);
    if (!state.ROOT) return '';
    return renderNode('ROOT', state, vars);
  } catch {
    return '';
  }
}
