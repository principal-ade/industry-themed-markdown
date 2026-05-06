import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { Annotation, AnnotationSelection, TextQuoteAnchor } from '../types/annotations';

import { resolveTextQuote, selectionToAnchor } from './annotationResolver';

const INDICATOR_HOST_CLASS = 'industry-md-annotation-indicator';
const HIGHLIGHT_NAME = 'industry-md-annotation';
const HIGHLIGHT_ACTIVE_NAME = 'industry-md-annotation-active';
const HIGHLIGHT_HOVER_NAME = 'industry-md-annotation-hover';

// Painting highlights via the CSS Custom Highlight API instead of wrapping
// text nodes in `<span>`s avoids the cross-block crash documented in
// `backlog/tasks/4 - Inline annotations crash on cross-block ranges.md`:
// reparenting React-owned text nodes invalidates fiber references and the
// next commit throws `NotFoundError` on `parent.insertBefore`. Highlights
// are paint-only, so React's tree is untouched.
//
// Lib.dom.d.ts ships incomplete typings for the Set-like `Highlight` and
// the Map-like `HighlightRegistry` (the IDL setlike/maplike members aren't
// always materialized). Re-declare just the methods we use.
interface HighlightLike {
  add(range: Range): HighlightLike;
  delete(range: Range): boolean;
}
interface HighlightRegistryLike {
  get(name: string): HighlightLike | undefined;
  set(name: string, value: HighlightLike): HighlightRegistryLike;
}
interface HighlightCtor {
  new (...ranges: Range[]): HighlightLike;
}

interface HighlightApi {
  base: HighlightLike;
  active: HighlightLike;
  hover: HighlightLike;
}

function getHighlightApi(): HighlightApi | null {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return null;
  const HighlightCtor = (globalThis as unknown as { Highlight?: HighlightCtor }).Highlight;
  if (!HighlightCtor) return null;
  const registry = (CSS as unknown as { highlights: HighlightRegistryLike }).highlights;
  const ensure = (name: string): HighlightLike => {
    let h = registry.get(name);
    if (!h) {
      h = new HighlightCtor();
      registry.set(name, h);
    }
    return h;
  };
  return {
    base: ensure(HIGHLIGHT_NAME),
    active: ensure(HIGHLIGHT_ACTIVE_NAME),
    hover: ensure(HIGHLIGHT_HOVER_NAME),
  };
}

const OVERLAY_CLASS = 'industry-md-annotation-overlay';

function getOrCreateOverlay(root: HTMLElement): HTMLElement {
  let overlay = root.querySelector<HTMLElement>(`:scope > .${OVERLAY_CLASS}`);
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS;
  overlay.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:1;';
  root.appendChild(overlay);
  return overlay;
}

function clearHosts(root: HTMLElement) {
  const overlay = root.querySelector<HTMLElement>(`:scope > .${OVERLAY_CLASS}`);
  if (overlay) overlay.replaceChildren();
}

function positionHost(host: HTMLElement, range: Range, root: HTMLElement) {
  const rects = range.getClientRects();
  if (rects.length === 0) {
    host.style.display = 'none';
    return;
  }
  const last = rects[rects.length - 1];
  const rootRect = root.getBoundingClientRect();
  const top = last.top - rootRect.top + root.scrollTop;
  const left = last.right - rootRect.left + root.scrollLeft;
  host.style.cssText =
    `position:absolute;top:${top}px;left:${left}px;` +
    `pointer-events:auto;line-height:${last.height}px;`;
}

function annotationsSignature<T>(annotations: Annotation<T>[]): string {
  return annotations
    .map(
      a =>
        `${a.id}|${a.anchor.exact}|${a.anchor.prefix ?? ''}|${a.anchor.suffix ?? ''}|${a.count ?? ''}`,
    )
    .join('::');
}

interface UseAnnotationsParams<TMetadata> {
  rootRef: RefObject<HTMLElement | null>;
  annotations: Annotation<TMetadata>[];
  activeAnnotationId?: string | null;
  onSelectionChange?: (selection: AnnotationSelection | null) => void;
  onAnnotationClick?: (annotationId: string, event: MouseEvent) => void;
}

export interface AnnotationMount<TMetadata> {
  annotation: Annotation<TMetadata>;
  host: HTMLElement;
  resolved: boolean;
}

