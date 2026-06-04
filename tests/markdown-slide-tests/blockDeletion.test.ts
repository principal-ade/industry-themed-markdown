import { describe, it, expect } from '@jest/globals';

import {
  computeChunkOffsets,
  computeDeletion,
  computeTextDeletion,
} from '../../industryMarkdown/utils/blockDeletion';

describe('computeChunkOffsets', () => {
  it('locates each chunk as a substring of content', () => {
    const content = 'alpha\n\nbeta\n\ngamma';
    const chunks = [{ content: 'alpha' }, { content: 'beta' }, { content: 'gamma' }];
    expect(computeChunkOffsets(content, chunks)).toEqual([0, 7, 13]);
  });

  it('keeps the search monotonic for duplicate chunk bodies', () => {
    const content = 'dup\n\ndup';
    const chunks = [{ content: 'dup' }, { content: 'dup' }];
    expect(computeChunkOffsets(content, chunks)).toEqual([0, 5]);
  });

  it('returns -1 for chunks that cannot be located', () => {
    const content = 'hello world';
    expect(computeChunkOffsets(content, [{ content: 'missing' }])).toEqual([-1]);
  });
});

describe('computeDeletion', () => {
  const content = `# Title

First paragraph.

- item one
- item two

Last paragraph.`;
  // Single markdown chunk equal to the whole content (typical slide).
  const chunks = [{ content }];

  it('deletes a single block by its line range', () => {
    const result = computeDeletion(content, chunks, [
      { chunkIndex: 0, startLine: 3, endLine: 3 },
    ]);
    expect(result.removedText).toBe('First paragraph.\n\n');
    expect(result.newContent).toBe(`# Title

- item one
- item two

Last paragraph.`);
  });

  it('deletes a multi-line block (a list)', () => {
    const result = computeDeletion(content, chunks, [
      { chunkIndex: 0, startLine: 5, endLine: 6 },
    ]);
    expect(result.removedText).toBe('- item one\n- item two\n\n');
    expect(result.newContent).toBe(`# Title

First paragraph.

Last paragraph.`);
  });

  it('merges multiple targets and removes them in order', () => {
    const result = computeDeletion(content, chunks, [
      { chunkIndex: 0, startLine: 8, endLine: 8 },
      { chunkIndex: 0, startLine: 1, endLine: 1 },
    ]);
    expect(result.ranges).toHaveLength(2);
    expect(result.newContent).toBe(`First paragraph.

- item one
- item two

`);
  });

  it('handles deleting the final block without a trailing newline', () => {
    const result = computeDeletion(content, chunks, [
      { chunkIndex: 0, startLine: 8, endLine: 8 },
    ]);
    expect(result.removedText).toBe('Last paragraph.');
    expect(result.newContent).toBe(`# Title

First paragraph.

- item one
- item two

`);
  });

  it('maps line ranges relative to the owning chunk', () => {
    const multi = `intro line

second line`;
    // Two chunks: offsets 0 and 12.
    const twoChunks = [{ content: 'intro line' }, { content: 'second line' }];
    const result = computeDeletion(multi, twoChunks, [
      { chunkIndex: 1, startLine: 1, endLine: 1 },
    ]);
    expect(result.removedText).toBe('second line');
    expect(result.newContent).toBe('intro line\n\n');
  });

  it('ignores targets pointing at unresolved chunks', () => {
    const result = computeDeletion(content, [{ content: 'nope' }], [
      { chunkIndex: 0, startLine: 1, endLine: 1 },
    ]);
    expect(result.newContent).toBe(content);
    expect(result.removedText).toBe('');
  });
});

describe('computeTextDeletion', () => {
  it('removes an exact source character range within a chunk', () => {
    const content = 'The quick brown fox.';
    const chunks = [{ content }];
    // Remove "quick " (offsets 4-10).
    const result = computeTextDeletion(content, chunks, 0, 4, 10);
    expect(result.removedText).toBe('quick ');
    expect(result.newContent).toBe('The brown fox.');
  });

  it('maps offsets relative to the owning chunk', () => {
    const content = 'alpha\n\nbeta gamma';
    const chunks = [{ content: 'alpha' }, { content: 'beta gamma' }];
    // Within chunk 1, remove "beta " (chunk-relative offsets 0-5).
    const result = computeTextDeletion(content, chunks, 1, 0, 5);
    expect(result.removedText).toBe('beta ');
    expect(result.newContent).toBe('alpha\n\ngamma');
  });

  it('normalizes reversed offsets', () => {
    const content = 'abcdef';
    const result = computeTextDeletion(content, [{ content }], 0, 4, 1);
    expect(result.removedText).toBe('bcd');
    expect(result.newContent).toBe('aef');
  });

  it('is a no-op for an empty range', () => {
    const content = 'abcdef';
    const result = computeTextDeletion(content, [{ content }], 0, 2, 2);
    expect(result.newContent).toBe(content);
    expect(result.removedText).toBe('');
  });

  it('is a no-op for an unresolved chunk', () => {
    const content = 'abcdef';
    const result = computeTextDeletion(content, [{ content: 'zzz' }], 0, 0, 2);
    expect(result.newContent).toBe(content);
  });
});
