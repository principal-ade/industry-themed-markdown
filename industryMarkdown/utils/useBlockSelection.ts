import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { BlockDeletionTarget } from './blockDeletion';

export const BLOCK_SELECTED_ATTR = 'data-md-selected';

export type DeletionMode = 'block' | 'text';

interface SelectionAnchor {
  /** Position for the floating action button, relative to the slide root. */
  top: number;
  left: number;
}

export type ResolvedDeletionSelection =
  | { kind: 'block'; targets: BlockDeletionTarget[]; anchor: SelectionAnchor }
  | {
      kind: 'text';
      chunkIndex: number;
      startOffset: number;
      endOffset: number;
      anchor: SelectionAnchor;
    };

interface UseBlockSelectionParams {
  rootRef: RefObject<HTMLElement | null>;
  /** When false the hook is inert (no listeners, no resolution). */
  enabled: boolean;
  /**
   * 'block' resolves a highlight to whole top-level blocks; 'text' resolves it
   * to the exact source character range, falling back to block resolution when
   * the precise range can't be determined.
   */
  mode: DeletionMode;
}

interface UseBlockSelectionResult {
  selection: ResolvedDeletionSelection | null;
  /** Clear the current selection outline + state. */
  clear: () => void;
}

function parseTarget(el: Element): BlockDeletionTarget | null {
  const chunk = el.getAttribute('data-md-chunk');
  const start = el.getAttribute('data-md-start');
  const end = el.getAttribute('data-md-end');
  if (chunk === null || start === null || end === null) return null;
  const chunkIndex = Number(chunk);
  const startLine = Number(start);
  const endLine = Number(end);
  if ([chunkIndex, startLine, endLine].some(Number.isNaN)) return null;
  return { chunkIndex, startLine, endLine };
}

function firstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function lastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let current = walker.nextNode() as Text | null;
  while (current) {
    last = current;
    current = walker.nextNode() as Text | null;
  }
  return last;
}

/**
 * Map a DOM range boundary to the Text node + local offset to read from. The
 * boundary sits between childNodes[offset-1] and childNodes[offset]; for a
 * start boundary we look forward, for an end boundary we look backward, and we
 * fall back to the other side when one side has no text.
 */
function resolveBoundary(
  container: Node,
  offset: number,
  preferEnd: boolean,
): { textNode: Text; local: number } | null {
  if (container.nodeType === Node.TEXT_NODE) {
    return { textNode: container as Text, local: offset };
  }
  if (container.nodeType !== Node.ELEMENT_NODE) return null;
  const children = container.childNodes;
  const before = children[offset - 1];
  const after = children[offset];

  if (preferEnd) {
    const beforeText = before && lastTextNode(before);
    if (beforeText) return { textNode: beforeText, local: beforeText.length };
    const afterText = after && firstTextNode(after);
    if (afterText) return { textNode: afterText, local: 0 };
  } else {
    const afterText = after && firstTextNode(after);
    if (afterText) return { textNode: afterText, local: 0 };
    const beforeText = before && lastTextNode(before);
    if (beforeText) return { textNode: beforeText, local: beforeText.length };
  }
  return null;
}

/** Resolve a Text node + local offset to a chunk-relative source offset. */
function boundaryToSource(
  textNode: Text,
  local: number,
): { chunkIndex: number; offset: number } | null {
  const wrapper = textNode.parentElement?.closest('[data-src-start]');
  if (!wrapper) return null;
  const srcStart = Number(wrapper.getAttribute('data-src-start'));
  if (Number.isNaN(srcStart)) return null;
  const chunkEl = wrapper.closest('[data-md-chunk]');
  const chunkIndex = chunkEl ? Number(chunkEl.getAttribute('data-md-chunk')) : NaN;
  if (Number.isNaN(chunkIndex)) return null;
  return { chunkIndex, offset: srcStart + local };
}

