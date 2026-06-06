const VARIABLE_NAME_RE = '[a-zA-Z0-9_]+';
const VARIABLE_TEXT_RE = new RegExp(`\\{\\{(${VARIABLE_NAME_RE})\\}\\}`, 'g');
const VARIABLE_CHIP_RE = /(<span class="variable-chip"[^>]*>.*?<\/span>)|(\{\{([a-zA-Z0-9_]+)\}\})/g;

interface SavedEditableRange {
  element: HTMLElement;
  field: string;
  range: Range;
}

let savedEditableRange: SavedEditableRange | null = null;

export function createVariableChipHTML(name: string, type = 'text'): string {
  return `<span class="variable-chip" data-variable="${name}" data-type="${type}" contenteditable="false">{{${name}}}</span>`;
}

export function parseContentWithVariables(html: string): string {
  if (!html) return '';

  if (html.includes('class="variable-chip"')) {
    return html.replace(VARIABLE_CHIP_RE, (_match, chip, _varPattern, varName) => {
      if (chip) return chip;
      return createVariableChipHTML(varName);
    });
  }

  return html.replace(VARIABLE_TEXT_RE, (_match, name) => createVariableChipHTML(name));
}

export function extractVariables(html: string): string[] {
  const fromChips = [...html.matchAll(/data-variable="([a-zA-Z0-9_]+)"/g)].map((m) => m[1]);
  const fromText = [...html.matchAll(VARIABLE_TEXT_RE)].map((m) => m[1]);
  return [...new Set([...fromChips, ...fromText])];
}

function selectionIsInside(element: HTMLElement, range: Range): boolean {
  return element.contains(range.startContainer) && element.contains(range.endContainer);
}

export function rememberEditableSelection(element: HTMLElement, field = 'content'): void {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !selectionIsInside(element, range)) return;

  savedEditableRange = {
    element,
    field,
    range: range.cloneRange(),
  };
}

export function clearEditableSelection(element: HTMLElement): void {
  if (savedEditableRange?.element === element && !document.body.contains(element)) {
    savedEditableRange = null;
  }
}

export function getSavedEditableField(): string {
  return savedEditableRange?.field ?? 'content';
}

function restoreSavedSelection(element: HTMLElement): Range | null {
  const selection = window.getSelection();
  const savedRange = savedEditableRange?.element === element ? savedEditableRange.range : null;

  if (savedRange && selectionIsInside(element, savedRange)) {
    selection?.removeAllRanges();
    selection?.addRange(savedRange.cloneRange());
    return savedRange.cloneRange();
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
  return range;
}

export function applyVariableHighlight(element: HTMLElement): boolean {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

  let cursorOffset = 0;
  if (range && selectionIsInside(element, range)) {
    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.endContainer, range.endOffset);
    cursorOffset = preRange.toString().length;
  }

  const currentHtml = element.innerHTML;
  const newHtml = parseContentWithVariables(currentHtml);
  if (newHtml === currentHtml) {
    rememberEditableSelection(element, element.dataset.craftPropField ?? 'content');
    return false;
  }

  element.innerHTML = newHtml;

  let charCount = 0;
  let restored = false;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement as HTMLElement | null;
      if (parent?.closest('.variable-chip')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const newRange = document.createRange();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLength = node.textContent?.length ?? 0;
    if (charCount + nodeLength >= cursorOffset) {
      newRange.setStart(node, Math.max(0, cursorOffset - charCount));
      newRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
      restored = true;
      break;
    }
    charCount += nodeLength;
  }

  if (!restored) {
    newRange.selectNodeContents(element);
    newRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  }

  rememberEditableSelection(element, element.dataset.craftPropField ?? 'content');
  return true;
}

function htmlToNode(html: string): Node {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild ?? document.createTextNode('');
}

export function insertVariableChipAtSavedSelection(name: string, type = 'text'): { html: string; field: string } | null {
  const target = savedEditableRange?.element;
  if (!target || !document.body.contains(target)) return null;

  target.focus({ preventScroll: true });
  const range = restoreSavedSelection(target);
  if (!range) return null;

  const chip = htmlToNode(createVariableChipHTML(name, type));
  range.deleteContents();
  range.insertNode(chip);

  const afterRange = document.createRange();
  afterRange.setStartAfter(chip);
  afterRange.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(afterRange);

  rememberEditableSelection(target, savedEditableRange?.field ?? target.dataset.craftPropField ?? 'content');
  return {
    html: target.innerHTML,
    field: savedEditableRange?.field ?? target.dataset.craftPropField ?? 'content',
  };
}

function previousMeaningfulSibling(node: Node | null): Node | null {
  let current = node;
  while (current) {
    if (current.nodeType !== Node.TEXT_NODE || (current.textContent ?? '').length > 0) return current;
    current = current.previousSibling;
  }
  return null;
}

function chipBeforeRange(range: Range, root: HTMLElement): HTMLElement | null {
  if (!range.collapsed || !root.contains(range.startContainer)) return null;

  const container = range.startContainer;
  const offset = range.startOffset;
  let candidate: Node | null = null;

  if (container.nodeType === Node.TEXT_NODE) {
    if (offset > 0) return null;
    candidate = previousMeaningfulSibling(container.previousSibling);
    if (!candidate) candidate = previousMeaningfulSibling(container.parentNode?.previousSibling ?? null);
  } else if (container.nodeType === Node.ELEMENT_NODE) {
    const element = container as Element;
    candidate = offset > 0 ? element.childNodes[offset - 1] : previousMeaningfulSibling(element.previousSibling);
  }

  if (!candidate) return null;
  if (candidate.nodeType === Node.TEXT_NODE && (candidate.textContent ?? '').length > 0) return null;

  const element = candidate.nodeType === Node.ELEMENT_NODE ? candidate as HTMLElement : candidate.parentElement;
  return element?.classList?.contains('variable-chip') ? element : null;
}

export function deleteVariableChipBeforeCursor(element: HTMLElement): boolean {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) return false;

  const chip = chipBeforeRange(range, element);
  if (!chip) return false;

  const parent = chip.parentNode;
  if (!parent) return false;

  const nextRange = document.createRange();
  nextRange.setStartBefore(chip);
  nextRange.collapse(true);
  chip.remove();

  selection?.removeAllRanges();
  selection?.addRange(nextRange);
  rememberEditableSelection(element, element.dataset.craftPropField ?? 'content');
  return true;
}
