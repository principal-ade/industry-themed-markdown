import { useEffect, useRef, type RefObject } from 'react';

interface UseHighlightCopyParams {
  rootRef: RefObject<HTMLElement | null>;
  /** When false the hook is inert (no listeners, no copying). */
  enabled: boolean;
  /** Called after text is copied (or copy is attempted). */
  onCopyText?: (text: string) => void;
}

function copyTextToClipboard(text: string): void {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return;
    }
  } catch {
    // fall through to legacy path
  }
  fallbackCopy(text);
}

function fallbackCopy(text: string): void {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

/**
 * Auto-copy a live text highlight inside `rootRef` to the clipboard.
 *
 * When `enabled`, a non-collapsed selection that lives inside the root is
 * copied as plain text as soon as the highlight settles (mouseup / keyup).
 * The same text is not re-copied while the selection is unchanged, so holding
 * the mouse down or pressing unrelated keys doesn't spam the clipboard.
 */
export function useHighlightCopy({ rootRef, enabled, onCopyText }: UseHighlightCopyParams): void {
  const lastCopiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastCopiedRef.current = null;
      return undefined;
    }
    const root = rootRef.current;
    if (!root) return undefined;

    const resolve = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        return;
      }
      const text = sel.toString();
      if (!text) return;
      if (text === lastCopiedRef.current) return;
      lastCopiedRef.current = text;
      copyTextToClipboard(text);
      onCopyText?.(text);
    };

    // Clear the dedupe cache when the selection collapses so re-selecting the
    // same text after dismissing it copies again.
    const handleSelectionChange = () => {
      const sel = document.getSelection();
      if (!sel || sel.isCollapsed) {
        lastCopiedRef.current = null;
      }
    };

    const handleMouseUp = () => window.setTimeout(resolve, 0);
    const handleKeyUp = (event: KeyboardEvent) => {
      if (['Shift', 'Meta', 'Control', 'Alt'].includes(event.key)) return;
      window.setTimeout(resolve, 0);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [enabled, rootRef, onCopyText]);
}
