import type { TextQuoteAnchor } from '../types/annotations';

interface TextIndex {
  text: string;
  nodes: Array<{ node: Text; start: number; end: number }>;
}

const SKIP_SELECTOR = 'script, style, code, pre';

function buildTextIndex(root: HTMLElement): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (parent.hasAttribute('data-annotation-marker')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let text = '';
  const nodes: TextIndex['nodes'] = [];
  let current = walker.nextNode() as Text | null;
  while (current) {
    const value = current.nodeValue ?? '';
    const start = text.length;
    text += value;
    nodes.push({ node: current, start, end: start + value.length });
    current = walker.nextNode() as Text | null;
  }
  return { text, nodes };
}

function findOffset(index: TextIndex, offset: number): { node: Text; localOffset: number } | null {
  for (const entry of index.nodes) {
    if (offset >= entry.start && offset <= entry.end) {
      return { node: entry.node, localOffset: offset - entry.start };
    }
  }
  return null;
}

/**
 * Locate `anchor` in `root`'s rendered text and return a Range covering the
 * matched span. Returns null when the anchor cannot be resolved (orphan).
 *
 * Strategy: build a flat string of the visible text content (skipping code
 * blocks and our own marker spans), search for `prefix + exact + suffix`,
 * then map the offsets back to the underlying Text nodes.
 */
export function resolveTextQuote(root: HTMLElement, anchor: TextQuoteAnchor): Range | null {
  if (!anchor.exact) return null;
  const index = buildTextIndex(root);
  const needle = `${anchor.prefix ?? ''}${anchor.exact}${anchor.suffix ?? ''}`;
  if (!needle) return null;

  const matchStart = index.text.indexOf(needle);
  if (matchStart === -1) return null;

  const exactStart = matchStart + (anchor.prefix?.length ?? 0);
  const exactEnd = exactStart + anchor.exact.length;

  const startLoc = findOffset(index, exactStart);
  const endLoc = findOffset(index, exactEnd);
  if (!startLoc || !endLoc) return null;

  const range = document.createRange();
  range.setStart(startLoc.node, startLoc.localOffset);
  range.setEnd(endLoc.node, endLoc.localOffset);
  return range;
}

/**
 * Build a text-quote anchor for the current Selection inside `root`. Uses up
 * to `contextLength` characters on each side as prefix/suffix so the anchor
 * survives non-local edits.
 */
export function selectionToAnchor(
  root: HTMLElement,
  selection: Selection,
  contextLength = 32,
): TextQuoteAnchor | null {
  if (selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;
  if (!root.contains(range.commonAncestorContainer)) return null;

  const exact = range.toString();
  if (!exact.trim()) return null;

  const index = buildTextIndex(root);
  const startEntry = index.nodes.find(e => e.node === range.startContainer);
  const endEntry = index.nodes.find(e => e.node === range.endContainer);
  if (!startEntry || !endEntry) {
    return { exact };
  }
  const startOffset = startEntry.start + range.startOffset;
  const endOffset = endEntry.start + range.endOffset;

  const prefix = index.text.slice(Math.max(0, startOffset - contextLength), startOffset);
  const suffix = index.text.slice(endOffset, Math.min(index.text.length, endOffset + contextLength));

  return { exact, prefix, suffix };
}
