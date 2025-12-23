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
import React, { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { KeyboardBinding } from '../types/keyboard';
import { highlightSearchMatches } from '../utils/highlightSearchMatches';
import { parseMarkdownChunks } from '../utils/markdownUtils';

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
  disableScroll?: boolean; // If true, removes overflow styling (useful when parent handles scrolling)

  // === Dynamic Padding Configuration ===
  minScreenWidth?: number; // Min screen width for padding calculation (default: 320)
  maxScreenWidth?: number; // Max screen width for padding calculation (default: 1920)

  // === Keyboard Scrolling Configuration ===
  enableKeyboardScrolling?: boolean; // Enable/disable keyboard scrolling (default: true)
  keyboardScrollConfig?: KeyboardScrollConfig;

  // === External Data ===
  repositoryInfo?: RepositoryInfo; // Repository information for resolving relative image URLs
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
  
  /* Remove top margin from headings when they're the first element */
  .markdown-slide > :first-child h1:first-child,
  .markdown-slide > :first-child h2:first-child,
  .markdown-slide > :first-child h3:first-child,
  .markdown-slide > :first-child h4:first-child,
  .markdown-slide > :first-child h5:first-child,
  .markdown-slide > :first-child h6:first-child {
    margin-top: 0 !important;
  }
  
  /* Also handle when heading is inside the first paragraph/div from ReactMarkdown */
  .markdown-slide > div:first-child > h1:first-child,
  .markdown-slide > div:first-child > h2:first-child,
  .markdown-slide > div:first-child > h3:first-child,
  .markdown-slide > div:first-child > h4:first-child,
  .markdown-slide > div:first-child > h5:first-child,
  .markdown-slide > div:first-child > h6:first-child,
  .markdown-slide > p:first-child > h1:first-child,
  .markdown-slide > p:first-child > h2:first-child,
  .markdown-slide > p:first-child > h3:first-child,
  .markdown-slide > p:first-child > h4:first-child,
  .markdown-slide > p:first-child > h5:first-child,
  .markdown-slide > p:first-child > h6:first-child {
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
  disableScroll = false,

  // === Dynamic Padding Configuration ===
  minScreenWidth: _minScreenWidth,
  maxScreenWidth: _maxScreenWidth,

  // === Keyboard Scrolling Configuration ===
  enableKeyboardScrolling = true,
  keyboardScrollConfig,

  // === External Data ===
  repositoryInfo,
}: IndustryMarkdownSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Map<number, number>>(new Map());

  // State for measured container width when containerWidth prop is not provided
  const [measuredContainerWidth, setMeasuredContainerWidth] = useState<number | null>(null);

  // Add error handling for content parsing
  let chunks: ReturnType<typeof parseMarkdownChunks> = [];
  try {
    // Ensure content is a valid string before parsing
    if (typeof content === 'string') {
      chunks = parseMarkdownChunks(content, slideIdPrefix);
    } else {
      // Use empty array as fallback
    }
  } catch (error) {
    console.error('Error parsing markdown chunks:', error);
    // Use empty array as fallback
  }

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
  useEffect(() => {
    if (autoFocusOnVisible && isVisible && slideRef.current) {
      console.log('🎯 Auto-focusing slide container');
      slideRef.current.focus();
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

    // Parse base padding values
    const baseHorizontalValue = parseInt(basePadding.replace('px', ''), 10);
    const baseVerticalValue = parseInt(baseVerticalPadding.replace('px', ''), 10);

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
  }, [calculateSlidePadding.horizontal, calculateSlidePadding.vertical, additionalPadding]);

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
    ],
  );

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
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (slideRef.current) {
          slideRef.current.focus();
        }
      }}
    >
      {chunks.length === 0 ? (
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
      ) : (
        chunks.map((chunk, index) => {
          if (chunk.type === 'markdown_chunk') {
            // Apply search highlighting if a search query is present
            const processedContent = searchQuery
              ? highlightSearchMatches(chunk.content, searchQuery)
              : chunk.content;

            return (
              <ReactMarkdown
                key={`${chunk.id}-${JSON.stringify(theme.colors.accent)}`}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeRaw,
                  [rehypeSanitize, sanitizeSchema],
                  rehypeSlug,
                  rehypeHighlight,
                ]}
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

            // Only add onShowInPanel if onShowMermaidInPanel is provided
            if (onShowMermaidInPanel) {
              mermaidProps.onShowInPanel = onShowMermaidInPanel;
            }

            return <IndustryLazyMermaidDiagram key={chunk.id} {...mermaidProps} />;
          }
          return null;
        })
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