function resolveTextRange(
  range: Range,
): { chunkIndex: number; startOffset: number; endOffset: number } | null {
  const startB = resolveBoundary(range.startContainer, range.startOffset, false);
  const endB = resolveBoundary(range.endContainer, range.endOffset, true);
  if (!startB || !endB) return null;
  const startSrc = boundaryToSource(startB.textNode, startB.local);
  const endSrc = boundaryToSource(endB.textNode, endB.local);
  if (!startSrc || !endSrc) return null;
  if (startSrc.chunkIndex !== endSrc.chunkIndex) return null;
  const startOffset = Math.min(startSrc.offset, endSrc.offset);
  const endOffset = Math.max(startSrc.offset, endSrc.offset);
  if (startOffset === endOffset) return null;
  return { chunkIndex: startSrc.chunkIndex, startOffset, endOffset };
}

/**
 * Resolve a live text highlight inside `rootRef` to a deletion target. In
 * 'text' mode this is the exact source character range under the highlight; in
 * 'block' mode (or when a precise range can't be resolved) it's the outermost
 * top-level block(s) the highlight overlaps.
 */
export function useBlockSelection({
  rootRef,
  enabled,
  mode,
}: UseBlockSelectionParams): UseBlockSelectionResult {
  const [selection, setSelection] = useState<ResolvedDeletionSelection | null>(null);
  const selectedEls = useRef<Element[]>([]);

  const clearOutline = useCallback(() => {
    selectedEls.current.forEach(el => el.removeAttribute(BLOCK_SELECTED_ATTR));
    selectedEls.current = [];
  }, []);

  const clear = useCallback(() => {
    clearOutline();
    setSelection(null);
  }, [clearOutline]);

  useEffect(() => {
    if (!enabled) {
      clear();
      return undefined;
    }
    const root = rootRef.current;
    if (!root) return undefined;

    const anchorFor = (range: Range): SelectionAnchor => {
      const rootRect = root.getBoundingClientRect();
      const rangeRect = range.getBoundingClientRect();
      return {
        top: rangeRect.top - rootRect.top + root.scrollTop,
        left: rangeRect.right - rootRect.left + root.scrollLeft,
      };
    };

    const resolveBlock = (sel: Selection, range: Range): boolean => {
      const tagged = Array.from(root.querySelectorAll(`[data-md-start]`));
      const matched = tagged.filter(el => sel.containsNode(el, true));
      if (matched.length === 0) return false;

      // Keep only outermost matches so nested blocks collapse to their
      // top-level ancestor (e.g. a list item -> its list).
      const topLevel = matched.filter(
        el => !matched.some(other => other !== el && other.contains(el)),
      );
      const targets: BlockDeletionTarget[] = [];
      topLevel.forEach(el => {
        const target = parseTarget(el);
        if (target) targets.push(target);
      });
      if (targets.length === 0) return false;

      clearOutline();
      topLevel.forEach(el => el.setAttribute(BLOCK_SELECTED_ATTR, 'true'));
      selectedEls.current = topLevel;
      setSelection({ kind: 'block', targets, anchor: anchorFor(range) });
      return true;
    };

    const resolve = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        clear();
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        clear();
        return;
      }

      if (mode === 'text') {
        const text = resolveTextRange(range);
        if (text) {
          clearOutline();
          setSelection({ kind: 'text', ...text, anchor: anchorFor(range) });
          return;
        }
        // Fall back to whole-block deletion when a precise range can't be
        // resolved (e.g. selection spanning code or chunk boundaries).
      }

      if (!resolveBlock(sel, range)) {
        clear();
      }
    };

    const handleMouseUp = () => window.setTimeout(resolve, 0);
    const handleKeyUp = (event: KeyboardEvent) => {
      if (['Shift', 'Meta', 'Control', 'Alt'].includes(event.key)) return;
      window.setTimeout(resolve, 0);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, mode, rootRef, clear, clearOutline]);

  return { selection, clear };
}
