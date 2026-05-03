# Inline annotations API

This task describes what `industry-themed-markdown` needs to expose so the consumer (`electron-app` in `desktop-app/electron-app`) can attach notes/feedback to parts of a rendered markdown body. The behavior mirrors a per-line notes UX that already ships against `@pierre/diffs` on the consumer side.

## Context

`IndustryMarkdownSlide` is mounted by the consumer at `electron-app/src/renderer/dev-workspace/file-city-panel/SequenceMarkdownOverlay.tsx` (left edge of the File City panel) and renders either the active event's `description` or the payload's `summary`. The consumer wants the same notes affordance that already exists on its code-snippet surface:

- Inline indicator on annotated content (small clickable pill).
- The actual thread + composer live in a separate side panel the consumer owns — themed-markdown only needs to surface the indicator and the "this span is annotated" affordance.
- Clicking the inline indicator toggles the panel open/closed for that anchor.
- Selecting text surfaces a transient "Add note" affordance.

Reference implementation on the consumer side (paths in `desktop-app/electron-app`):

- `src/renderer/dev-workspace/file-city-panel/PierreSnippetView.tsx` — line annotations + gutter utility wiring against `@pierre/diffs`.
- `src/renderer/dev-workspace/file-city-panel/SnippetNotes.tsx` — `SnippetNoteIndicator`, `SnippetNotePanel`, composer form.
- `src/renderer/dev-workspace/file-city-panel/SequenceEventDetailOverlay.tsx` — owns notes state, mounts the side panel, toggle behavior.

The goal is for the consumer to be able to write a `MarkdownNoteIndicator` and reuse the existing `<SnippetNotePanel>` (likely renamed to a neutral `<NotePanel>`) so both surfaces look and feel identical.

## Behavior goals

These are the user-facing behaviors the consumer needs themed-markdown to make possible. API shape is open — this is the spec we'll write tests against on both sides.

### 1. Render an inline indicator anywhere we point to

Given an `anchor` (see below) we should be able to render an arbitrary React node attached to that anchor's location in the rendered markdown. Pierre's mental model fits well: the consumer hands the library `[{ anchor, metadata }]` plus a `renderAnnotation(annotation): ReactNode` callback, and the library injects the rendered node at the right place in the DOM.

Placement should feel natural — for an anchor that's an entire paragraph or heading, end of that block reads best (e.g., `## Why 💬 2`). For a sub-block range, end of the matched range. Don't push the body content around more than a few px.

### 2. Anchor model — text-quote selectors

