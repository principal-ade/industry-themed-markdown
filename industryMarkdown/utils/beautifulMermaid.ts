import { Theme } from '@principal-ade/industry-theme';
import { RenderOptions } from 'beautiful-mermaid';

const SUPPORTED_HEADERS = new Set([
  'graph',
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'erDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'xychart',
  'xychart-beta',
]);

/**
 * Diagram types `beautiful-mermaid` can render. Everything else (pie, mindmap,
 * gitGraph, gantt, journey, timeline, quadrant, requirement, C4, block-beta)
 * must fall back to mermaid.js.
 */
export function isBeautifulMermaidSupported(code: string): boolean {
  const header = extractMermaidHeader(code);
  if (!header) return false;
  return SUPPORTED_HEADERS.has(header);
}

/**
 * Extract the diagram-type keyword from the first meaningful line of mermaid
 * source. Skips leading YAML frontmatter (`---` config blocks), comment lines,
 * and blank lines so `isBeautifulMermaidSupported` agrees with what the
 * renderers themselves will parse.
 */
export function extractMermaidHeader(code: string): string | null {
  const lines = code.split('\n');
  let i = 0;

  while (i < lines.length && lines[i].trim() === '') i++;

  if (i < lines.length && lines[i].trim().startsWith('---')) {
    i++;
    while (i < lines.length && lines[i].trim() !== '---') i++;
    i++;
  }

  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '' || trimmed.startsWith('%%')) continue;
    const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Map an industry Theme onto beautiful-mermaid's color roles. The diagram is
 * rendered transparent so the container's own fill shows through (matching the
 * existing mermaid.js behavior); explicit enrichment colors keep the
 * color-mix() derivations from drifting off-theme.
 */
export function buildBeautifulMermaidOptions(theme: Theme): RenderOptions {
  return {
    transparent: true,
    bg: theme.colors.background,
    fg: theme.colors.text,
    line: theme.colors.textSecondary,
    accent: theme.colors.accent,
    muted: theme.colors.textMuted,
    surface: theme.colors.backgroundTertiary,
    border: theme.colors.border,
    font: firstFontFamily(theme.fonts.body),
  };
}

/**
 * beautiful-mermaid emits `@import url('https://fonts.googleapis.com/...')`
 * lines so its default font (Inter) is always available. These are a network
 * dependency we don't want in an offline-friendly renderer — the theme's font
 * family is already declared in the SVG's `text { font-family }` rule and the
 * host app loads its own fonts. Strip the imports, keeping the fallbacks.
 */
export function stripBeautifulFontImports(svg: string): string {
  return svg.replace(/@import\s+url\([^)]*\)\s*;?/g, '');
}

function firstFontFamily(fontStack: string): string {
  const first = fontStack
    .split(',')[0]
    ?.trim()
    .replace(/^["']+|["']+$/g, '');
  return first || 'Inter';
}
