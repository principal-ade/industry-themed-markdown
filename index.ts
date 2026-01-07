// Main entry point for themed-markdown package

// Auto-inject highlight.js CSS for syntax highlighting
import './industryMarkdown/utils/injectStyles';

// Components
export { IndustryMarkdownSlide } from './industryMarkdown/components/IndustryMarkdownSlide';
export type { IndustryMarkdownSlideProps } from './industryMarkdown/components/IndustryMarkdownSlide';

export { SlidePresentation } from './industryMarkdown/components/SlidePresentation';
export type { SlidePresentationProps } from './industryMarkdown/components/SlidePresentation';

export { SlidePresentationBook } from './industryMarkdown/components/SlidePresentationBook';
export type { SlidePresentationBookProps } from './industryMarkdown/components/SlidePresentationBook';

export { DocumentView } from './industryMarkdown/components/DocumentView';
export type { DocumentViewProps } from './industryMarkdown/components/DocumentView';

export { SkillMarkdown } from './industryMarkdown/components/SkillMarkdown';
export type { SkillMarkdownProps } from './industryMarkdown/components/SkillMarkdown';

export { SlideNavigationHeader } from './industryMarkdown/components/SlideNavigationHeader';
export type { SlideNavigationHeaderProps } from './industryMarkdown/components/SlideNavigationHeader';

export { SlideSearchBar } from './industryMarkdown/components/SlideSearchBar';
export type {
  SlideSearchBarProps,
  SearchResult,
} from './industryMarkdown/components/SlideSearchBar';

export { createIndustryMarkdownComponents } from './industryMarkdown/components/IndustryMarkdownComponents';

// Modal components
export {
  IndustryHtmlModal,
  useIndustryHtmlModal,
} from './industryMarkdown/components/IndustryHtmlModal';
export { IndustryPlaceholderModal } from './industryMarkdown/components/IndustryPlaceholderModal';
export { IndustryMermaidModal } from './industryMarkdown/components/IndustryMermaidModal';
export { IndustryLazyMermaidDiagram } from './industryMarkdown/components/IndustryLazyMermaidDiagram';
export { IndustryZoomableMermaidDiagram } from './industryMarkdown/components/IndustryZoomableMermaidDiagram';

// Utilities
export {
  parseMarkdownIntoPresentation,
  serializePresentationToMarkdown,
  updatePresentationSlide,
  parseMarkdownIntoPresentationFromSource,
  createGithubFileSource,
  extractSlideTitle,
  createPresentationWithErrorMessage,
  reconstructMarkdownContent,
  getAllSlideTitles,
  findSlideByTitle,
  findSlideIndexByTitle,
  updateSlideTitle,
  updateSlideContent,
} from './industryMarkdown/utils/presentationUtils';

export { parseMarkdownChunks } from './industryMarkdown/utils/markdownUtils';

// Types
export type {
  MarkdownPresentation,
  MarkdownSlide,
  MarkdownSource,
  MarkdownSourceType,
  RepositoryInfo,
  MarkdownSlideLocation,
} from './industryMarkdown/types/presentation';

export type {
  ContentChunk,
  MarkdownChunk,
  MermaidChunk,
  CodeChunk,
} from './industryMarkdown/types/customMarkdownChunks';

// Theme system
export type { Theme } from '@principal-ade/industry-theme';
export { theme as defaultTheme } from '@principal-ade/industry-theme';
export { ThemeProvider, withTheme } from '@principal-ade/industry-theme';
export {
  scaleThemeFonts,
  increaseFontScale,
  decreaseFontScale,
  resetFontScale,
} from '@principal-ade/industry-theme';

// Export all available themes
export {
  terminalTheme,
  regalTheme,
  matrixTheme,
  matrixMinimalTheme,
  slateTheme,
} from '@principal-ade/industry-theme';
