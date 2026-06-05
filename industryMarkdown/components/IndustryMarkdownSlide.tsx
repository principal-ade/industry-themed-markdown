/**
 * IndustryMarkdownSlide Component
 *
 * A theme-aware markdown slide component that uses the industryTheme system.
 * Based on Theme UI specifications for consistent, modern theming.
 *
 * Features:
 * - Industry theme system integration (Theme UI spec)
 * - HTML sanitization for security
 * - Interactive checkboxes for task lists
 * - Executable bash code blocks
 * - HTML rendering in modal popouts
 * - Mermaid diagram support
 * - Scroll position preservation
 * - Configurable keyboard scrolling
 *
 * Keyboard Scrolling Configuration:
 *
 * Basic usage (uses defaults):
 * ```tsx
 * <ConfigurableMarkdownSlide
 *   enableKeyboardScrolling={true}
 *   // ... other props
 * />
 * ```
 *
 * Custom configuration:
 * ```tsx
 * <ConfigurableMarkdownSlide
 *   enableKeyboardScrolling={true}
 *   keyboardScrollConfig={{
 *     scrollAmount: 150,              // Pixels to scroll per arrow key
 *     pageScrollRatio: 0.9,           // Page scroll ratio (90% of container)
 *     smoothScroll: true,             // Enable smooth scrolling
 *     enableDebugLogging: true,       // Enable console debugging
 *     keys: {
 *       scrollUp: ['ArrowUp', 'k'],   // Custom keys for scroll up
 *       scrollDown: ['ArrowDown', 'j'], // Custom keys for scroll down
 *       pageUp: ['PageUp', 'u'],      // Custom keys for page up
 *       pageDown: ['PageDown', 'd'],  // Custom keys for page down
 *     }
 *   }}
 *   // ... other props
 * />
 * ```
 *
 * For use with the global keyboard binding system:
 * ```tsx
 * import { createScrollKeyboardBindings } from '@/components/MarkdownRendering/ConfigurableMarkdownSlide';
 *
 * const scrollBindings = createScrollKeyboardBindings({
 *   keys: {
 *     scrollUp: ['k'],
 *     scrollDown: ['j'],
 *   }
 * });
 *
 * const allBindings = [...defaultKeyboardBindings, ...scrollBindings];
 * ```
 */

