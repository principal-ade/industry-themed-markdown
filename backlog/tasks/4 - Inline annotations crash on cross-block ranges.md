# Inline annotations crash on cross-block ranges

When an `Annotation`'s text-quote anchor resolves to a range that spans multiple block-level elements (paragraphs, headings, lists), `<DocumentView>` / `<IndustryMarkdownSlide>` throws during React commit and tears the panel down. The annotation never renders, and the consumer (electron-app's `MarkdownPanel`) is left with a broken document until the offending annotation is removed from the `annotations` prop.

This contradicts task 2's "Decisions vs. the open questions" entry which states cross-block ranges are supported in `0.1.87`:

> 2. **Annotations spanning block boundaries.** Supported — `wrapRange` produces one `<span>` per text node in the range; `box-decoration-break: clone` keeps padding/radius natural across line wraps. The badge attaches to the last marker only.

In practice, ranges that cross block parents trigger a DOM mutation error. Single-block ranges (everything inside one `<p>` / `<h2>` / `<li>`) work as advertised.

## Symptom

```
NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode
    at commitPlacement
    at commitMutationEffectsOnFiber
    …
```

The error fires on commit. It propagates out of `wrapRange` / the annotation `useLayoutEffect`, kills the React subtree, and is unrecoverable without removing the annotation from the props.

## Concrete repro

Markdown content:

```md
# Sequence Diagram Persistence

This document describes how to persist sequence-diagram payloads pushed to the File City sequence-diagram overlay so users can reopen, switch between, and delete past payloads instead of losing them on app restart or when the next payload arrives.

It supersedes the "Persisting payloads across app restarts" non-goal in the original overlay doc.

## Background

Today, payloads delivered to localhost:3054…
```

Annotation passed in `annotations`:

```ts
{
  id: 'note-e25b85f7',
  anchor: {
    exact:
      'document describes how to persist sequence-diagram payloads pushed to the File City sequence-diagram overlay so users can reopen, switch between, and delete past payloads instead of losing them on app restart or when the next payload arrives.\nIt supersedes the "Persisting payloads across app restarts" non-goal in the original overlay doc.\nBackground',
    prefix: 'quence Diagram Persistence\nThis ',
    suffix: '\nToday, payloads delivered to  l',
  },
}
```

This anchor was produced by the library itself: the user dragged across the three paragraphs + heading, `onSelectionChange` fired with this exact text-quote selector, and the consumer round-tripped it back into `annotations`.

## Hypothesis

`wrapRange` likely splits the resolved Range into per-text-node spans, but those spans get inserted as siblings of the existing block parents. When React reconciles the surrounding subtree on the next render, the inserted nodes' parent assumptions don't match what's actually on the page — the imperatively-inserted markers shift sibling indices that React thinks it owns. The next React-driven mutation calls `parent.insertBefore(newNode, refNode)` against a `refNode` that's no longer a child of `parent`, and the DOM throws.

Single-block annotations don't trigger it because all the splitting and wrapping happens inside one parent React already manages — sibling indices stay stable.

## Suggested fixes

In rough order of correctness:

### 1. Render multi-block anchors as multiple highlights

The "right" fix. Walk the resolved Range and produce N marker spans — one per block parent the range touches — each scoped to the text-node group within that block. Mirrors how Hypothesis, the CSS Custom Highlight API, and most annotation libraries handle multi-block selections. The badge can still attach to the last marker (already the case per task 2).

This is what task 2's "supported" claim implies should already work. The bug suggests the per-text-node loop crosses block parents in a way React's tree can't reconcile.

### 2. Fail gracefully

At minimum: catch the throw inside the annotation effect, mark the annotation `resolved: false`, and continue rendering. Crashing the whole slide because one annotation's range is awkward is a worse UX than a missing highlight. The `ResolvedAnnotation` type with `resolved: boolean` already exists — wire this case into it.

### 3. Clip on selection-change

When `onSelectionChange` would emit an anchor that crosses block parents, either (a) clip the `exact` text to the block where the selection started or (b) emit `null`. This keeps the consumer from ever holding a "poisoned" selector. Less correct than #1 because it silently drops user intent, but a one-line guard if #1 isn't on the table soon.

## Consumer-side workaround (electron-app)

Currently filtering out annotations whose `exact` contains `/\n\s*\n/` before passing to `<DocumentView>` (with a console warning), and rejecting selections that look the same way before allowing a draft note. Will remove this guard when the library handles cross-block ranges correctly. Code: `src/renderer/panels/markdown-panel/MarkdownPanel.tsx` — search for `isSafeAnchor`.

## Acceptance

- The repro markdown + annotation above renders without throwing.
- The annotated text is visibly highlighted across all blocks in the range.
- The badge (if `count` is set) attaches to the last block in the range.
- Removing the consumer's `isSafeAnchor` filter does not regress.

## Status

To Do
