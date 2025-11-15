import { parseMarkdownChunks as parseMarkdownChunksCore } from '@principal-ade/markdown-utils';

/**
 * Parses markdown content within a slide into chunks (markdown and mermaid)
 * Now uses the core library implementation
 */
export const parseMarkdownChunks = parseMarkdownChunksCore;