import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import {
  BashCommandOptions,
  BashCommandResult,
  RepositoryInfo,
} from '@principal-ade/markdown-utils';
import { defaultSchema } from 'hast-util-sanitize';
import { Trash2 } from 'lucide-react';
import React, { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import type { Annotation, AnnotationSelection } from '../types/annotations';
import { KeyboardBinding } from '../types/keyboard';
import {
  computeDeletion,
  computeTextDeletion,
  type BlockDeletionTarget,
} from '../utils/blockDeletion';
import { highlightSearchMatches } from '../utils/highlightSearchMatches';
import { parseMarkdownChunks } from '../utils/markdownUtils';
import { rehypeSourcePositions } from '../utils/rehypeSourcePositions';
import { useAnnotations } from '../utils/useAnnotations';
import { useBlockSelection } from '../utils/useBlockSelection';

import { IndustryHtmlModal, useIndustryHtmlModal } from './IndustryHtmlModal';
import { IndustryLazyMermaidDiagram } from './IndustryLazyMermaidDiagram';
import { createIndustryMarkdownComponents } from './IndustryMarkdownComponents';
import { IndustryMermaidModal } from './IndustryMermaidModal';
import { IndustryPlaceholderModal } from './IndustryPlaceholderModal';

export interface IndustryMarkdownSlideProps {
  // === Core Properties ===
  content: string;
  slideIdPrefix: string;
  slideIndex: number;
  isVisible?: boolean;

  // === Event Handlers ===
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;
  onCopyMermaidError?: (mermaidCode: string, errorMessage: string) => void;
  onShowMermaidInPanel?: (code: string, title?: string) => void;
  /**
   * When provided, renders an "open in tab" arrow button over each mermaid
   * diagram, next to the fullscreen/expand button. Called with the diagram
   * code (and a best-effort title derived from the diagram source) so the
   * consumer can open it as its own tab — e.g. the Alexandria window opening
   * a diagram from a topic description/notes.
   */
  onOpenMermaidInTab?: (code: string, title?: string) => void;
  handleRunBashCommand?: (
    command: string,
    options?: BashCommandOptions,
  ) => Promise<BashCommandResult>;
  handlePromptCopy?: (filledPrompt: string) => void;

  // === Feature Toggles ===
  enableHtmlPopout?: boolean;
  autoFocusOnVisible?: boolean;

  // === Search ===
  searchQuery?: string; // Search query for highlighting matches

  // === Layout & Styling ===
  slideHeaderMarginTopOverride?: number;
  theme: Theme;
  fontSizeScale?: number; // Scale factor for all font sizes (e.g., 1.25 for 25% larger)
  containerWidth?: number; // Container width passed from parent (optional - will use ResizeObserver if not provided)
  transparentBackground?: boolean; // If true, no background color is applied (useful when parent handles background)
  additionalPadding?: { left?: string; right?: string; top?: string; bottom?: string }; // Additional padding to add to calculated padding
  /**
   * Skip the container-width-derived base padding on one or both axes.
   * When `true` (boolean shorthand) both axes are zeroed. `additionalPadding`
   * is still applied on top, so the parent can layer its own padding while
   * dropping the slide's default 3%-of-width inset.
   *
   * Useful when the slide is embedded in a layout that already owns
   * horizontal alignment (e.g., aligning the rendered markdown with
   * surrounding body copy).
   */
  disableBasePadding?: boolean | { horizontal?: boolean; vertical?: boolean };
  disableScroll?: boolean; // If true, removes overflow styling (useful when parent handles scrolling)

  // === Dynamic Padding Configuration ===
  minScreenWidth?: number; // Min screen width for padding calculation (default: 320)
  maxScreenWidth?: number; // Max screen width for padding calculation (default: 1920)

  // === Keyboard Scrolling Configuration ===
  enableKeyboardScrolling?: boolean; // Enable/disable keyboard scrolling (default: true)
  keyboardScrollConfig?: KeyboardScrollConfig;

  // === External Data ===
  repositoryInfo?: RepositoryInfo; // Repository information for resolving relative image URLs

  // === Editing ===
  editable?: boolean; // When true, checkboxes are interactive. Default: false

  // === Block Selection / Deletion ===
  /**
   * When true, highlighting text inside the slide resolves to the top-level
   * block(s) it touches and surfaces a floating delete button. The button is
   * only shown when a delete handler (`onContentChange` or `onDeleteBlocks`)
   * is also provided.
   */
  selectableBlocks?: boolean;
  /**
   * How a highlight is resolved for deletion:
   * - 'block' (default): removes the whole top-level block(s) the highlight
   *   touches — robust, and works alongside search highlighting.
   * - 'text': removes the exact highlighted text, mapped back to the markdown
   *   source. Falls back to whole-block removal when a precise range can't be
   *   resolved (e.g. selections inside code or spanning blocks). Note that
   *   partially selecting inline-formatted text (e.g. the word inside
   *   `**bold**`) can leave the surrounding markers behind.
   */
  deletionMode?: 'block' | 'text';
  /**
   * Called with the full slide content after the selected block(s) are
   * removed. The slide is presentational — the consumer owns `content` and is
   * expected to persist this and feed it back in.
   */
  onContentChange?: (newContent: string) => void;
  /**
   * Optional richer notification fired alongside `onContentChange` when a
   * block deletion occurs.
   */
  onDeleteBlocks?: (info: {
    newContent: string;
    removedText: string;
    targets: BlockDeletionTarget[];
  }) => void;

  // === Annotations ===
  annotations?: Annotation[];
  activeAnnotationId?: string | null;
  renderAnnotation?: (annotation: Annotation) => React.ReactNode;
  onSelectionChange?: (selection: AnnotationSelection | null) => void;
  onAnnotationClick?: (annotationId: string, event: MouseEvent) => void;
  /**
   * Color overrides for annotation highlights. Each field is any valid CSS
   * color (hex, rgba, var(...), etc.). Omit a field to keep the default
   * amber palette.
   */
  annotationStyle?: {
    backgroundColor?: string;
    activeBackgroundColor?: string;
  };
}

// Override highlight.js token background colors and ensure proper text colors
const highlightOverrides = `
  /* Override root .hljs class with maximum specificity */
  .markdown-slide .hljs,
  .markdown-slide pre .hljs,
  .markdown-slide code.hljs,
  .markdown-slide pre code.hljs {
    color: inherit !important;
    background: transparent !important;
    background-color: transparent !important;
  }


  /* Remove backgrounds from all highlight.js classes in code blocks */
  pre code .hljs,
  pre code .hljs-keyword,
  pre code .hljs-selector-tag,
  pre code .hljs-literal,
  pre code .hljs-strong,
  pre code .hljs-name,
  pre code .hljs-variable,
  pre code .hljs-number,
  pre code .hljs-string,
  pre code .hljs-comment,
  pre code .hljs-type,
  pre code .hljs-built_in,
  pre code .hljs-builtin-name,
  pre code .hljs-meta,
  pre code .hljs-tag,
  pre code .hljs-title,
  pre code .hljs-attr,
  pre code .hljs-attribute,
  pre code .hljs-addition,
  pre code .hljs-deletion,
  pre code .hljs-link,
  pre code .hljs-doctag,
  pre code .hljs-formula,
  pre code .hljs-section,
  pre code .hljs-selector-class,
  pre code .hljs-selector-attr,
  pre code .hljs-selector-pseudo,
  pre code .hljs-symbol,
  pre code .hljs-bullet,
  pre code .hljs-selector-id,
  pre code .hljs-emphasis,
  pre code .hljs-quote,
  pre code .hljs-template-variable,
  pre code .hljs-regexp,
  pre code .hljs-subst {
    background-color: transparent !important;
  }

  /* Aggressive removal of backgrounds and padding for inline code */
  p code,
  li code,
  td code,
  th code,
  h1 code,
  h2 code,
  h3 code,
  h4 code,
  h5 code,
  h6 code,
  blockquote code,
  .inline-code,
  code:not(pre code) {
    background: transparent !important;
    background-color: transparent !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    color: var(--text-color, currentColor) !important;
  }

  /* Ensure inline code uses its own color even with hljs classes */
  .inline-code,
  .inline-code[class*="hljs"],
  .inline-code[class*="language"] {
    color: var(--text-color) !important;
    background: transparent !important;
    background-color: transparent !important;
    padding: 0 !important;
  }

  /* Override any highlight.js styles on inline code */
  p code[class*="hljs"],
  li code[class*="hljs"],
  td code[class*="hljs"],
  th code[class*="hljs"],
  p code[class*="language"],
  li code[class*="language"],
  td code[class*="language"],
  th code[class*="language"] {
    background: transparent !important;
    background-color: transparent !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    color: var(--text-color) !important;
  }

  /* Remove all hljs styling from any inline code - comprehensive override */
  :not(pre) > code.hljs,
  :not(pre) > code[class*="hljs"],
  :not(pre) > code[class*="language"] {
    all: unset !important;
    font-family: var(--monospace-font-family, monospace) !important;
    font-size: 0.875em !important;
    color: var(--text-color) !important;
    background: transparent !important;
    background-color: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Override all possible hljs token classes for inline code */
  :not(pre) > code .hljs-keyword,
  :not(pre) > code .hljs-selector-tag,
  :not(pre) > code .hljs-literal,
  :not(pre) > code .hljs-strong,
  :not(pre) > code .hljs-name,
  :not(pre) > code .hljs-variable,
  :not(pre) > code .hljs-number,
  :not(pre) > code .hljs-string,
  :not(pre) > code .hljs-comment,
  :not(pre) > code .hljs-type,
  :not(pre) > code .hljs-built_in,
  :not(pre) > code .hljs-builtin-name,
  :not(pre) > code .hljs-meta,
  :not(pre) > code .hljs-tag,
  :not(pre) > code .hljs-title,
  :not(pre) > code .hljs-attr,
  :not(pre) > code .hljs-attribute,
  :not(pre) > code .hljs-addition,
  :not(pre) > code .hljs-deletion,
  :not(pre) > code .hljs-link,
  :not(pre) > code .hljs-doctag,
  :not(pre) > code .hljs-formula,
  :not(pre) > code .hljs-section,
  :not(pre) > code .hljs-selector-class,
  :not(pre) > code .hljs-selector-attr,
  :not(pre) > code .hljs-selector-pseudo,
  :not(pre) > code .hljs-symbol,
  :not(pre) > code .hljs-bullet,
  :not(pre) > code .hljs-selector-id,
  :not(pre) > code .hljs-emphasis,
  :not(pre) > code .hljs-quote,
  :not(pre) > code .hljs-template-variable,
  :not(pre) > code .hljs-regexp,
  :not(pre) > code .hljs-subst {
    color: var(--text-color) !important;
    background: transparent !important;
    background-color: transparent !important;
    font-weight: inherit !important;
    font-style: inherit !important;
    text-decoration: none !important;
  }
`;

// Default annotation styling. Highlights are painted via the CSS Custom
// Highlight API (paint-only, no DOM mutation) so cross-block annotations
// don't crash React's commit phase. Consumers override via the
// `annotationStyle` prop (which sets CSS variables on the slide root) or
// by writing CSS that targets the named highlights below.
const annotationCSS = `
  ::highlight(industry-md-annotation) {
    background-color: var(--industry-md-annotation-bg, rgba(255, 193, 7, 0.22));
  }
  ::highlight(industry-md-annotation-active) {
    background-color: var(
      --industry-md-annotation-active-bg,
      rgba(255, 193, 7, 0.5)
    );
  }
  ::highlight(industry-md-annotation-hover) {
    background-color: var(
      --industry-md-annotation-hover-bg,
      rgba(255, 193, 7, 0.18)
    );
  }
  .industry-md-annotation-indicator[data-count]::after {
    content: attr(data-count);
    display: inline-block;
    transform: translate(2px, -50%);
    min-width: 1.1em;
    height: 1.1em;
    padding: 0 0.3em;
    box-sizing: border-box;
    border-radius: 4px;
    background-color: var(
      --industry-md-annotation-badge-bg,
      rgba(180, 120, 0, 0.95)
    );
    color: var(--industry-md-annotation-badge-color, #fff);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.1em;
    text-align: center;
    box-shadow: 0 0 0 1.5px var(--industry-md-annotation-badge-ring, #fff);
    cursor: pointer;
  }
`;

// Outline applied to blocks a highlight has resolved to for deletion. Paints
// via a data attribute set by useBlockSelection so React's tree is untouched.
const blockSelectionCSS = `
  .markdown-slide [data-md-selected] {
    outline: 2px solid var(--industry-md-delete-outline, rgba(220, 38, 38, 0.7));
    outline-offset: 2px;
    border-radius: 3px;
    background-color: var(--industry-md-delete-bg, rgba(220, 38, 38, 0.08));
  }

  /* Clickable list-item markers (bullet / number) for per-item deletion. */
  .markdown-slide li.md-del-li {
    list-style: none;
  }
  .markdown-slide .md-del-marker {
    flex: 0 0 auto;
    width: 1.5em;
    margin-right: 0.35em;
    padding: 0;
    box-sizing: border-box;
    appearance: none;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    line-height: inherit;
    text-align: right;
    cursor: pointer;
    user-select: none;
    transition: color 0.15s ease;
  }
  .markdown-slide ul .md-del-marker::before {
    content: "\\2022"; /* • */
  }
  .markdown-slide ol {
    counter-reset: md-del-counter;
  }
  .markdown-slide ol > li > .md-del-marker::before {
    counter-increment: md-del-counter;
    content: counter(md-del-counter) ".";
  }
  .markdown-slide .md-del-marker:hover {
    color: var(--industry-md-delete-outline, #dc2626);
  }
  .markdown-slide .md-del-marker:hover::before {
    content: "\\2715"; /* ✕ */
  }
`;

// CSS for smooth font size transitions and first-child heading adjustments
const fontTransitionCSS = `
  .markdown-slide * {
    transition: font-size 0.2s ease-in-out;
  }
  
  /* Disable transitions and dynamic sizing on form elements to prevent flashing */
  .markdown-slide input,
  .markdown-slide label,
  .markdown-slide button,
  .markdown-slide input[type="checkbox"],
  .markdown-slide input[type="radio"] {
    transition: none !important;
    font-size: inherit !important; /* Prevent dynamic font sizing from affecting form elements */
  }
  
  /* Ensure checkbox labels maintain fixed sizing */
  .markdown-slide label[for*="checkbox"] {
    font-size: 1rem !important; /* Fixed size for checkbox labels */
  }
  
  /* Remove top margin from any first element - must override inline styles */
  .markdown-slide > *:first-child,
  .markdown-slide > *:first-child > *:first-child {
    margin-top: 0 !important;
  }

  /* Specifically target all possible first-child elements */
  .markdown-slide > h1:first-child,
  .markdown-slide > h2:first-child,
  .markdown-slide > h3:first-child,
  .markdown-slide > h4:first-child,
  .markdown-slide > h5:first-child,
  .markdown-slide > h6:first-child,
  .markdown-slide > p:first-child,
  .markdown-slide > ul:first-child,
  .markdown-slide > ol:first-child,
  .markdown-slide > div:first-child,
  .markdown-slide > blockquote:first-child,
  .markdown-slide > pre:first-child {
    margin-top: 0 !important;
  }
`;

// Singleton pattern to inject CSS only once
let stylesInjected = false;
const injectStyles = () => {
  if (typeof document !== 'undefined' && !stylesInjected) {
    // Check if styles already exist to prevent duplicates
    if (!document.getElementById('markdown-slide-highlight-overrides')) {
      const highlightStyle = document.createElement('style');
      highlightStyle.id = 'markdown-slide-highlight-overrides';
      highlightStyle.textContent = highlightOverrides;
      document.head.appendChild(highlightStyle);
    }

    if (!document.getElementById('markdown-slide-font-transitions')) {
      const transitionStyle = document.createElement('style');
      transitionStyle.id = 'markdown-slide-font-transitions';
      transitionStyle.textContent = fontTransitionCSS;
      document.head.appendChild(transitionStyle);
    }

    if (!document.getElementById('markdown-slide-annotations')) {
      const annotationStyle = document.createElement('style');
      annotationStyle.id = 'markdown-slide-annotations';
      annotationStyle.textContent = annotationCSS;
      document.head.appendChild(annotationStyle);
    }

    if (!document.getElementById('markdown-slide-block-selection')) {
      const blockSelectionStyle = document.createElement('style');
      blockSelectionStyle.id = 'markdown-slide-block-selection';
      blockSelectionStyle.textContent = blockSelectionCSS;
      document.head.appendChild(blockSelectionStyle);
    }

    stylesInjected = true;
  }
};

// Keyboard scroll configuration type
export interface KeyboardScrollConfig {
  scrollAmount?: number; // Pixels to scroll per arrow key (default: 100)
  pageScrollRatio?: number; // Ratio of container height for page up/down (default: 0.8)
  smoothScroll?: boolean; // Use smooth scrolling behavior (default: true)
  keys?: {
    scrollUp?: string[]; // Keys for scrolling up (default: ['ArrowUp'])
    scrollDown?: string[]; // Keys for scrolling down (default: ['ArrowDown'])
    pageUp?: string[]; // Keys for page up (default: ['PageUp'])
    pageDown?: string[]; // Keys for page down (default: ['PageDown'])
  };
  enableDebugLogging?: boolean; // Enable debug console logs (default: false)
}

// Utility function to create keyboard bindings for slide scrolling
export function createScrollKeyboardBindings(config?: KeyboardScrollConfig): KeyboardBinding[] {
  const defaultConfig = {
    keys: {
      scrollUp: ['ArrowUp'],
      scrollDown: ['ArrowDown'],
      pageUp: ['PageUp'],
      pageDown: ['PageDown'],
    },
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    keys: {
      ...defaultConfig.keys,
      ...config?.keys,
    },
  };

  const bindings: KeyboardBinding[] = [];

  // Add scroll up bindings
  mergedConfig.keys.scrollUp.forEach(key => {
    bindings.push({
      key,
      action: 'scrollUp',
      preventDefault: true,
      stopPropagation: true,
    });
  });

  // Add scroll down bindings
  mergedConfig.keys.scrollDown.forEach(key => {
    bindings.push({
      key,
      action: 'scrollDown',
      preventDefault: true,
      stopPropagation: true,
    });
  });

  // Add page up bindings
  mergedConfig.keys.pageUp.forEach(key => {
    bindings.push({
      key,
      action: 'pageUp',
      preventDefault: true,
      stopPropagation: true,
    });
  });

  // Add page down bindings
  mergedConfig.keys.pageDown.forEach(key => {
    bindings.push({
      key,
      action: 'pageDown',
      preventDefault: true,
      stopPropagation: true,
    });
  });

  return bindings;
}

export const IndustryMarkdownSlide = React.memo(function IndustryMarkdownSlide({
  // === Core Properties ===
  content,
  slideIdPrefix,
  slideIndex,
  isVisible = false,

  // === Event Handlers ===
  onLinkClick,
  onCheckboxChange,
  onCopyMermaidError,
  onShowMermaidInPanel,
  onOpenMermaidInTab,
  handleRunBashCommand,
  handlePromptCopy,

  // === Feature Toggles ===
  enableHtmlPopout = true,
  autoFocusOnVisible = true,

  // === Search ===
  searchQuery,

  // === Layout & Styling ===
  slideHeaderMarginTopOverride,
  theme: themeOverride,
  fontSizeScale = 1.0,
  containerWidth,
  transparentBackground = false,
  additionalPadding,
  disableBasePadding,
  disableScroll = false,

  // === Dynamic Padding Configuration ===
  minScreenWidth: _minScreenWidth,
  maxScreenWidth: _maxScreenWidth,

  // === Keyboard Scrolling Configuration ===
  enableKeyboardScrolling = true,
  keyboardScrollConfig,

  // === External Data ===
  repositoryInfo,

  // === Editing ===
  editable = false,

  // === Block Selection / Deletion ===
  selectableBlocks = false,
  deletionMode = 'block',
  onContentChange,
  onDeleteBlocks,

  // === Annotations ===
  annotations,
  activeAnnotationId,
  renderAnnotation,
  onSelectionChange,
  onAnnotationClick,
  annotationStyle,
}: IndustryMarkdownSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Map<number, number>>(new Map());

  // State for measured container width when containerWidth prop is not provided
  const [measuredContainerWidth, setMeasuredContainerWidth] = useState<number | null>(null);

  // Memoize so ReactMarkdown isn't re-rendered on unrelated state changes
  // (e.g. annotation mounts) — needed to keep injected marker spans intact.
  const chunks = useMemo<ReturnType<typeof parseMarkdownChunks>>(() => {
    if (typeof content !== 'string') return [];
    try {
      return parseMarkdownChunks(content, slideIdPrefix);
    } catch (error) {
      console.error('Error parsing markdown chunks:', error);
      return [];
    }
  }, [content, slideIdPrefix]);

  // Keep track of checked state locally
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // HTML Modal state
  const { htmlModalOpen, htmlModalContent, openHtmlModal, closeHtmlModal } = useIndustryHtmlModal();

  // Mermaid Modal state
  const [mermaidModalOpen, setMermaidModalOpen] = useState(false);
  const [mermaidModalCode, setMermaidModalCode] = useState<string>('');

  // Placeholder Modal state
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderModalData, setPlaceholderModalData] = useState<{
    placeholders: string[];
    promptContent: string;
  } | null>(null);

  // Inject styles only once when component mounts
  useEffect(() => {
    injectStyles();
  }, []);

  // ResizeObserver to measure container width when containerWidth prop is not provided
  useEffect(() => {
    if (containerWidth !== undefined) {
      // If containerWidth is provided, don't use ResizeObserver
      return;
    }

    if (!slideRef.current) {
      return;
    }

    // Add a small delay to ensure the DOM is fully rendered
    const setupResizeObserver = () => {
      // Observe the parent container instead of the slide content
      const parentContainer = slideRef.current?.parentElement;
      if (!parentContainer) {
        return;
      }

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          setMeasuredContainerWidth(width);
        }
      });

      resizeObserver.observe(parentContainer);
      return resizeObserver;
    };

    // Try to set up immediately, but also retry after a short delay
    let resizeObserver = setupResizeObserver();

    if (!resizeObserver) {
      // If immediate setup failed, retry after a short delay
      const timeoutId = setTimeout(() => {
        resizeObserver = setupResizeObserver();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerWidth]);

  // Default keyboard scroll configuration
  const defaultScrollConfig = {
    scrollAmount: 100,
    pageScrollRatio: 0.8,
    smoothScroll: true,
    keys: {
      scrollUp: ['ArrowUp'],
      scrollDown: ['ArrowDown'],
      pageUp: ['PageUp'],
      pageDown: ['PageDown'],
    },
    enableDebugLogging: false,
  };

  // Merge with user configuration
  const scrollConfig = {
    ...defaultScrollConfig,
    ...keyboardScrollConfig,
    keys: {
      ...defaultScrollConfig.keys,
      ...keyboardScrollConfig?.keys,
    },
  };

  // Handle keyboard navigation for arrow keys
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Check if keyboard scrolling is enabled
      if (!enableKeyboardScrolling) {
        return;
      }

      // Only handle keyboard events if this slide is visible
      if (!isVisible) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`🚫 Slide ${slideIndex} ignoring key press - not visible`);
        }
        return;
      }

      if (scrollConfig.enableDebugLogging) {
        console.log(`🔹 Slide ${slideIndex} key pressed:`, event.key, 'Target:', event.target);
      }

      if (!slideRef.current) {
        if (scrollConfig.enableDebugLogging) {
          console.log('❌ slideRef.current is null');
        }
        return;
      }

      // Debug scroll state
      const container = slideRef.current;
      const scrollInfo = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        canScroll: container.scrollHeight > container.clientHeight,
        maxScroll: container.scrollHeight - container.clientHeight,
      };

      if (scrollConfig.enableDebugLogging) {
        console.log(`📊 Slide ${slideIndex} Scroll Info:`, scrollInfo);

        // Debug parent containers to see if we should scroll a different element
        let parent = container.parentElement;
        let level = 1;
        while (parent && level <= 3) {
          const parentScrollInfo = {
            level,
            tagName: parent.tagName,
            className: parent.className,
            scrollTop: parent.scrollTop,
            scrollHeight: parent.scrollHeight,
            clientHeight: parent.clientHeight,
            canScroll: parent.scrollHeight > parent.clientHeight,
            overflowY: getComputedStyle(parent).overflowY,
          };
          console.log(`📊 Slide ${slideIndex} Parent ${level} Info:`, parentScrollInfo);
          parent = parent.parentElement;
          level++;
        }
      }

      // Check if the key matches any configured scroll keys
      const isScrollDown = scrollConfig.keys.scrollDown.includes(event.key);
      const isScrollUp = scrollConfig.keys.scrollUp.includes(event.key);
      const isPageDown = scrollConfig.keys.pageDown.includes(event.key);
      const isPageUp = scrollConfig.keys.pageUp.includes(event.key);

      if (!isScrollDown && !isScrollUp && !isPageDown && !isPageUp) {
        return; // Not a scroll key
      }

      // Find the scrollable target
      let scrollTarget: HTMLElement = container;
      if (!scrollInfo.canScroll) {
        let parent = container.parentElement;
        while (parent) {
          if (parent.scrollHeight > parent.clientHeight) {
            if (scrollConfig.enableDebugLogging) {
              console.log(
                `🎯 Slide ${slideIndex} Found scrollable parent:`,
                parent.tagName,
                parent.className,
              );
            }
            scrollTarget = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

      // Check if target can actually scroll
      if (scrollTarget.scrollHeight <= scrollTarget.clientHeight) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`⚠️ Slide ${slideIndex} Cannot scroll - content fits in container`);
        }
        return;
      }

      // Prevent default behavior for scroll keys
      event.preventDefault();
      event.stopPropagation();

      let scrollAmount = 0;

      if (isScrollDown) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`⬇️ Slide ${slideIndex} Scroll down pressed`);
        }
        scrollAmount = scrollConfig.scrollAmount;
      } else if (isScrollUp) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`⬆️ Slide ${slideIndex} Scroll up pressed`);
        }
        scrollAmount = -scrollConfig.scrollAmount;
      } else if (isPageDown) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`📄⬇️ Slide ${slideIndex} Page down pressed`);
        }
        scrollAmount = scrollTarget.clientHeight * scrollConfig.pageScrollRatio;
      } else if (isPageUp) {
        if (scrollConfig.enableDebugLogging) {
          console.log(`📄⬆️ Slide ${slideIndex} Page up pressed`);
        }
        scrollAmount = -scrollTarget.clientHeight * scrollConfig.pageScrollRatio;
      }

      // Perform the scroll
      const beforeScroll = scrollTarget.scrollTop;
      scrollTarget.scrollBy({
        top: scrollAmount,
        behavior: scrollConfig.smoothScroll ? 'smooth' : 'auto',
      });

      // Debug scroll result
      if (scrollConfig.enableDebugLogging) {
        setTimeout(
          () => {
            const afterScroll = scrollTarget.scrollTop;
            console.log(
              `📈 Slide ${slideIndex} Scroll: ${beforeScroll} → ${afterScroll} (diff: ${afterScroll - beforeScroll})`,
            );
          },
          scrollConfig.smoothScroll ? 100 : 0,
        );
      }
    },
    [enableKeyboardScrolling, isVisible, slideIndex, scrollConfig],
  );

  // Auto-focus the container when it becomes visible (optional)
  // This enables keyboard scrolling without scrolling the page to the slide
  useEffect(() => {
    if (autoFocusOnVisible && isVisible && slideRef.current) {
      slideRef.current.focus({ preventScroll: true });
    }
  }, [autoFocusOnVisible, isVisible]);

  const openPlaceholderModal = (placeholders: string[], promptContent: string) => {
    if (!handlePromptCopy) return; // Only allow modal if handlePromptCopy is provided
    setPlaceholderModalData({ placeholders, promptContent });
    setPlaceholderModalOpen(true);
  };

  const closePlaceholderModal = () => {
    setPlaceholderModalOpen(false);
    setPlaceholderModalData(null);
  };

  // Function to open mermaid modal with code
  const openMermaidModal = (code: string) => {
    setMermaidModalCode(code);
    setMermaidModalOpen(true);
  };

  const closeMermaidModal = () => {
    setMermaidModalOpen(false);
    setMermaidModalCode('');
  };

  const baseTheme = themeOverride ?? defaultTheme;

  // Apply font size scaling if provided
  const theme = useMemo(() => {
    if (fontSizeScale === 1.0) return baseTheme;
    return {
      ...baseTheme,
      fontSizes: baseTheme.fontSizes.map(size => Math.round(size * fontSizeScale)),
    };
  }, [baseTheme, fontSizeScale]);

  // Calculate dynamic padding based on container width using industryTheme spacing
  const calculateSlidePadding = useMemo(() => {
    // Use measured width as fallback when containerWidth prop is not provided
    const effectiveContainerWidth = containerWidth ?? measuredContainerWidth ?? 800; // Default to 800px if neither is available

    // Use 5% of container width for both horizontal and vertical padding
    const paddingPercentage = 0.03; // 5%
    const horizontalPadding = Math.max(5, Math.round(effectiveContainerWidth * paddingPercentage));
    const verticalPadding = Math.max(
      5,
      Math.round(effectiveContainerWidth * (paddingPercentage - 0.015)),
    );

    const result = {
      vertical: `${verticalPadding}px`,
      horizontal: `${horizontalPadding}px`,
    };
    return result;
  }, [containerWidth, measuredContainerWidth]);

  // Calculate final padding including additional padding
  const finalPadding = useMemo(() => {
    const basePadding = calculateSlidePadding.horizontal;
    const baseVerticalPadding = calculateSlidePadding.vertical;

    // Resolve which axes should drop the container-width-derived base.
    const disableHorizontal =
      disableBasePadding === true ||
      (typeof disableBasePadding === 'object' && !!disableBasePadding?.horizontal);
    const disableVertical =
      disableBasePadding === true ||
      (typeof disableBasePadding === 'object' && !!disableBasePadding?.vertical);

    // Parse base padding values (zeroed per-axis when disabled).
    const baseHorizontalValue = disableHorizontal
      ? 0
      : parseInt(basePadding.replace('px', ''), 10);
    const baseVerticalValue = disableVertical
      ? 0
      : parseInt(baseVerticalPadding.replace('px', ''), 10);

    // Calculate additional padding values from additionalPadding prop
    const leftExtra = additionalPadding?.left
      ? parseInt(additionalPadding.left.replace('px', ''), 10)
      : 0;
    const rightExtra = additionalPadding?.right
      ? parseInt(additionalPadding.right.replace('px', ''), 10)
      : 0;
    const topExtra = additionalPadding?.top
      ? parseInt(additionalPadding.top.replace('px', ''), 10)
      : 0;
    const bottomExtra = additionalPadding?.bottom
      ? parseInt(additionalPadding.bottom.replace('px', ''), 10)
      : 0;

    // Create final padding string
    // Use vertical padding for top/bottom, horizontal for sides
    // Add more top padding (1.5x base) for better visual spacing
    const top = Math.round(baseVerticalValue * 1.5) + topExtra;
    const right = baseHorizontalValue + rightExtra;
    // Add a bit more bottom padding (1.5x) for better visual buffer when scrolling
    const bottom = Math.round(baseVerticalValue * 1.5) + bottomExtra;
    const left = baseHorizontalValue + leftExtra;

    return `${top}px ${right}px ${bottom}px ${left}px`;
  }, [
    calculateSlidePadding.horizontal,
    calculateSlidePadding.vertical,
    additionalPadding,
    disableBasePadding,
  ]);

  // Save scroll position per slide
  useEffect(() => {
    const slideElement = slideRef.current;
    if (slideElement) {
      const handleScroll = () => {
        scrollPositionsRef.current.set(slideIndex, slideElement.scrollTop || 0);
      };

      slideElement.addEventListener('scroll', handleScroll);
      return () => {
        slideElement.removeEventListener('scroll', handleScroll);
      };
    }
    return undefined;
  }, [slideIndex]);

  // Restore scroll position for current slide (or start at top if first visit)
  // Use useLayoutEffect to restore scroll position synchronously before paint
  useLayoutEffect(() => {
    if (slideRef.current) {
      const savedPosition = scrollPositionsRef.current.get(slideIndex) ?? 0;
      slideRef.current.scrollTop = savedPosition;
    }
  }, [slideIndex]); // Re-run when slide changes

  // Configure sanitization to allow highlight.js classes and style attributes
  const sanitizeSchema = useMemo(
    () => ({
      ...defaultSchema,
      tagNames: [...(defaultSchema.tagNames || []), 'picture', 'source', 'mark'],
      attributes: {
        ...defaultSchema.attributes,
        // Allow mark element for search highlighting
        mark: ['style', 'className'],
        // Allow className for syntax highlighting
        code: [...(defaultSchema.attributes?.code || []), 'className', 'style'],
        span: [...(defaultSchema.attributes?.span || []), 'className', 'style'],
        pre: [...(defaultSchema.attributes?.pre || []), 'className', 'style'],
        // Allow style attributes on common HTML elements
        div: [...(defaultSchema.attributes?.div || []), 'style', 'className', 'id'],
        p: [...(defaultSchema.attributes?.p || []), 'style', 'className', 'id'],
        h1: [...(defaultSchema.attributes?.h1 || []), 'style', 'className', 'id'],
        h2: [...(defaultSchema.attributes?.h2 || []), 'style', 'className', 'id'],
        h3: [...(defaultSchema.attributes?.h3 || []), 'style', 'className', 'id'],
        h4: [...(defaultSchema.attributes?.h4 || []), 'style', 'className', 'id'],
        h5: [...(defaultSchema.attributes?.h5 || []), 'style', 'className', 'id'],
        h6: [...(defaultSchema.attributes?.h6 || []), 'style', 'className', 'id'],
        strong: [...(defaultSchema.attributes?.strong || []), 'style', 'className'],
        em: [...(defaultSchema.attributes?.em || []), 'style', 'className'],
        ul: [...(defaultSchema.attributes?.ul || []), 'style', 'className'],
        ol: [...(defaultSchema.attributes?.ol || []), 'style', 'className'],
        li: [...(defaultSchema.attributes?.li || []), 'style', 'className'],
        a: [...(defaultSchema.attributes?.a || []), 'style', 'className'],
        img: [...(defaultSchema.attributes?.img || []), 'style', 'className'],
        picture: [...(defaultSchema.attributes?.picture || []), 'style', 'className'],
        source: [
          ...(defaultSchema.attributes?.source || []),
          'srcSet',
          'media',
          'type',
          'sizes',
          'style',
          'className',
        ],
        table: [...(defaultSchema.attributes?.table || []), 'style', 'className'],
        thead: [...(defaultSchema.attributes?.thead || []), 'style', 'className'],
        tbody: [...(defaultSchema.attributes?.tbody || []), 'style', 'className'],
        tr: [...(defaultSchema.attributes?.tr || []), 'style', 'className'],
        th: [...(defaultSchema.attributes?.th || []), 'style', 'className'],
        td: [...(defaultSchema.attributes?.td || []), 'style', 'className'],
        blockquote: [...(defaultSchema.attributes?.blockquote || []), 'style', 'className'],
        hr: [...(defaultSchema.attributes?.hr || []), 'style', 'className'],
        // Additional elements for inline styling (badges, labels, etc.)
        label: [...(defaultSchema.attributes?.label || []), 'style', 'className', 'for'],
        input: [
          ...(defaultSchema.attributes?.input || []),
          'style',
          'className',
          'type',
          'placeholder',
          'value',
          'checked',
          'disabled',
        ],
        button: [
          ...(defaultSchema.attributes?.button || []),
          'style',
          'className',
          'type',
          'disabled',
        ],
        details: [...(defaultSchema.attributes?.details || []), 'style', 'className', 'open'],
        summary: [...(defaultSchema.attributes?.summary || []), 'style', 'className'],
        footer: [...(defaultSchema.attributes?.footer || []), 'style', 'className'],
        header: [...(defaultSchema.attributes?.header || []), 'style', 'className'],
        section: [...(defaultSchema.attributes?.section || []), 'style', 'className'],
      },
    }),
    [],
  );

  // Use component theme for lazy loading margins
  const rootMargin = isVisible ? '0px' : '100px'; // Simplified lazy loading margins

  // Block selection / deletion is only active when explicitly enabled *and* a
  // delete handler is wired up, so the default reading experience (including
  // plain text selection for annotations) is untouched.
  const hasDeleteHandler = !!onContentChange || !!onDeleteBlocks;
  const blockDeletionEnabled = selectableBlocks && hasDeleteHandler;

  // Delete a single list item by its source line range (clicked bullet).
  const handleDeleteListItem = useCallback(
    (chunkIndex: number, startLine: number, endLine: number) => {
      const targets = [{ chunkIndex, startLine, endLine }];
      const { newContent, removedText } = computeDeletion(content, chunks, targets);
      if (newContent === content) return;
      onContentChange?.(newContent);
      onDeleteBlocks?.({ newContent, removedText, targets });
    },
    [content, chunks, onContentChange, onDeleteBlocks],
  );

  // Create a function to get markdown components for each chunk index
  const getMarkdownComponents = useCallback(
    (chunkIndex: number) => {
      const baseComponents = createIndustryMarkdownComponents({
        theme,
        slideIdPrefix,
        slideIndex,
        onLinkClick,
        onCheckboxChange,
        checkedItems,
        setCheckedItems,
        openHtmlModal,
        openPlaceholderModal: handlePromptCopy ? openPlaceholderModal : undefined,
        handleRunBashCommand,
        enableHtmlPopout,
        slideHeaderMarginTopOverride,
        index: chunkIndex,
        repositoryInfo,
        editable,
        selectableBlocks,
        onDeleteListItem: blockDeletionEnabled ? handleDeleteListItem : undefined,
      });

      // Add mark component for search highlighting with inline styles
      if (searchQuery) {
        return {
          ...baseComponents,
          mark: ({ children }: { children?: React.ReactNode }) => (
            <mark
              style={{
                backgroundColor: theme.colors.highlightBg || 'rgba(255, 193, 7, 0.25)',
                color: theme.colors.text,
                padding: '0.05em 0.15em',
                borderRadius: `${theme.radii[0]}px`,
                border: `1px solid ${theme.colors.highlightBorder || 'rgba(255, 193, 7, 0.4)'}`,
                fontWeight: 'inherit',
                textDecoration: 'none',
              }}
            >
              {children}
            </mark>
          ),
        };
      }

      return baseComponents;
    },
    [
      theme,
      slideIdPrefix,
      slideIndex,
      onLinkClick,
      onCheckboxChange,
      checkedItems,
      setCheckedItems,
      openHtmlModal,
      handlePromptCopy,
      handleRunBashCommand,
      enableHtmlPopout,
      slideHeaderMarginTopOverride,
      repositoryInfo,
      searchQuery,
      editable,
      selectableBlocks,
      blockDeletionEnabled,
      handleDeleteListItem,
    ],
  );

  // Precise ("text") deletion needs source-offset spans wrapped around prose
  // text. They're only injected when needed — and never alongside search
  // highlighting, which rewrites the content string and would invalidate the
  // offsets.
  const sourcePositionsEnabled =
    blockDeletionEnabled && deletionMode === 'text' && !searchQuery;

  const rehypePlugins = useMemo(() => {
    const plugins: React.ComponentProps<typeof ReactMarkdown>['rehypePlugins'] = [
      rehypeRaw,
      [rehypeSanitize, sanitizeSchema],
      rehypeSlug,
      rehypeHighlight,
    ];
    if (sourcePositionsEnabled) {
      plugins.push(rehypeSourcePositions);
    }
    return plugins;
  }, [sanitizeSchema, sourcePositionsEnabled]);

  // Memoize the rendered chunks so that annotation-related state changes
  // (which re-render IndustryMarkdownSlide) don't cause ReactMarkdown to
  // reconcile and tear out the marker spans we inject post-render.
  const renderedChunks = useMemo(() => {
    if (chunks.length === 0) {
      return (
        <div
          style={{
            padding: theme.space[4],
            textAlign: 'center',
            color: theme.colors.muted,
            fontSize: theme.fontSizes[2],
          }}
        >
          No content to display
        </div>
      );
    }
    return chunks.map((chunk, index) => {
      if (chunk.type === 'markdown_chunk') {
        const processedContent = searchQuery
          ? highlightSearchMatches(chunk.content, searchQuery)
          : chunk.content;
        return (
          <ReactMarkdown
            key={`${chunk.id}-${JSON.stringify(theme.colors.accent)}`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={rehypePlugins}
            components={getMarkdownComponents(index)}
          >
            {processedContent}
          </ReactMarkdown>
        );
      }
      if (chunk.type === 'mermaid_chunk') {
        const mermaidProps: React.ComponentProps<typeof IndustryLazyMermaidDiagram> = {
          id: chunk.id,
          code: chunk.content,
          onCopyError: onCopyMermaidError,
          rootMargin: rootMargin,
          theme: theme,
          onExpandClick: () => openMermaidModal(chunk.content),
        };
        if (onShowMermaidInPanel) {
          mermaidProps.onShowInPanel = onShowMermaidInPanel;
        }
        if (onOpenMermaidInTab) {
          const handler = onOpenMermaidInTab;
          mermaidProps.onOpenInTab = () => {
            // Best-effort title: first %% comment or the diagram type keyword.
            const titleMatch = chunk.content.match(/^(?:%%\s*(.+)|(\w+)\s)/m);
            const title = titleMatch?.[1] || titleMatch?.[2] || 'Diagram from Markdown';
            handler(chunk.content, title);
          };
        }
        return <IndustryLazyMermaidDiagram key={chunk.id} {...mermaidProps} />;
      }
      return null;
    });
  }, [
    chunks,
    content,
    searchQuery,
    theme,
    rehypePlugins,
    getMarkdownComponents,
    rootMargin,
    onCopyMermaidError,
    onShowMermaidInPanel,
    onOpenMermaidInTab,
  ]);

  // Annotations: walk the rendered DOM and wrap matched ranges so consumers
  // can attach indicators / highlights to specific spans of text.
  const annotationMounts = useAnnotations({
    rootRef: slideRef,
    annotations: annotations ?? [],
    activeAnnotationId,
    onSelectionChange,
    onAnnotationClick,
  });

  const { selection: blockSelection, clear: clearBlockSelection } = useBlockSelection({
    rootRef: slideRef,
    enabled: blockDeletionEnabled,
    mode: deletionMode,
  });

  const handleDeleteSelection = useCallback(() => {
    if (!blockSelection) return;
    const result =
      blockSelection.kind === 'text'
        ? computeTextDeletion(
            content,
            chunks,
            blockSelection.chunkIndex,
            blockSelection.startOffset,
            blockSelection.endOffset,
          )
        : computeDeletion(content, chunks, blockSelection.targets);
    if (result.newContent === content) {
      clearBlockSelection();
      return;
    }
    onContentChange?.(result.newContent);
    onDeleteBlocks?.({
      newContent: result.newContent,
      removedText: result.removedText,
      targets: blockSelection.kind === 'block' ? blockSelection.targets : [],
    });
    clearBlockSelection();
  }, [blockSelection, content, chunks, onContentChange, onDeleteBlocks, clearBlockSelection]);

  // Top-level key handler for the slide: when a block/text selection is
  // resolved, Delete/Backspace removes it (mirroring the floating Delete
  // button). Otherwise the event falls through to keyboard scrolling.
  const handleSlideKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        blockDeletionEnabled &&
        blockSelection &&
        (event.key === 'Delete' || event.key === 'Backspace')
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleDeleteSelection();
        return;
      }
      handleKeyDown(event);
    },
    [blockDeletionEnabled, blockSelection, handleDeleteSelection, handleKeyDown],
  );

  // Floating delete button position. Computed after the button mounts so we can
  // measure it and keep it inside the slide — flipping below the selection when
  // there's no room above, and pulling it left when it would overflow the right
  // edge (the slide clips its overflow, so an unclamped button gets cut off).
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const [deleteBtnPos, setDeleteBtnPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const root = slideRef.current;
    const btn = deleteBtnRef.current;
    if (!blockSelection || !root || !btn) {
      setDeleteBtnPos(null);
      return;
    }
    const { top, bottom, left } = blockSelection.anchor;
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;
    const gap = 4; // breathing room between button and selection
    const margin = 4; // min distance from the slide edges

    // Vertical: prefer above the selection, flip below if it would clip the top.
    let nextTop = top - h - gap;
    if (nextTop < root.scrollTop + margin) {
      nextTop = bottom + gap;
    }
    const maxTop = root.scrollTop + root.clientHeight - h - margin;
    if (nextTop > maxTop) nextTop = Math.max(root.scrollTop + margin, maxTop);

    // Horizontal: anchor to the selection's right edge, clamp within the slide.
    let nextLeft = left + gap;
    const maxLeft = root.scrollLeft + root.clientWidth - w - margin;
    if (nextLeft > maxLeft) nextLeft = maxLeft;
    if (nextLeft < root.scrollLeft + margin) nextLeft = root.scrollLeft + margin;

    setDeleteBtnPos({ top: nextTop, left: nextLeft });
  }, [blockSelection]);

  const annotationCSSVars: React.CSSProperties = {};
  if (annotationStyle?.backgroundColor) {
    (annotationCSSVars as Record<string, string>)['--industry-md-annotation-bg'] =
      annotationStyle.backgroundColor;
  }
  if (annotationStyle?.activeBackgroundColor) {
    (annotationCSSVars as Record<string, string>)['--industry-md-annotation-active-bg'] =
      annotationStyle.activeBackgroundColor;
  }

  return (
    <div
      className="markdown-slide"
      ref={slideRef}
      style={{
        height: '100%',
        overflowY: disableScroll ? 'visible' : 'auto',
        overflowX: disableScroll ? 'visible' : 'hidden',
        position: 'relative',
        backgroundColor: transparentBackground ? 'transparent' : theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        padding: finalPadding,
        outline: 'none',
        // Add subtle focus indicator
        border: '2px solid transparent',
        transition: 'border-color 0.2s ease',
        // Include padding and border in the element's total height
        boxSizing: 'border-box',
        ...annotationCSSVars,
      }}
      tabIndex={0}
      onKeyDown={handleSlideKeyDown}
      onClick={() => {
        if (slideRef.current) {
          slideRef.current.focus();
        }
      }}
    >
      {renderedChunks}

      {/* Annotation indicators — portaled into the marker hosts the hook injected. */}
      {renderAnnotation &&
        annotationMounts
          .filter(mount => mount.resolved)
          .map(mount =>
            createPortal(
              <React.Fragment key={mount.annotation.id}>
                {renderAnnotation(mount.annotation)}
              </React.Fragment>,
              mount.host,
            ),
          )}

      {/* Floating delete button for a resolved block selection. */}
      {blockDeletionEnabled && blockSelection && (
        <button
          ref={deleteBtnRef}
          type="button"
          aria-label="Delete selected block"
          title="Delete selected block"
          // Keep the text selection alive when the button is pressed so the
          // resolved targets aren't cleared out from under the click.
          onMouseDown={e => e.preventDefault()}
          onClick={e => {
            e.stopPropagation();
            handleDeleteSelection();
          }}
          style={{
            position: 'absolute',
            top: deleteBtnPos?.top ?? blockSelection.anchor.top,
            left: deleteBtnPos?.left ?? blockSelection.anchor.left,
            // Hidden until measured/clamped to avoid a one-frame flash at the
            // raw (potentially cut-off) anchor position.
            visibility: deleteBtnPos ? 'visible' : 'hidden',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: theme.space[1],
            padding: `${theme.space[1]}px ${theme.space[2]}px`,
            backgroundColor: theme.colors.error || '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: theme.radii[1],
            fontSize: theme.fontSizes[0],
            fontFamily: theme.fonts.body,
            cursor: 'pointer',
            boxShadow: theme.shadows?.[2] ?? '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      )}

      {/* HTML Modal */}
      <IndustryHtmlModal
        isOpen={htmlModalOpen}
        onClose={closeHtmlModal}
        htmlContent={htmlModalContent}
        theme={theme}
      />

      {/* Mermaid Modal */}
      <IndustryMermaidModal
        isOpen={mermaidModalOpen}
        onClose={closeMermaidModal}
        mermaidCode={mermaidModalCode}
        theme={theme}
      />

      {/* Placeholder Modal - only render if handlePromptCopy is provided */}
      {handlePromptCopy && placeholderModalData && (
        <IndustryPlaceholderModal
          isOpen={placeholderModalOpen}
          onClose={closePlaceholderModal}
          placeholders={placeholderModalData.placeholders}
          promptContent={placeholderModalData.promptContent}
          onCopy={handlePromptCopy}
          theme={theme}
        />
      )}
    </div>
  );
});
