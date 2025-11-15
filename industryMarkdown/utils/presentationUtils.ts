import {
  MarkdownPresentation,
  MarkdownSlide,
  MarkdownSource,
  MarkdownSourceType,
  RepositoryInfo,
  parseMarkdownChunks,
  extractSlideTitle as extractSlideTitleCore,
  parseMarkdownIntoPresentation as parseMarkdownIntoPresentationCore,
} from '@principal-ade/markdown-utils';

/**
 * Extract the title from slide content (first heading or first line)
 * Re-export from core library
 */
export const extractSlideTitle = extractSlideTitleCore;

export function parseMarkdownIntoPresentationFromSource(
  source: MarkdownSource,
): MarkdownPresentation {
  let presentation: MarkdownPresentation;
  switch (source.type) {
    case MarkdownSourceType.WORKSPACE_FILE:
    case MarkdownSourceType.GITHUB_FILE:
    case MarkdownSourceType.DRAFT:
      presentation = parseMarkdownIntoPresentation(source.content, source.repositoryInfo);
      break;
    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
  presentation.source = source;
  return presentation;
}

export function createGithubFileSource(
  content: string,
  repositoryInfo: RepositoryInfo,
): MarkdownSource {
  return {
    type: MarkdownSourceType.GITHUB_FILE,
    content,
    repositoryInfo,
    editable: false,
    deletable: false,
  };
}

/**
 * Enhanced version of markdown slide parsing that preserves location information
 * and returns a structured Presentation object
 * Now uses the core library implementation
 */
export function parseMarkdownIntoPresentation(
  markdownContent: string,
  repositoryInfo?: RepositoryInfo,
): MarkdownPresentation {
  // Use core library implementation - always using header format
  return parseMarkdownIntoPresentationCore(markdownContent, repositoryInfo);
}

/**
 *
 * @param errorMessage Depricated
 * @returns
 */
export function createPresentationWithErrorMessage(errorMessage: string): MarkdownPresentation {
  const errorMessageMarkdown = `# Error Loading Markdown:\n\n${errorMessage}`;
  return {
    slides: [
      {
        id: 'error',
        title: extractSlideTitle(errorMessageMarkdown),
        location: {
          startLine: 0,
          endLine: 0,
          content: errorMessageMarkdown,
        },
        chunks: parseMarkdownChunks(errorMessageMarkdown, 'slide-error'),
      },
    ],
    originalContent: errorMessageMarkdown,
  };
}

/**
 * Helper function to reconstruct the original markdown content from a Presentation object
 */
export function reconstructMarkdownContent(presentation: MarkdownPresentation): string {
  // Always use header format
  return presentation.slides
    .map((slide, index) => {
      // First slide might not have ## if it was content before first header
      if (index === 0 && !slide.location.content.startsWith('##')) {
        return slide.location.content;
      }
      // Ensure header slides start with ##
      return slide.location.content.startsWith('##')
        ? slide.location.content
        : `## ${slide.location.content}`;
    })
    .join('\n\n');
}

/**
 * Get all slide titles from a presentation
 */
export function getAllSlideTitles(presentation: MarkdownPresentation): string[] {
  return presentation.slides.map(slide => slide.title);
}

/**
 * Find a slide by title (returns first match)
 */
export function findSlideByTitle(
  presentation: MarkdownPresentation,
  title: string,
): MarkdownSlide | undefined {
  return presentation.slides.find(slide => slide.title === title);
}

/**
 * Find slide index by title (returns first match)
 */
export function findSlideIndexByTitle(presentation: MarkdownPresentation, title: string): number {
  return presentation.slides.findIndex(slide => slide.title === title);
}

/**
 * Update a slide's title (creates a new slide object)
 */
export function updateSlideTitle(slide: MarkdownSlide, newTitle: string): MarkdownSlide {
  return {
    ...slide,
    title: newTitle,
  };
}

/**
 * Serialize a MarkdownPresentation back to markdown string
 * This is an alias for reconstructMarkdownContent for clearer API
 */
export function serializePresentationToMarkdown(presentation: MarkdownPresentation): string {
  return reconstructMarkdownContent(presentation);
}

/**
 * Update a slide's content and regenerate its metadata
 */
export function updateSlideContent(slide: MarkdownSlide, newContent: string): MarkdownSlide {
  return {
    ...slide,
    location: {
      ...slide.location,
      content: newContent,
    },
    title: extractSlideTitle(newContent),
    chunks: parseMarkdownChunks(newContent, slide.id.split('-')[1] || 'slide'),
  };
}

/**
 * Create a new presentation with updated slide at the specified index
 */
export function updatePresentationSlide(
  presentation: MarkdownPresentation,
  index: number,
  newContent: string,
): MarkdownPresentation {
  const updatedSlides = [...presentation.slides];
  if (index >= 0 && index < updatedSlides.length) {
    updatedSlides[index] = updateSlideContent(updatedSlides[index], newContent);
  }

  return {
    ...presentation,
    slides: updatedSlides,
    originalContent: reconstructMarkdownContent({
      ...presentation,
      slides: updatedSlides,
    }),
  };
}