interface ResolvedEntry<TMetadata> {
  annotation: Annotation<TMetadata>;
  range: Range;
  host: HTMLElement;
}

export function useAnnotations<TMetadata>({
  rootRef,
  annotations,
  activeAnnotationId,
  onSelectionChange,
  onAnnotationClick,
}: UseAnnotationsParams<TMetadata>): AnnotationMount<TMetadata>[] {
  const [mounts, setMounts] = useState<AnnotationMount<TMetadata>[]>([]);
  const signature = useMemo(() => annotationsSignature(annotations ?? []), [annotations]);
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;
  const activeIdRef = useRef<string | null | undefined>(activeAnnotationId);
  activeIdRef.current = activeAnnotationId;
  const lastAppliedRef = useRef<string>('');
  const lastResolvedIdsRef = useRef<Set<string>>(new Set());
  // Ranges this hook instance has registered with the global highlight
  // buckets. Tracked so we can `delete` exactly our own ranges on
  // cleanup/re-apply without disturbing other slides on the page.
  const ownedRangesRef = useRef<Set<Range>>(new Set());
  const resolvedRef = useRef<ResolvedEntry<TMetadata>[]>([]);

  useEffect(() => {
    return () => {
      const api = getHighlightApi();
      if (api) {
        ownedRangesRef.current.forEach(r => {
          api.base.delete(r);
          api.active.delete(r);
          api.hover.delete(r);
        });
      }
      ownedRangesRef.current.clear();
    };
  }, []);

  // Runs on every commit. Hosts are inserted as *siblings* of the end text
  // node (not parents) so React's fiber tree is undisturbed; if React
  // re-renders the surrounding subtree it may strip our hosts, so we
  // re-apply whenever they're missing.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const current = annotationsRef.current ?? [];
    const api = getHighlightApi();

    const existingHostIds = new Set<string>();
    root.querySelectorAll<HTMLElement>(`.${INDICATOR_HOST_CLASS}`).forEach(el => {
      const id = el.getAttribute('data-annotation-id');
      if (id) existingHostIds.add(id);
    });

    const annotationsChanged = lastAppliedRef.current !== signature;
    const allHostsPresent = Array.from(lastResolvedIdsRef.current).every(id =>
      existingHostIds.has(id),
    );
    if (!annotationsChanged && allHostsPresent) {
      return;
    }

    if (api) {
      ownedRangesRef.current.forEach(r => {
        api.base.delete(r);
        api.active.delete(r);
        api.hover.delete(r);
      });
    }
    ownedRangesRef.current.clear();
    clearHosts(root);
    resolvedRef.current = [];
    lastAppliedRef.current = signature;

    if (current.length === 0) {
      lastResolvedIdsRef.current = new Set();
      setMounts(prev => (prev.length === 0 ? prev : []));
      return;
    }

    const next: AnnotationMount<TMetadata>[] = [];
    const newResolved: ResolvedEntry<TMetadata>[] = [];
    const resolvedIds = new Set<string>();
    const activeId = activeIdRef.current;

    current.forEach(annotation => {
      let range: Range | null = null;
      try {
        range = resolveTextQuote(root, annotation.anchor);
      } catch {
        range = null;
      }
      if (!range) {
        next.push({ annotation, host: document.createElement('span'), resolved: false });
        return;
      }
      const host = document.createElement('span');
      host.className = INDICATOR_HOST_CLASS;
      host.setAttribute('data-annotation-id', annotation.id);
      if (typeof annotation.count === 'number' && annotation.count > 0) {
        host.setAttribute('data-count', String(annotation.count));
      }
      if (activeId && annotation.id === activeId) {
        host.setAttribute('data-active', 'true');
      }
      // Position the host absolutely within an overlay layer attached to
      // the slide root. We never insert it next to the text — that would
      // require splitting the end text node, which React's next render
      // would clobber by writing the full string back to `nodeValue`. The
      // overlay sits as a single appended child of the slide root, well
      // after React's tracked siblings, so React's reconciliation never
      // bumps into it.
      const overlay = getOrCreateOverlay(root);
      overlay.appendChild(host);
      positionHost(host, range, root);

      if (api) {
        ownedRangesRef.current.add(range);
        if (activeId && annotation.id === activeId) {
          api.active.add(range);
        } else {
          api.base.add(range);
        }
      }

      newResolved.push({ annotation, range, host });
      next.push({ annotation, host, resolved: true });
      resolvedIds.add(annotation.id);
    });

    resolvedRef.current = newResolved;
    lastResolvedIdsRef.current = resolvedIds;
    setMounts(next);
  });

  // Reposition hosts when the slide reflows (window resize, font load,
  // content edits). Highlights are paint-only so they reflow automatically;
  // hosts are absolute-positioned and need explicit re-layout.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const reposition = () => {
      resolvedRef.current.forEach(entry => positionHost(entry.host, entry.range, root));
    };
    const observer = new ResizeObserver(reposition);
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, mounts]);

  // Active state — move ranges between buckets and toggle host attribute.
  useEffect(() => {
    const api = getHighlightApi();
    resolvedRef.current.forEach(entry => {
      const isActive = !!activeAnnotationId && entry.annotation.id === activeAnnotationId;
      if (api) {
        if (isActive) {
          api.base.delete(entry.range);
          api.active.add(entry.range);
        } else {
          api.active.delete(entry.range);
          api.base.add(entry.range);
        }
      }
      if (isActive) {
        entry.host.setAttribute('data-active', 'true');
      } else {
        entry.host.removeAttribute('data-active');
      }
    });
  }, [activeAnnotationId, mounts]);

  // Selection tracking — mouseup / keyup so we don't fire mid-drag.
  useEffect(() => {
    if (!onSelectionChange) return;
    const root = rootRef.current;
    if (!root) return;

    const emit = () => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        onSelectionChange(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        onSelectionChange(null);
        return;
      }
      const anchor = selectionToAnchor(root, selection);
      if (!anchor) {
        onSelectionChange(null);
        return;
      }
      onSelectionChange({ anchor, rect: range.getBoundingClientRect() });
    };

    const handleMouseUp = () => {
      window.setTimeout(emit, 0);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'Shift' ||
        event.key === 'Meta' ||
        event.key === 'Control' ||
        event.key === 'Alt'
      ) {
        return;
      }
      window.setTimeout(emit, 0);
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [rootRef, onSelectionChange]);

  // Click + cursor delegation. Highlights aren't DOM elements, so hit-test
  // the resolved Range rectangles for both pointer-feedback and clicks.
  // Host clicks (badge / portal indicator) are checked first since they're
  // cheaper and unambiguous.
  useEffect(() => {
    if (!onAnnotationClick) return;
    const root = rootRef.current;
    if (!root) return;

    const hitTest = (x: number, y: number): string | null => {
      for (const entry of resolvedRef.current) {
        const rects = entry.range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
            return entry.annotation.id;
          }
        }
      }
      return null;
    };

    const handleClick = (event: MouseEvent) => {
      const selection = document.getSelection();
      if (selection && !selection.isCollapsed) return;

      const target = event.target;
      if (target instanceof Element) {
        const host = target.closest(`.${INDICATOR_HOST_CLASS}`);
        if (host) {
          const id = host.getAttribute('data-annotation-id');
          if (id) {
            onAnnotationClick(id, event);
            return;
          }
        }
      }

      const id = hitTest(event.clientX, event.clientY);
      if (id) onAnnotationClick(id, event);
    };

    let hoveredId: string | null = null;
    const setHover = (id: string | null) => {
      if (id === hoveredId) return;
      const api = getHighlightApi();
      if (api) {
        if (hoveredId) {
          const prev = resolvedRef.current.find(e => e.annotation.id === hoveredId);
          if (prev) api.hover.delete(prev.range);
        }
        if (id) {
          const next = resolvedRef.current.find(e => e.annotation.id === id);
          if (next) api.hover.add(next.range);
        }
      }
      hoveredId = id;
    };
    const handleMove = (event: MouseEvent) => {
      const id = hitTest(event.clientX, event.clientY);
      root.style.cursor = id ? 'pointer' : '';
      setHover(id);
    };
    const handleLeave = () => {
      root.style.cursor = '';
      setHover(null);
    };

    root.addEventListener('click', handleClick);
    root.addEventListener('mousemove', handleMove);
    root.addEventListener('mouseleave', handleLeave);
    return () => {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('mousemove', handleMove);
      root.removeEventListener('mouseleave', handleLeave);
      root.style.cursor = '';
      setHover(null);
    };
  }, [rootRef, onAnnotationClick]);

  return mounts;
}

export type { TextQuoteAnchor };
