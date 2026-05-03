import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { Annotation, AnnotationSelection, TextQuoteAnchor } from '../types/annotations';

import { resolveTextQuote, selectionToAnchor } from './annotationResolver';

const MARKER_CLASS = 'industry-md-annotation';
const INDICATOR_HOST_CLASS = 'industry-md-annotation-indicator';

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

function clearMarkers(root: HTMLElement) {
  const markers = root.querySelectorAll<HTMLElement>(`.${MARKER_CLASS}`);
  markers.forEach(marker => {
    const parent = marker.parentNode;
    if (!parent) return;
    while (marker.firstChild) {
      parent.insertBefore(marker.firstChild, marker);
    }
    parent.removeChild(marker);
  });
  const hosts = root.querySelectorAll<HTMLElement>(`.${INDICATOR_HOST_CLASS}`);
  hosts.forEach(host => host.parentNode?.removeChild(host));
  // Re-merge adjacent text nodes that were split when markers were inserted.
  root.normalize();
}

function wrapRange(range: Range, annotationId: string): HTMLElement[] {
  // surroundContents only works when the range spans within a single text
  // node. For cross-node ranges we walk the contained text nodes manually.
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode() as Text | null;
  while (current) {
    if (range.intersectsNode(current)) textNodes.push(current);
    current = walker.nextNode() as Text | null;
  }
  if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    textNodes.push(range.commonAncestorContainer as Text);
  }

  const markers: HTMLElement[] = [];
  textNodes.forEach(textNode => {
    if (!textNode.parentNode || !textNode.nodeValue) return;
    const isStart = textNode === range.startContainer;
    const isEnd = textNode === range.endContainer;
    const start = isStart ? range.startOffset : 0;
    const end = isEnd ? range.endOffset : textNode.nodeValue.length;
    if (start >= end) return;

    let target = textNode;
    if (start > 0) {
      target = target.splitText(start);
    }
    if (end - start < target.nodeValue!.length) {
      target.splitText(end - start);
    }

    const marker = document.createElement('span');
    marker.className = MARKER_CLASS;
    marker.setAttribute('data-annotation-id', annotationId);
    marker.setAttribute('data-annotation-marker', 'true');
    target.parentNode!.insertBefore(marker, target);
    marker.appendChild(target);
    markers.push(marker);
  });
  return markers;
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
  const lastAppliedRef = useRef<string>('');
  const lastResolvedIdsRef = useRef<Set<string>>(new Set());

  // Runs on every commit. ReactMarkdown's reconciliation can tear out our
  // injected marker / host spans, so we re-apply whenever they're missing
  // (or the annotations payload itself has changed). Bail-out only checks
  // markers for annotations that *resolved* last time — unresolvable
  // anchors stay un-resolved and shouldn't trigger an infinite re-wrap.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const current = annotationsRef.current ?? [];

    const existingMarkerIds = new Set<string>();
    root.querySelectorAll<HTMLElement>(`.${MARKER_CLASS}`).forEach(el => {
      const id = el.getAttribute('data-annotation-id');
      if (id) existingMarkerIds.add(id);
    });

    const annotationsChanged = lastAppliedRef.current !== signature;
    const allResolvedMarkersPresent = Array.from(lastResolvedIdsRef.current).every(id =>
      existingMarkerIds.has(id),
    );
    if (!annotationsChanged && allResolvedMarkersPresent) {
      return;
    }

    clearMarkers(root);
    lastAppliedRef.current = signature;

    if (current.length === 0) {
      lastResolvedIdsRef.current = new Set();
      setMounts(prev => (prev.length === 0 ? prev : []));
      return;
    }

    const next: AnnotationMount<TMetadata>[] = [];
    const resolvedIds = new Set<string>();
    current.forEach(annotation => {
      const range = resolveTextQuote(root, annotation.anchor);
      if (!range) {
        next.push({ annotation, host: document.createElement('span'), resolved: false });
        return;
      }
      const markers = wrapRange(range, annotation.id);
      if (markers.length === 0) {
        next.push({ annotation, host: document.createElement('span'), resolved: false });
        return;
      }
      const last = markers[markers.length - 1];
      last.classList.add(`${MARKER_CLASS}--last`);
      if (typeof annotation.count === 'number' && annotation.count > 0) {
        last.setAttribute('data-count', String(annotation.count));
      }
      const host = document.createElement('span');
      host.className = INDICATOR_HOST_CLASS;
      host.setAttribute('data-annotation-indicator-for', annotation.id);
      last.parentNode!.insertBefore(host, last.nextSibling);
      next.push({ annotation, host, resolved: true });
      resolvedIds.add(annotation.id);
    });

    lastResolvedIdsRef.current = resolvedIds;
    setMounts(next);
  });

  // Apply / clear active state without re-wrapping.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const markers = root.querySelectorAll<HTMLElement>(`.${MARKER_CLASS}`);
    markers.forEach(marker => {
      const id = marker.getAttribute('data-annotation-id');
      if (id && id === activeAnnotationId) {
        marker.setAttribute('data-active', 'true');
      } else {
        marker.removeAttribute('data-active');
      }
    });
  }, [rootRef, activeAnnotationId, mounts]);

  // Selection tracking. We intentionally listen on mouseup / keyup rather
  // than `selectionchange`: the latter fires continuously while the user is
  // still dragging, and emitting on every fire causes the consumer's state
  // updates to re-render the slide mid-drag and tear the selection.
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

    // Defer past the current event loop so the browser has finished
    // updating Selection state.
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

  // Click delegation so the highlighted span itself is the affordance — no
  // inline indicator required. Only fires when the click was a click, not
  // the end of a drag-selection.
  useEffect(() => {
    if (!onAnnotationClick) return;
    const root = rootRef.current;
    if (!root) return;

    const handleClick = (event: MouseEvent) => {
      const selection = document.getSelection();
      if (selection && !selection.isCollapsed) return; // user was selecting
      const target = event.target;
      if (!(target instanceof Element)) return;
      const marker = target.closest(`.${MARKER_CLASS}`);
      if (!marker) return;
      const id = marker.getAttribute('data-annotation-id');
      if (!id) return;
      onAnnotationClick(id, event);
    };

    root.addEventListener('click', handleClick);
    return () => {
      root.removeEventListener('click', handleClick);
    };
  }, [rootRef, onAnnotationClick]);

  return mounts;
}

export type { TextQuoteAnchor };