We want span-level granularity, not just block-level, because reviewers will want to pin notes to specific phrases inside a paragraph. The most resilient anchor shape we know of is the [W3C text-quote selector](https://www.w3.org/TR/annotation-model/#text-quote-selector):

```ts
interface TextQuoteAnchor {
  exact: string;
  prefix?: string;   // ~32 chars before the match
  suffix?: string;   // ~32 chars after the match
}
```

Resolution: walk the rendered text content, find `prefix + exact + suffix`. Survives edits anywhere outside the immediate vicinity of the quote. Used by Hypothesis and friends.

If a heading-id-based anchor is materially simpler to ship first, that's a fine v1 — we can layer text-range on top later. But the API should be open enough that adding a second anchor kind doesn't break callers.

### 3. Highlight the matched range when active

We need the consumer to control which (if any) annotation is currently "active" so the corresponding range can paint differently — analogous to the `active` prop on `<SnippetNoteIndicator>`. Two patterns work; both are fine:

- **DOM:** wrap matched ranges with a marker element carrying `data-annotation-id` and `data-active`, with consumer-supplied CSS controlling the look.
- **CSS Custom Highlight API:** register `Highlight` instances per range; cleaner but requires browser support (which Electron's Chromium has).

Either one. The thing we need is a hook that lets us style "this is annotated" and "this is the active annotation" distinctly.

### 4. Toggle-on-click

Same UX as the snippet pill: click the inline indicator, the consumer-owned panel opens; click again, it closes. The library doesn't need to know about the panel — it just needs to render our `renderAnnotation` output and let our click handlers fire normally. As long as the rendered node receives clicks (it should, it's a regular React node), we're good.

### 5. Selection affordance

When the user makes a text selection inside the markdown, we want to surface an "Add note" pill near the end of the selection. Two paths:

- **Library-provided:** an `onSelectionChange(selector | null)` callback that hands us a resolved text-quote selector for the current selection. We render our own pill positioned via the selection's `getBoundingClientRect`.
- **Consumer-driven:** we wire a `selectionchange` listener ourselves against the rendered DOM. Works as long as the rendered text isn't behind a shadow root we can't reach (which is the case today — themed-markdown renders into the parent doc).

The first is friendlier; the second is acceptable if we know the DOM structure is stable.

### 6. Don't break existing behavior

`enableKeyboardScrolling`, `transparentBackground`, `slideIdPrefix`, theme integration, etc. — everything `SequenceMarkdownOverlay` already passes through to `IndustryMarkdownSlide` should keep working. The annotations API is purely additive.

## Rough API sketch (for orientation, not prescriptive)

```tsx
<IndustryMarkdownSlide
  content={body}
  slideIdPrefix={…}
  // existing props…

  annotations={[
    {
      id: 'note-1',
      anchor: { exact: 'silently swallowed', prefix: 'previously ', suffix: ' non-2xx responses' },
      metadata: { count: 2, headAuthor: 'Fernando' },
    },
  ]}
  activeAnnotationId={selectedAnchorId}
  renderAnnotation={(a) => (
    <MarkdownNoteIndicator
      notes={a.metadata}
      active={a.id === selectedAnchorId}
      onClick={() => toggleAnchor(a.id)}
    />
  )}
  onSelectionChange={(selector) => setPendingSelection(selector)}
/>
```

What we'd build on the consumer side once that's available:

- `MarkdownNoteIndicator` — same look as `SnippetNoteIndicator`, just different anchor.
- A small floating "Add note" pill positioned at the end of the active selection.
- Wire both into the existing `<SnippetNotePanel>` (or a sibling `<MarkdownNotePanel>` with the same shape).

## Open questions for the themed-markdown side

1. **Multiple ranges per quote.** If `exact + prefix + suffix` matches more than once (rare for prose, common for code-blocks), do we resolve to the first match, all of them, or expose an N-th occurrence index in the anchor? Hypothesis solves this with a `position` selector — overkill for v1, worth knowing if we hit it.
2. **Annotations spanning block boundaries.** A user selects across two paragraphs. Does the highlight apply to one combined range or break per block? CSS Custom Highlight handles split ranges natively; DOM `<mark>` wrapping requires multiple elements.
3. **Re-anchoring on content change.** When the markdown body changes (e.g., the payload is re-pushed with edits), some anchors may not resolve. Reasonable v1: silently drop them and surface "orphaned" status via the resolution callback. The consumer (us) handles the UX for orphans.
4. **Read-only vs. authoring.** This spec is for read-only annotation overlays — we're not asking themed-markdown to embed notes into the markdown source. Notes live in our notes registry, anchored to the rendered output.

## Status

**Shipped in `themed-markdown@0.1.87`.**

### What landed

`IndustryMarkdownSlide` now accepts:

```ts
annotations?: Annotation[];           // [{ id, anchor, count?, metadata? }]
activeAnnotationId?: string | null;
renderAnnotation?: (a: Annotation) => ReactNode;          // optional inline pill
onAnnotationClick?: (id: string, e: MouseEvent) => void;  // click-on-highlight
onSelectionChange?: (s: AnnotationSelection | null) => void;
annotationStyle?: { backgroundColor?, activeBackgroundColor? };
```

Anchor model is the W3C text-quote selector exactly as proposed:

```ts
interface TextQuoteAnchor { exact: string; prefix?: string; suffix?: string }
```

Implementation:

- DOM-marker strategy (not CSS Custom Highlight). The hook walks the rendered text in `useLayoutEffect`, resolves `prefix + exact + suffix`, wraps the matched range in `<span class="industry-md-annotation" data-annotation-id="…">`, and inserts an indicator host span at the end. Markers are reapplied on every commit if React tears them out.
- Highlight styling exposes four CSS variables for theming (`--industry-md-annotation-bg`, `--industry-md-annotation-active-bg`, `--industry-md-annotation-badge-bg`, `--industry-md-annotation-badge-color`, `--industry-md-annotation-badge-ring`) with sensible amber defaults; the `annotationStyle` prop is a typed shortcut for the two background vars.
- `Annotation.count` (top-level, optional) renders as a small rounded-square badge in the top-right corner of the highlight via CSS `::after`. No JS positioning.
- `onAnnotationClick` is wired via event delegation on the slide root; clicks at the end of a drag-selection are filtered out so highlighting text doesn't toggle anything.
- `onSelectionChange` fires on `mouseup` / `keyup` (not `selectionchange`) so it doesn't re-render the slide mid-drag and tear the live selection.
- Orphan anchors are silently dropped (`resolved: false` in the returned mounts) — the bail-out logic only requires markers for annotations that resolved last time, so unresolvable anchors don't loop.

### Decisions vs. the open questions

1. **Multiple ranges per quote.** First match wins; subsequent occurrences are ignored. No `position` selector yet.
2. **Annotations spanning block boundaries.** Supported — `wrapRange` produces one `<span>` per text node in the range; `box-decoration-break: clone` keeps padding/radius natural across line wraps. The badge attaches to the last marker only.
3. **Re-anchoring on content change.** On any change to `annotations` or markdown content, the hook re-walks; unresolved anchors are silently dropped.
4. **Read-only vs. authoring.** Read-only as designed. Notes registry stays consumer-side.

### Consumer-side notes

Memo defeats from inline callbacks were the main hazard during development. The library is `React.memo`'d, so consumers should pass stable `renderAnnotation`, `onAnnotationClick`, `onSelectionChange`, and `annotations` (use `useCallback` / `useMemo`) — otherwise the slide re-renders on every parent state change and the live text selection gets torn during drag.

The "draft annotation" pattern (push a placeholder annotation while the composer is open, set `activeAnnotationId` to its id) is what keeps the highlight visible while the user is authoring — no separate "pending selection" prop needed.

### Consumer integration steps (unchanged)

1. Bump the `themed-markdown` dep in `desktop-app/electron-app` to `^0.1.87`.
2. Build the selection pill mirroring the snippet UX (no inline indicator needed unless desired — `onAnnotationClick` is enough).
3. Reuse `<SnippetNotePanel>` for the side panel.
4. Wire it into `SequenceMarkdownOverlay` with toggle-on-click semantics; pass `annotations`, `activeAnnotationId`, `onAnnotationClick`, `onSelectionChange`, and (for the in-progress note) a draft annotation entry.
