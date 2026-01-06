import { Theme } from '@principal-ade/industry-theme';
import {
  BashCommandOptions,
  BashCommandResult,
  RepositoryInfo,
  parseBashCommands,
} from '@principal-ade/markdown-utils';
import { Copy, Monitor, FileText, Check } from 'lucide-react';
import React, { useMemo, useState, useRef } from 'react';

import {
  MarkdownComponentProps,
  HeadingProps,
  ListItemProps,
  LinkProps,
  ImageProps,
  CodeProps,
  SourceProps,
  CheckboxElementProps,
} from '../types/markdownComponents';
import { extractTextFromChildren, LinkWithLoadingIndicator } from '../utils/componentUtils';
import { transformImageUrl } from '../utils/imageUrlUtils';

import { IndustryBashCommandDropdown } from './IndustryBashCommandDropdown';

interface IndustryMarkdownComponentsProps {
  theme: Theme; // Required industryTheme object
  slideIdPrefix: string;
  slideIndex: number;
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;
  checkedItems: Record<string, boolean>;
  setCheckedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  openHtmlModal: (content: string) => void;
  openPlaceholderModal?: (placeholders: string[], promptContent: string) => void;
  handleRunBashCommand?: (
    command: string,
    options?: BashCommandOptions,
  ) => Promise<BashCommandResult>;
  enableHtmlPopout: boolean;
  slideHeaderMarginTopOverride?: number;
  index: number;
  repositoryInfo?: RepositoryInfo;
  editable?: boolean; // When true, checkboxes are interactive. Default: false
}

// Global cache to track failed images and prevent repeated requests
const failedImageCache = new Set<string>();

// Helper to detect video URLs
const isVideoUrl = (url: string, alt?: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'];
  const lowercaseUrl = url.toLowerCase();

  // Check for file extensions in URL
  if (videoExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return true;
  }

  // Check alt text for hints that this is a video
  if (alt) {
    const altLower = alt.toLowerCase();
    if (altLower.includes('video') || altLower.includes('demo') || altLower.includes('recording')) {
      return true;
    }
  }

  // For GitHub attachments without extensions, we can't reliably detect video vs image
  // So we'll treat them as images by default unless alt text suggests otherwise
  return false;
};

