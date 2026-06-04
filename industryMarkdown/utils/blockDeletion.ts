/**
 * Block deletion helpers.
 *
 * The slide renders markdown as a list of chunks; each rendered block element
 * is tagged (via `data-md-chunk` / `data-md-start` / `data-md-end`) with the
 * chunk it belongs to and its 1-based source line range *within that chunk's
 * content*. When a user highlights text we resolve the highlight to the
 * top-level blocks it touches, then splice those blocks' source lines out of
 * the full slide content.
 *
 * Mapping chunk-relative line ranges back to the full `content` relies on the
 * fact that each `markdown_chunk.content` is an exact substring of the slide
 * content (the parser slices without trimming what it stores), so a chunk's
 * absolute character offset can be recovered with a forward `indexOf`.
 */

export interface BlockDeletionTarget {
  /** Index of the chunk in the slide's chunk list. */
  chunkIndex: number;
  /** 1-based, inclusive start line relative to the chunk's content. */
  startLine: number;
  /** 1-based, inclusive end line relative to the chunk's content. */
  endLine: number;
}

export interface ResolvedDeletion {
  /** Slide content with the targeted blocks removed. */
  newContent: string;
  /** The exact source text that was removed. */
  removedText: string;
  /** Absolute character ranges removed from `content` (merged, sorted). */
  ranges: Array<{ start: number; end: number }>;
}

interface ChunkLike {
  content: string;
}

/** Character offset of the start of a 1-based `line` within `text`. */
function lineStartOffset(text: string, line: number): number {
  if (line <= 1) return 0;
  let offset = 0;
  let current = 1;
  while (current < line) {
    const nl = text.indexOf('\n', offset);
    if (nl === -1) return text.length;
    offset = nl + 1;
    current += 1;
  }
  return offset;
}

/** Character offset just past the last character of a 1-based `line` (excludes the newline). */
function lineEndOffset(text: string, line: number): number {
  const start = lineStartOffset(text, line);
  const nl = text.indexOf('\n', start);
  return nl === -1 ? text.length : nl;
}

/**
 * Resolve each chunk's absolute character offset within `content`. Chunks
 * whose content can't be located resolve to -1. A forward cursor keeps the
 * search monotonic so duplicate chunk bodies still map to distinct offsets.
 */
export function computeChunkOffsets(content: string, chunks: ChunkLike[]): number[] {
  const offsets: number[] = [];
  let cursor = 0;
  for (const chunk of chunks) {
    if (!chunk.content) {
      offsets.push(-1);
      continue;
    }
    const idx = content.indexOf(chunk.content, cursor);
    offsets.push(idx);
    if (idx !== -1) {
      cursor = idx + chunk.content.length;
    }
  }
  return offsets;
}

/**
 * Compute the result of deleting `targets` from `content`. Overlapping or
 * adjacent ranges are merged; each block's trailing newline is consumed so the
 * surrounding text collapses cleanly.
 */
export function computeDeletion(
  content: string,
  chunks: ChunkLike[],
  targets: BlockDeletionTarget[],
): ResolvedDeletion {
  const offsets = computeChunkOffsets(content, chunks);

  const ranges: Array<{ start: number; end: number }> = [];
  for (const target of targets) {
    const base = offsets[target.chunkIndex];
    const chunk = chunks[target.chunkIndex];
    if (base === undefined || base < 0 || !chunk) continue;

    const chunkText = chunk.content;
    const startRel = lineStartOffset(chunkText, target.startLine);
    let endRel = lineEndOffset(chunkText, target.endLine);
    // Consume the block's trailing newline so we don't leave a blank gap.
    if (chunkText[endRel] === '\n') endRel += 1;
    // Consume a single following blank-separator line so deletions don't
    // accumulate empty lines in the source.
    if (endRel < chunkText.length) {
      const nextNl = chunkText.indexOf('\n', endRel);
      const followingLineEnd = nextNl === -1 ? chunkText.length : nextNl;
      if (chunkText.slice(endRel, followingLineEnd).trim() === '') {
        endRel = nextNl === -1 ? chunkText.length : nextNl + 1;
      }
    }

    ranges.push({ start: base + startRel, end: base + endRel });
  }

  ranges.sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  let newContent = '';
  let removedText = '';
  let cursor = 0;
  for (const range of merged) {
    newContent += content.slice(cursor, range.start);
    removedText += content.slice(range.start, range.end);
    cursor = range.end;
  }
  newContent += content.slice(cursor);

  return { newContent, removedText, ranges: merged };
}

/**
 * Delete an exact source character range (precise "text" deletion). The
 * offsets are relative to the owning chunk's content; they're mapped to the
 * full slide content via the chunk's absolute offset.
 */
export function computeTextDeletion(
  content: string,
  chunks: ChunkLike[],
  chunkIndex: number,
  startOffset: number,
  endOffset: number,
): ResolvedDeletion {
  const empty: ResolvedDeletion = { newContent: content, removedText: '', ranges: [] };
  const chunk = chunks[chunkIndex];
  if (!chunk) return empty;

  const base = computeChunkOffsets(content, chunks)[chunkIndex];
  if (base === undefined || base < 0) return empty;

  const start = Math.min(startOffset, endOffset);
  const end = Math.max(startOffset, endOffset);
  if (start === end) return empty;

  const absStart = base + start;
  const absEnd = base + end;

  return {
    newContent: content.slice(0, absStart) + content.slice(absEnd),
    removedText: content.slice(absStart, absEnd),
    ranges: [{ start: absStart, end: absEnd }],
  };
}
