/**
 * rehype plugin: wrap each prose text node in a
 * `<span data-src-start data-src-end>` carrying its source character offsets
 * (into the markdown string that was parsed). This lets a DOM text selection
 * be mapped back to an exact source range for precise ("text") deletion.
 *
 * Notes:
 * - Code (`<pre>` / `<code>`) subtrees are skipped — their rendered text omits
 *   the surrounding fences/backticks, so offset math would be misleading.
 * - Pure-whitespace and position-less text nodes (e.g. the synthetic newlines
 *   between block elements) are left untouched.
 * - The offsets are relative to the exact string handed to the parser, so this
 *   must not be combined with content transforms that shift offsets (e.g.
 *   search-match highlighting). Callers gate on that.
 */

interface HastText {
  type: 'text';
  value: string;
  position?: { start?: { offset?: number }; end?: { offset?: number } };
}

interface HastElement {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  position?: unknown;
}

interface HastRoot {
  type: 'root';
  children?: HastNode[];
}

type HastNode = HastText | HastElement | HastRoot | { type: string; children?: HastNode[] };

const SKIP_TAGS = new Set(['pre', 'code']);

function isText(node: HastNode): node is HastText {
  return node.type === 'text';
}

export function rehypeSourcePositions() {
  return (tree: HastRoot) => {
    const visit = (node: HastNode): void => {
      const children = (node as { children?: HastNode[] }).children;
      if (!children) return;
      if (node.type === 'element' && SKIP_TAGS.has((node as HastElement).tagName)) return;

      const out: HastNode[] = [];
      for (const child of children) {
        const startOffset = isText(child) ? child.position?.start?.offset : undefined;
        const endOffset = isText(child) ? child.position?.end?.offset : undefined;
        if (
          isText(child) &&
          typeof startOffset === 'number' &&
          typeof endOffset === 'number' &&
          child.value.trim() !== ''
        ) {
          out.push({
            type: 'element',
            tagName: 'span',
            properties: { dataSrcStart: startOffset, dataSrcEnd: endOffset },
            children: [child],
            position: child.position,
          } as HastElement);
        } else {
          visit(child);
          out.push(child);
        }
      }
      (node as { children?: HastNode[] }).children = out;
    };
    visit(tree);
  };
}
