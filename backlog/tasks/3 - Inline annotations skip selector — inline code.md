# Inline annotations: SKIP_SELECTOR is too aggressive on inline `<code>`

The text-quote resolver shipped in `themed-markdown@0.1.87` (see `2 - Inline annotations API.md`) drops anchors whose selection touches inline `<code>` content. Block code (`<pre><code>`) should still be skipped, but inline `<code>` should be in the indexed text so reviewers can highlight prose that contains short backticked terms.

## Where the bug lives

```ts
// dist/industryMarkdown/utils/annotationResolver.ts
var SKIP_SELECTOR = "script, style, code, pre";

function buildTextIndex(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      …
    }
  });
  …
}
```

`parent.closest("code")` matches inline `<code>` *and* the `<code>` inside `<pre>`. The intent (per the `2 - Inline annotations API.md` impl notes) is to skip code *blocks*, not inline code.

## Repro

In the consumer (electron-app), open the `SequenceWorkshop` storybook story.

- Click an event so the markdown overlay shows the event's `description` (which contains inline backticks). Example: `evt-login.description` includes `` `{ email, password }` `` and `` `/api/login` ``.
- Select prose that crosses or starts/ends inside any inline code span.
- Click the floating "Add note" pill → composer opens → highlight does **not** appear.
- After posting → saved annotation is also unresolved → still no highlight.

The same flow on the payload `summary` (no inline code) works correctly: highlight appears immediately on selection-pill-click and persists after posting.

## Why it fails

Two failure modes, depending on where the user's drag starts:

1. **Selection start/end is inside a `<code>` text node.**
   `selectionToAnchor` short-circuits when `index.nodes.find((e) => e.node === range.startContainer)` returns `undefined`, returning `{ exact }` with no `prefix`/`suffix`. Then `range.toString()` includes the code text. The resolver searches `exact` in `index.text`, which has the code text *removed*, so `indexOf` returns `-1` → orphan.

2. **Selection crosses one or more inline `<code>` spans.**
   `range.startContainer` and `range.endContainer` are normal text nodes (in the index), so `prefix`/`suffix` get computed from `index.text` (which skips code). But `exact = range.toString()` includes the code's text content. `prefix + exact + suffix` therefore contains characters that are not in `index.text` → `indexOf` returns `-1` → orphan.

Plain prose selections that don't touch any inline code resolve fine — the bug is specifically when inline code lies inside or at the boundary of the selection.

## Suggested fix

Narrow the skip selector so it only excludes *block* code:

```ts
var SKIP_SELECTOR = "script, style, pre";
```

Inline `<code>` text should be in the index. This makes the index consistent with `range.toString()` for any selection inside the rendered prose, which is the common author intent.

The same change is needed in both spots that consume `SKIP_SELECTOR` (the walker used by `buildTextIndex` and any sibling walkers that mirror it).

### Why drop `code` entirely instead of differentiating

The CSS structure is `<pre><code>…</code></pre>` for fenced blocks. `parent.closest("pre")` already excludes the inner code from indexing, so removing `code` from the selector keeps block code skipped while letting inline `<code>` (which is *not* nested under `<pre>`) participate.

Indented code blocks render as `<pre><code>` too, so they're covered.

## Tests worth adding

- Anchor resolves when `exact` is a phrase that contains an inline-code span.
  Source: `Posts \`{ email, password }\` to /api/login`
  Anchor: `{ exact: "Posts { email, password } to /api/login" }`
  Expected: range covers the full phrase including the code's text.
- Anchor resolves when the selection starts inside an inline-code span.
  Source: `the \`runtime\` trace, not the typed version`
  Anchor: `{ exact: "runtime trace" }` (caller selected from inside the code through the trailing prose)
  Expected: range covers `runtime trace` (resolver may need to map back to mixed code/text nodes — confirm `wrapRange` handles this).
- **Regression:** a fenced code block (`\`\`\`ts … \`\`\``) still gets skipped — anchors with `exact` that only matches text inside a fenced block should orphan as before.
- **Regression:** existing prose-only anchors (no code anywhere in or around) keep working unchanged.

## Consumer side

Until this lands, the consumer (electron-app) has two options:

1. Rewrite seed/test descriptions to avoid inline code so UX iteration isn't blocked.
2. Surface a console warning when an anchor lacks prefix/suffix or fails to resolve, so users know their selection is unsupported. This is purely diagnostic — the real fix is here.

Will pin the consumer to `^0.1.87` and bump again once this ships.
