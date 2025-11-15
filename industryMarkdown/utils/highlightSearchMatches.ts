import { Theme } from '@principal-ade/industry-theme';

/**
 * Highlights search matches in markdown content by wrapping them with <mark> tags
 * Preserves markdown syntax and code blocks
 */
export function highlightSearchMatches(content: string, searchQuery: string): string {
  if (!searchQuery || !searchQuery.trim()) {
    return content;
  }

  // Escape special regex characters in the search query
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Split content into segments to preserve code blocks
  const codeBlockRegex = /(```[\s\S]*?```|`[^`]+`)/g;
  const segments: { text: string; isCode: boolean }[] = [];
  let lastIndex = 0;
  let match;

  // Find all code blocks and inline code
  const codeMatches: { start: number; end: number; text: string }[] = [];
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  // Build segments array
  if (codeMatches.length === 0) {
    segments.push({ text: content, isCode: false });
  } else {
    codeMatches.forEach(codeMatch => {
      // Add text before code block
      if (lastIndex < codeMatch.start) {
        segments.push({
          text: content.slice(lastIndex, codeMatch.start),
          isCode: false,
        });
      }
      // Add code block
      segments.push({
        text: codeMatch.text,
        isCode: true,
      });
      lastIndex = codeMatch.end;
    });
    // Add remaining text after last code block
    if (lastIndex < content.length) {
      segments.push({
        text: content.slice(lastIndex),
        isCode: false,
      });
    }
  }

  // Apply highlighting to non-code segments
  const highlightedSegments = segments.map(segment => {
    if (segment.isCode) {
      // Don't highlight inside code blocks
      return segment.text;
    }

    // Create regex for case-insensitive matching
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Wrap matches with <mark> tags
    return segment.text.replace(regex, '<mark>$1</mark>');
  });

  return highlightedSegments.join('');
}

/**
 * Get theme-aware styles for the mark element
 */
export const getMarkStyles = (theme: Theme) => ({
  backgroundColor: theme.colors.highlightBg || theme.colors.highlight || 'rgba(255, 193, 7, 0.25)',
  color: theme.colors.text,
  padding: '0.05em 0.15em',
  borderRadius: `${theme.radii[0]}px`,
  boxDecoration: 'none',
  fontWeight: 'inherit',
  // Use border instead of box-shadow for better performance with many highlights
  border: `1px solid ${theme.colors.highlightBorder || 'rgba(255, 193, 7, 0.4)'}`,
});
