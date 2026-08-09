import { describe, expect, it } from '@jest/globals';
import { theme } from '@principal-ade/industry-theme';

import {
  buildBeautifulMermaidOptions,
  extractMermaidHeader,
  isBeautifulMermaidSupported,
  stripBeautifulFontImports,
} from '../../industryMarkdown/utils/beautifulMermaid';

describe('isBeautifulMermaidSupported', () => {
  it('supports graph/flowchart headers', () => {
    expect(isBeautifulMermaidSupported('graph TD\n  A --> B')).toBe(true);
    expect(isBeautifulMermaidSupported('flowchart LR\n  A --> B')).toBe(true);
  });

  it('supports sequence, class, state, ER, and xychart diagrams', () => {
    expect(isBeautifulMermaidSupported('sequenceDiagram\n  A->>B: hi')).toBe(true);
    expect(isBeautifulMermaidSupported('classDiagram\n  class A')).toBe(true);
    expect(isBeautifulMermaidSupported('stateDiagram-v2\n  [*] --> Idle')).toBe(true);
    expect(isBeautifulMermaidSupported('erDiagram\n  A ||--|| B : has')).toBe(true);
    expect(isBeautifulMermaidSupported('xychart-beta\n  bar [1, 2]')).toBe(true);
  });

  it('rejects diagram types beautiful-mermaid cannot render', () => {
    expect(isBeautifulMermaidSupported('pie title P\n  "Dogs" : 3')).toBe(false);
    expect(isBeautifulMermaidSupported('mindmap\n  root((x))')).toBe(false);
    expect(isBeautifulMermaidSupported('gitGraph\n  commit')).toBe(false);
    expect(isBeautifulMermaidSupported('gantt\n  title G')).toBe(false);
    expect(isBeautifulMermaidSupported('journey\n  title J')).toBe(false);
  });

  it('skips leading frontmatter, comments, and blank lines before the header', () => {
    expect(
      isBeautifulMermaidSupported(
        '---\nconfig:\n  theme: base\n---\ngraph LR\n  X --> Y',
      ),
    ).toBe(true);
    expect(isBeautifulMermaidSupported('%% a comment\ngraph LR\n  X --> Y')).toBe(true);
    expect(isBeautifulMermaidSupported('\n\n  sequenceDiagram\n  A->>B: hi')).toBe(true);
  });

  it('does not mistake gitGraph for graph', () => {
    expect(extractMermaidHeader('gitGraph\n  commit')).toBe('gitGraph');
    expect(isBeautifulMermaidSupported('gitGraph\n  commit')).toBe(false);
  });
});

describe('extractMermaidHeader', () => {
  it('returns null for empty or headerless input', () => {
    expect(extractMermaidHeader('')).toBeNull();
    expect(extractMermaidHeader('%% just a comment')).toBeNull();
  });
});

describe('buildBeautifulMermaidOptions', () => {
  it('maps theme colors onto beautiful-mermaid roles', () => {
    const opts = buildBeautifulMermaidOptions(theme);
    expect(opts.transparent).toBe(true);
    expect(opts.bg).toBe(theme.colors.background);
    expect(opts.fg).toBe(theme.colors.text);
    expect(opts.line).toBe(theme.colors.textSecondary);
    expect(opts.accent).toBe(theme.colors.accent);
    expect(opts.muted).toBe(theme.colors.textMuted);
    expect(opts.surface).toBe(theme.colors.backgroundTertiary);
    expect(opts.border).toBe(theme.colors.border);
  });

  it('extracts a single font family from the theme font stack', () => {
    const opts = buildBeautifulMermaidOptions(theme);
    expect(opts.font).toBe('Inter');
  });
});

describe('stripBeautifulFontImports', () => {
  it('removes Google Fonts @import lines from the rendered SVG', () => {
    const svg = `<svg><style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&amp;display=swap');
  text { font-family: 'Inter', system-ui, sans-serif; }
</style></svg>`;
    const stripped = stripBeautifulFontImports(svg);
    expect(stripped).not.toContain('@import');
    expect(stripped).toContain("font-family: 'Inter'");
  });
});