// Optimized media component (handles both images and videos)
const OptimizedMarkdownMedia = React.memo(
  ({
    src,
    alt,
    repositoryInfo,
    theme,
    ...props
  }: {
    src: string;
    alt: string;
    repositoryInfo?: RepositoryInfo;
    theme: Theme;
  }) => {
    const transformedSrc = useMemo(() => {
      return transformImageUrl(src, repositoryInfo);
    }, [src, repositoryInfo]);

    const [hasErrored, setHasErrored] = useState(() => failedImageCache.has(transformedSrc));
    const retryCount = useRef(0);

    const mediaStyle = useMemo(
      () => ({
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        margin: `${theme.space[3]}px auto`,
        borderRadius: theme.radii[1],
        boxShadow: theme.shadows[2],
      }),
      [theme],
    );

    const handleLoad = () => {
      failedImageCache.delete(transformedSrc);
      setHasErrored(false);
      retryCount.current = 0;
    };

    const handleError = (e: React.SyntheticEvent<HTMLElement, Event>) => {
      retryCount.current += 1;
      failedImageCache.add(transformedSrc);
      setHasErrored(true);
      e.stopPropagation();
    };

    // Check if this is a video URL (using both URL and alt text for detection)
    if (isVideoUrl(transformedSrc, alt)) {
      if (hasErrored) {
        return (
          <span
            style={{
              ...mediaStyle,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.space[4],
              minHeight: '200px',
            }}
          >
            ⚠️ Video failed to load: {alt || transformedSrc}
          </span>
        );
      }

      return (
        <video
          controls
          style={mediaStyle}
          onLoadedData={handleLoad}
          onError={handleError}
          title={alt}
          {...props}
        >
          <source src={transformedSrc} />
          {/* Add fallback source types for better compatibility */}
          <source src={transformedSrc} type="video/mp4" />
          <source src={transformedSrc} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Original image handling code
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      retryCount.current += 1;
      failedImageCache.add(transformedSrc);
      setHasErrored(true);
      e.stopPropagation();
    };

    if (hasErrored) {
      return (
        <span
          style={{
            ...mediaStyle,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.textSecondary,
            border: `1px solid ${theme.colors.border}`,
            minHeight: '50px',
            minWidth: '100px',
            fontSize: theme.fontSizes[0],
            textAlign: 'center',
            padding: `${theme.space[2]}px`,
          }}
          title={`Failed to load image: ${transformedSrc}`}
        >
          🖼️ Image unavailable{' '}
          {alt && <span style={{ fontSize: theme.fontSizes[0], opacity: 0.7 }}>({alt})</span>}
        </span>
      );
    }

    return (
      <img
        src={transformedSrc}
        alt={alt}
        style={mediaStyle}
        onLoad={handleLoad}
        onError={handleImageError}
        {...props}
      />
    );
  },
);

/**
 * Creates markdown components using industryTheme.
 * This directly uses Theme UI spec values from the industryTheme.
 */
export const createIndustryMarkdownComponents = ({
  theme,
  slideIdPrefix,
  slideIndex,
  onLinkClick,
  onCheckboxChange,
  checkedItems,
  setCheckedItems,
  openHtmlModal,
  openPlaceholderModal,
  handleRunBashCommand,
  enableHtmlPopout,
  slideHeaderMarginTopOverride,
  index,
  repositoryInfo,
  editable = false,
}: IndustryMarkdownComponentsProps) => {
  // Determine if we're in dark mode by checking if background is dark
  // Convert hex to RGB and calculate luminance
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g);
    if (!rgb) return 1; // Default to light if parsing fails
    const [r, g, b] = rgb.map(x => parseInt(x, 16) / 255);
    // Use relative luminance formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const darkMode = getLuminance(theme.colors.background) < 0.5;

  // Header styles with override support
  const headerStyles = {} as React.CSSProperties;
  if (index === 0 && slideHeaderMarginTopOverride) {
    headerStyles.marginTop = `${slideHeaderMarginTopOverride}px`;
  }

  return {
    // Headings using industryTheme
    h1: ({ children, ...props }: HeadingProps) => (
      <h1
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[5],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.bold,
          marginTop: theme.space[4],
          marginBottom: theme.space[4],
          fontFamily: theme.fonts.heading,
          paddingBottom: theme.space[2],
          borderBottom: `1px solid ${theme.colors.border}`,
          ...headerStyles,
        }}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: HeadingProps) => (
      <h2
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[4],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.bold,
          marginTop: theme.space[4],
          marginBottom: theme.space[3],
          fontFamily: theme.fonts.heading,
          paddingBottom: theme.space[2],
          borderBottom: `1px solid ${theme.colors.border}`,
          ...headerStyles,
        }}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: HeadingProps) => (
      <h3
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[3],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.semibold,
          marginTop: theme.space[4],
          marginBottom: theme.space[3],
          fontFamily: theme.fonts.heading,
        }}
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: HeadingProps) => (
      <h4
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.semibold,
          marginTop: theme.space[3],
          marginBottom: theme.space[2],
          fontFamily: theme.fonts.heading,
        }}
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: HeadingProps) => (
      <h5
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[1],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.semibold,
          marginTop: theme.space[3],
          marginBottom: theme.space[1],
          fontFamily: theme.fonts.heading,
        }}
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: HeadingProps) => (
      <h6
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[1],
          lineHeight: theme.lineHeights.heading,
          fontWeight: theme.fontWeights.medium,
          marginTop: theme.space[3],
          marginBottom: theme.space[1],
          fontFamily: theme.fonts.heading,
        }}
        {...props}
      >
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children, ...props }: MarkdownComponentProps) => (
      <p
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.body,
          marginBottom: theme.space[3],
          fontFamily: theme.fonts.body,
        }}
        {...props}
      >
        {children}
      </p>
    ),

    // Lists
    ul: ({ children, ...props }: MarkdownComponentProps) => (
      <ul
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.body,
          marginBottom: theme.space[3],
          paddingLeft: theme.space[5],
          listStyleType: 'disc',
          fontFamily: theme.fonts.body,
        }}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: MarkdownComponentProps) => (
      <ol
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.body,
          marginBottom: theme.space[3],
          paddingLeft: theme.space[5],
          listStyleType: 'decimal',
          fontFamily: theme.fonts.body,
        }}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ListItemProps) => {
      // Check if this is a task list item
      const isTaskListItem =
        Array.isArray(children) &&
        children.length > 0 &&
        React.isValidElement(children[0]) &&
        (children[0] as React.ReactElement<CheckboxElementProps>)?.props?.type === 'checkbox';

      if (isTaskListItem) {
        const checkbox = children[0];
        const remainingChildren = children.slice(1);
        const labelContent: React.ReactNode[] = [];
        const nestedListElements: React.ReactNode[] = [];

        React.Children.forEach(remainingChildren, child => {
          if (React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')) {
            nestedListElements.push(child);
          } else {
            labelContent.push(child);
          }
        });

        const checked =
          (checkbox as React.ReactElement<CheckboxElementProps>)?.props?.checked || false;
        const lineNumber =
          props.sourcePosition?.start?.line ||
          (props.node as { position?: { start?: { line?: number } } })?.position?.start?.line ||
          1;

        const id = `${slideIdPrefix}-checkbox-${lineNumber}`;
        const isChecked = checkedItems[id] ?? checked;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          e.stopPropagation();
          const newChecked = e.target.checked;
          setCheckedItems(prev => ({
            ...prev,
            [id]: newChecked,
          }));
          onCheckboxChange?.(slideIndex, lineNumber, newChecked);
        };

        return (
          <li
            style={{
              listStyle: 'none',
              marginLeft: `-${theme.space[5]}px`,
              marginBottom: theme.space[3], // Increased spacing for task items
              paddingTop: theme.space[1], // Add padding for breathing room
              color: theme.colors.text,
              fontSize: theme.fontSizes[2],
            }}
            {...props}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                onClick={e => e.stopPropagation()}
                disabled={!editable}
                style={{
                  marginRight: theme.space[2],
                  marginTop: theme.space[1],
                  width: '16px',
                  height: '16px',
                  cursor: editable ? 'pointer' : 'default',
                }}
                id={id}
              />
              <label
                htmlFor={id}
                style={{
                  flex: 1,
                  cursor: editable ? 'pointer' : 'default',
                  color: isChecked ? theme.colors.textMuted : 'inherit',
                  lineHeight: theme.lineHeights.relaxed, // More relaxed line height for readability
                }}
              >
                {labelContent.length > 0 ? labelContent : null}
              </label>
            </div>
            {nestedListElements.length > 0 ? nestedListElements : null}
          </li>
        );
      }

      // Regular list item
      return (
        <li
          style={{
            marginBottom: theme.space[2], // Increased from space[1] (4px) to space[2] (8px)
            paddingTop: theme.space[1], // Add small top padding for breathing room
            color: theme.colors.text,
            lineHeight: theme.lineHeights.relaxed, // Use relaxed line height (1.75) for better readability
          }}
          {...props}
        >
          {children}
        </li>
      );
    },

    // Tables
    table: ({ children, ...props }: MarkdownComponentProps) => (
      <div
        style={{
          overflowX: 'auto',
          marginBottom: theme.space[4],
          borderRadius: theme.radii[2],
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: theme.fontSizes[1],
            fontFamily: theme.fonts.body,
          }}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: MarkdownComponentProps) => (
      <thead
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
        }}
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }: MarkdownComponentProps) => (
      <th
        style={{
          padding: theme.space[3],
          textAlign: 'left',
          fontWeight: theme.fontWeights.semibold,
          borderBottom: `2px solid ${theme.colors.border}`,
          color: theme.colors.text,
        }}
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: MarkdownComponentProps) => (
      <td
        style={{
          padding: theme.space[3],
          borderBottom: `1px solid ${theme.colors.border}`,
          color: theme.colors.text,
        }}
        {...props}
      >
        {children}
      </td>
    ),

    // Links
    a: ({ children, href, ...props }: LinkProps) => (
      <LinkWithLoadingIndicator
        href={href || ''}
        onClick={onLinkClick ? (h, e) => onLinkClick(h, e as unknown as MouseEvent) : undefined}
        className={props.className}
      >
        {children}
      </LinkWithLoadingIndicator>
    ),

    // Images and Videos (detected by file extension)
    img: ({ src, alt, ...props }: ImageProps) => (
      <OptimizedMarkdownMedia
        src={src || ''}
        alt={alt || ''}
        repositoryInfo={repositoryInfo}
        theme={theme}
        {...props}
      />
    ),

    // Picture elements
    picture: ({ children, ...props }: MarkdownComponentProps) => (
      <picture {...props}>{children}</picture>
    ),

    // Video elements
    video: ({ children, ...props }: MarkdownComponentProps) => (
      <video
        controls
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          margin: `${theme.space[3]}px auto`,
          borderRadius: theme.radii[1],
          boxShadow: theme.shadows[2],
        }}
        {...props}
      >
        {children}
      </video>
    ),

    // Source elements
    source: ({ srcset, srcSet, ...props }: SourceProps) => {
      // Handle both srcset and srcSet props (React might pass either)
      const srcsetValue = srcset || srcSet;

      const transformedSrcset = useMemo(() => {
        if (!srcsetValue || !repositoryInfo) return srcsetValue;

        return srcsetValue
          .split(',')
          .map((src: string) => {
            const trimmed = src.trim();
            const parts = trimmed.split(/\s+/);
            const url = parts[0];
            const descriptors = parts.slice(1).join(' ');

            const transformedUrl = transformImageUrl(url, repositoryInfo);
            return descriptors ? `${transformedUrl} ${descriptors}` : transformedUrl;
          })
          .join(', ');
      }, [srcsetValue, repositoryInfo]);

      return <source srcSet={transformedSrcset} {...props} />;
    },

    // Code blocks and inline code
    code: ({ node, className, children, ...props }: CodeProps) => {
      const hasLanguageClass =
        className && (className.includes('language-') || className.includes('hljs'));
      const codeString = extractTextFromChildren(children);
      const matchLang = /language-(\w+)/.exec(className || '');
      const language = matchLang ? matchLang[1] : null;
      const [copied, setCopied] = useState(false);

      let isInline: boolean;
      let isCodeBlock: boolean;

      // Check if this is a multi-line code block (with newlines)
      const hasNewlines = codeString.includes('\n');

      if (!className && !hasNewlines) {
        // No class and no newlines = inline code
        isInline = true;
        isCodeBlock = false;
      } else if (hasNewlines) {
        // Has newlines = definitely a code block
        isInline = false;
        isCodeBlock = true;
      } else if (language === 'text') {
        isInline = true;
        isCodeBlock = false;
      } else {
        isCodeBlock = hasLanguageClass || codeString.length > 50;
        const nodeWithParent = node as {
          parent?: { tagName?: string; parent?: { tagName?: string } };
        };
        const isInsideParagraph =
          nodeWithParent?.parent?.tagName === 'p' ||
          nodeWithParent?.parent?.parent?.tagName === 'p';
        isInline = !isCodeBlock || isInsideParagraph;
      }

      if (!isInline) {
        const language = matchLang ? matchLang[1] : 'text';
        const isExecutable =
          (language === 'bash' || language === 'sh' || language === 'shell') &&
          handleRunBashCommand;
        const isHtml = (language === 'html' || language === 'htm') && enableHtmlPopout;
        const isPrompt = language === 'prompt';

        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const placeholders = isPrompt
          ? [...codeString.matchAll(placeholderRegex)].map(match => match[1].trim())
          : [];
        const hasPlaceholders = placeholders.length > 0;
        const bashCommands = isExecutable ? parseBashCommands(codeString) : [];

        const containerStyle = isPrompt
          ? {
              position: 'relative' as const,
              backgroundColor: darkMode ? theme.colors.backgroundTertiary : theme.colors.highlight,
              border: `2px solid ${theme.colors.accent}`,
              borderRadius: theme.radii[2],
              overflow: 'visible',
              boxShadow: theme.shadows[2],
              marginTop: `${theme.space[2]}px`,
              marginBottom: `${theme.space[3]}px`,
            }
          : {
              position: 'relative' as const,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.radii[2],
              overflow: 'hidden',
              border: `1px solid ${theme.colors.border}`,
              marginTop: `${theme.space[2]}px`,
              marginBottom: `${theme.space[3]}px`,
            };

        const headerStyle = isPrompt
          ? {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `${theme.space[3]}px ${theme.space[4]}px`,
              backgroundColor: theme.colors.muted,
              borderBottom: `2px solid ${theme.colors.accent}`,
              fontSize: theme.fontSizes[0],
              color: theme.colors.accent,
            }
          : {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `${theme.space[2]}px ${theme.space[3]}px`,
              backgroundColor: theme.colors.backgroundTertiary,
              borderBottom: `1px solid ${theme.colors.border}`,
              fontSize: theme.fontSizes[0],
            };

        return (
          <div style={containerStyle}>
            <div style={headerStyle}>
              <span
                style={{
                  fontFamily: theme.fonts.monospace,
                  fontWeight: isPrompt ? theme.fontWeights.bold : theme.fontWeights.body,
                }}
              >
                {isPrompt ? '💡 Prompt' : language}
              </span>
              <div style={{ display: 'flex', gap: `${theme.space[2]}px` }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    navigator.clipboard
                      .writeText(codeString)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      })
                      .catch(err => {
                        console.error('Failed to copy:', err);
                      });
                  }}
                  style={{
                    padding: `${theme.space[1]}px ${theme.space[2]}px`,
                    backgroundColor: copied
                      ? theme.colors.success + '22'
                      : darkMode
                        ? theme.colors.backgroundTertiary
                        : theme.colors.backgroundSecondary,
                    color: copied ? theme.colors.success : theme.colors.textSecondary,
                    border: `1px solid ${copied ? theme.colors.success : theme.colors.border}`,
                    borderRadius: theme.radii[1],
                    fontSize: theme.fontSizes[0],
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: `${theme.space[1]}px`,
                    transition: 'all 0.15s ease-in-out',
                  }}
                  title={copied ? 'Copied!' : 'Copy code to clipboard'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                {isExecutable && (
                  <IndustryBashCommandDropdown
                    commands={bashCommands}
                    allCommands={codeString.trim()}
                    onRunCommand={async (command: string) => {
                      try {
                        await handleRunBashCommand(command, {
                          id: `${slideIdPrefix}-code-${Date.now()}`,
                          showInTerminal: true,
                        });
                      } catch (error) {
                        console.error('Error running bash command:', error);
                      }
                    }}
                    slideIdPrefix={slideIdPrefix}
                    theme={theme}
                  />
                )}

                {isHtml && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openHtmlModal(codeString);
                    }}
                    style={{
                      padding: `${theme.space[1]}px ${theme.space[2]}px`,
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: theme.radii[1],
                      fontSize: theme.fontSizes[0],
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${theme.space[1]}px`,
                    }}
                    title="Render HTML in modal"
                  >
                    <Monitor size={14} />
                    Render HTML
                  </button>
                )}

                {isPrompt && openPlaceholderModal && hasPlaceholders && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openPlaceholderModal(placeholders, codeString);
                    }}
                    style={{
                      padding: `${theme.space[1]}px ${theme.space[2]}px`,
                      backgroundColor: theme.colors.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: theme.radii[1],
                      fontSize: theme.fontSizes[0],
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${theme.space[1]}px`,
                    }}
                    title="Fill placeholders and copy"
                  >
                    <FileText size={14} />
                    Fill & Copy ({placeholders.length})
                  </button>
                )}
              </div>
            </div>

            {isPrompt ? (
              <div
                style={{
                  margin: 0,
                  padding: theme.space[1],
                  backgroundColor: 'transparent',
                  fontSize: theme.fontSizes[1],
                  lineHeight: theme.lineHeights.body,
                  fontFamily: theme.fonts.body,
                  overflow: 'auto',
                  color: theme.colors.text,
                }}
              >
                {codeString.split(/(\{\{[^}]+\}\})/).map((part, index) => {
                  if (part.match(/^\{\{[^}]+\}\}$/)) {
                    return (
                      <span
                        key={index}
                        style={{
                          backgroundColor: theme.colors.highlight,
                          color: theme.colors.primary,
                          padding: `${theme.space[0]}px ${theme.space[1]}px`,
                          borderRadius: theme.radii[1],
                          fontWeight: theme.fontWeights.semibold,
                          fontFamily: theme.fonts.monospace,
                          fontSize: theme.fontSizes[1],
                        }}
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </div>
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: theme.space[1],
                  backgroundColor: 'transparent',
                  overflow: 'auto',
                  fontSize: theme.fontSizes[1],
                  lineHeight: 1.2,
                  fontFamily: theme.fonts.monospace,
                }}
              >
                <code
                  className={className}
                  style={{
                    lineHeight: 'inherit',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    display: 'block',
                  }}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            )}
          </div>
        );
      }

      // Inline code - strip any highlight.js classes to prevent background styling
      const cleanClassName = className
        ?.replace(/hljs(-\w+)?/g, '') // Remove all hljs classes (hljs, hljs-keyword, etc.)
        ?.replace(/language-\w+/g, '') // Remove language classes for inline code
        ?.replace(/\s+/g, ' ') // Clean up multiple spaces
        ?.trim();

      return (
        <code
          style={
            {
              color: theme.colors.accent,
              fontSize: '0.875em',
              fontFamily: theme.fonts.monospace,
              backgroundColor: 'transparent',
              padding: 0,
              // Ensure text color and background overrides any highlight.js styles
              '--text-color': theme.colors.accent,
            } as React.CSSProperties
          }
          className={cleanClassName ? `inline-code ${cleanClassName}` : 'inline-code'}
          {...props}
        >
          {children}
        </code>
      );
    },
  };
};
