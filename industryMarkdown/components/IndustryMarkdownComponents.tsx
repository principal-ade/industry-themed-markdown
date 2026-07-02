import { Theme } from '@principal-ade/industry-theme';
import {
  BashCommandOptions,
  BashCommandResult,
  RepositoryInfo,
  parseBashCommands,
} from '@principal-ade/markdown-utils';
import { Copy, Monitor, FileText, Check, Info } from 'lucide-react';
import React, { useMemo, useState, useRef, useContext } from 'react';

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
import {
  extractTextFromChildren,
  isExternalLink,
  LinkWithLoadingIndicator,
} from '../utils/componentUtils';
import { transformImageUrl } from '../utils/imageUrlUtils';

import { IndustryBashCommandDropdown } from './IndustryBashCommandDropdown';

interface IndustryMarkdownComponentsProps {
  theme: Theme; // Required industryTheme object
  slideIdPrefix: string;
  slideIndex: number;
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  // Fired by the info icon revealed on hover of an internal-link pill. Distinct
  // from `onLinkClick` (navigate) — this opens information/preview about the link.
  onLinkInfoClick?: (href: string, event?: MouseEvent) => void;
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
  // Host-facing image resolver. Called with the raw markdown image `src` before
  // the built-in repository-relative resolution. When it returns a truthy value,
  // that value is used as-is (host owns scheme detection, e.g. `asset://<hash>`
  // → data-URL); otherwise resolution falls back to `transformImageUrl`.
  transformImageUri?: (src: string) => string;
  editable?: boolean; // When true, checkboxes are interactive. Default: false
  // When true, top-level block elements are tagged with their chunk index and
  // source line range so a highlight can be resolved back to deletable blocks.
  selectableBlocks?: boolean;
  // When provided, regular list items render a clickable marker (the bullet /
  // number) that deletes that item. Receives the item's chunk index and
  // 1-based source line range within that chunk.
  onDeleteListItem?: (chunkIndex: number, startLine: number, endLine: number) => void;
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

  // An explicit image extension wins over the alt-text heuristic below — e.g. a
  // GIF whose alt text says "demo" is still an image, not a video.
  const imageExtensions = [
    '.gif',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.avif',
    '.bmp',
    '.ico',
  ];
  if (imageExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return false;
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

// Normalize an HTML width/height value into a CSS length. The HTML width/height
// *attributes* only accept unitless pixel integers, so `height="14px"` (with a
// unit) is invalid and silently ignored by the browser — the image then renders
// at its intrinsic size. Feeding the value through CSS (which does accept units)
// honors the author's intent for `14`, `"14"`, `"14px"`, `"50%"`, `"auto"`, etc.
const toCssLength = (value: string | number | undefined): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  const trimmed = value.trim();
  // A bare number (optionally decimal) is pixels; anything with a unit/keyword
  // is already a valid CSS length and passes through untouched.
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

// Signals to media descendants that they sit in a horizontal image row (e.g. a
// badge strip) and should render inline rather than as their own centered
// block. Set by the `p`/`div` components when they detect such a row.
const InlineMediaContext = React.createContext(false);

// A block whose meaningful children are all images (2+) is a media row — a
// badge strip or a line of screenshots — not a standalone figure. Count image
// descendants so those images can flow inline instead of each dropping onto its
// own centered line. Walks through wrapper elements (e.g. the `<a>` around each
// badge) but treats `<img>`/`<picture>` as leaves.
const MEDIA_ROW_MIN_IMAGES = 2;
const countImageDescendants = (node: unknown): number => {
  if (!node || typeof node !== 'object') return 0;
  const children = (node as { children?: unknown[] }).children;
  if (!Array.isArray(children)) return 0;
  let count = 0;
  for (const child of children) {
    if (!child || typeof child !== 'object') continue;
    const el = child as { type?: string; tagName?: string };
    if (el.type !== 'element') continue;
    if (el.tagName === 'img' || el.tagName === 'picture') {
      count += 1;
    } else {
      count += countImageDescendants(child);
    }
  }
  return count;
};

// Optimized media component (handles both images and videos)
const OptimizedMarkdownMedia = React.memo(
  ({
    src,
    alt,
    repositoryInfo,
    transformImageUri,
    theme,
    ...props
  }: {
    src: string;
    alt: string;
    repositoryInfo?: RepositoryInfo;
    transformImageUri?: (src: string) => string;
    theme: Theme;
    width?: string | number;
    height?: string | number;
  }) => {
    const transformedSrc = useMemo(() => {
      // Host resolver wins when it returns a value (e.g. `asset://<hash>` →
      // data-URL); otherwise fall back to repository-relative resolution.
      const resolved = transformImageUri?.(src);
      if (resolved) return resolved;
      return transformImageUrl(src, repositoryInfo);
    }, [src, repositoryInfo, transformImageUri]);

    const [hasErrored, setHasErrored] = useState(() => failedImageCache.has(transformedSrc));
    const retryCount = useRef(0);

    // An image with explicit dimensions is an inline HTML icon (e.g.
    // `## <img ... width="28" height="28"> Heading`), not a standalone figure —
    // render it inline so it sits alongside the surrounding text rather than
    // dropping onto its own centered row.
    const hasExplicitSize = props.width !== undefined || props.height !== undefined;
    const explicitWidth = toCssLength(props.width);
    const explicitHeight = toCssLength(props.height);

    // Inside a detected image row (e.g. a badge strip) images flow inline so the
    // row stays on one line and wraps, rather than each image claiming its own
    // centered block. An image with explicit dimensions is likewise an inline
    // icon. Everything else is a standalone figure: centered block + shadow.
    const inlineMedia = useContext(InlineMediaContext);
    const renderInline = hasExplicitSize || inlineMedia;

    const mediaStyle = useMemo(
      () =>
        renderInline
          ? {
              maxWidth: '100%',
              display: 'inline-block',
              verticalAlign: 'middle',
              borderRadius: theme.radii[1],
              // Apply the requested size via CSS so units (e.g. `14px`) are
              // honored — the HTML width/height attributes reject them.
              ...(explicitWidth ? { width: explicitWidth } : {}),
              ...(explicitHeight ? { height: explicitHeight } : {}),
            }
          : {
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: `${theme.space[3]}px auto`,
              borderRadius: theme.radii[1],
              boxShadow: theme.shadows[2],
            },
      [theme, renderInline, explicitWidth, explicitHeight],
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
  onLinkInfoClick,
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
  transformImageUri,
  editable = false,
  selectableBlocks = false,
  onDeleteListItem,
}: IndustryMarkdownComponentsProps) => {
  // Build the data attributes that tag a rendered block with its source
  // coordinates (chunk index + 1-based line range within that chunk). Returns
  // nothing when block selection is disabled or the node carries no position.
  const blockMeta = (
    node: unknown,
  ): Record<string, string | number> => {
    if (!selectableBlocks) return {};
    const position = (
      node as { position?: { start?: { line?: number }; end?: { line?: number } } }
    )?.position;
    const startLine = position?.start?.line;
    const endLine = position?.end?.line;
    if (typeof startLine !== 'number' || typeof endLine !== 'number') return {};
    return {
      'data-md-chunk': index,
      'data-md-start': startLine,
      'data-md-end': endLine,
    };
  };
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
  if (index === 0) {
    // First element should never have top margin unless explicitly overridden
    headerStyles.marginTop = slideHeaderMarginTopOverride ? `${slideHeaderMarginTopOverride}px` : 0;
  }

  return {
    // Headings using industryTheme
    h1: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h1>
    ),
    h2: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h2>
    ),
    h3: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h3>
    ),
    h4: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h4>
    ),
    h5: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h5>
    ),
    h6: ({ children, node, ...props }: HeadingProps) => (
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
        {...blockMeta(node)}
      >
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children, node, ...props }: MarkdownComponentProps) => {
      // A paragraph whose content is a strip of images (e.g. `<p align="center">`
      // full of shields.io badges) should lay them out in a wrapping horizontal
      // row instead of letting each image drop onto its own centered line.
      if (countImageDescendants(node) >= MEDIA_ROW_MIN_IMAGES) {
        const align = (props as { align?: string }).align;
        const justifyContent =
          align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        return (
          <p
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent,
              gap: theme.space[2],
              marginBottom: theme.space[3],
              fontFamily: theme.fonts.body,
            }}
            {...props}
            {...blockMeta(node)}
          >
            <InlineMediaContext.Provider value={true}>{children}</InlineMediaContext.Provider>
          </p>
        );
      }
      return (
        <p
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSizes[2],
            lineHeight: theme.lineHeights.body,
            marginBottom: theme.space[3],
            fontFamily: theme.fonts.body,
          }}
          {...props}
          {...blockMeta(node)}
        >
          {children}
        </p>
      );
    },

    // Lists
    ul: ({ children, node, ...props }: MarkdownComponentProps) => (
      <ul
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.body,
          marginBottom: theme.space[3],
          paddingLeft: theme.space[3],
          listStyleType: 'disc',
          fontFamily: theme.fonts.body,
        }}
        {...props}
        {...blockMeta(node)}
      >
        {children}
      </ul>
    ),
    ol: ({ children, node, ...props }: MarkdownComponentProps) => (
      <ol
        style={{
          color: theme.colors.text,
          fontSize: theme.fontSizes[2],
          lineHeight: theme.lineHeights.body,
          marginBottom: theme.space[3],
          paddingLeft: theme.space[3],
          listStyleType: 'decimal',
          fontFamily: theme.fonts.body,
        }}
        {...props}
        {...blockMeta(node)}
      >
        {children}
      </ol>
    ),
    li: ({ children, node, ...props }: ListItemProps) => {
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
          (node as { position?: { start?: { line?: number } } })?.position?.start?.line ||
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
              marginLeft: `-${theme.space[3]}px`,
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

      // Regular list item with a clickable marker for deletion.
      const position = (
        node as { position?: { start?: { line?: number }; end?: { line?: number } } }
      )?.position;
      const itemStart = position?.start?.line;
      const itemEnd = position?.end?.line;
      const deletable =
        selectableBlocks &&
        !!onDeleteListItem &&
        typeof itemStart === 'number' &&
        typeof itemEnd === 'number';

      if (deletable) {
        return (
          <li
            className="md-del-li"
            style={{
              marginBottom: theme.space[2],
              paddingTop: theme.space[1],
              color: theme.colors.text,
              lineHeight: theme.lineHeights.relaxed,
              display: 'flex',
              alignItems: 'flex-start',
            }}
            {...props}
            {...blockMeta(node)}
          >
            <button
              type="button"
              className="md-del-marker"
              aria-label="Delete list item"
              title="Delete this item"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteListItem(index, itemStart as number, itemEnd as number);
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
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
          {...blockMeta(node)}
        >
          {children}
        </li>
      );
    },

    // Block quotes
    blockquote: ({ children, node, ...props }: MarkdownComponentProps) => (
      <blockquote
        style={{
          margin: `0 0 ${theme.space[3]}px 0`,
          padding: `${theme.space[2]}px ${theme.space[4]}px`,
          borderLeft: `4px solid ${theme.colors.border}`,
          color: theme.colors.textSecondary,
          fontStyle: 'italic',
          fontFamily: theme.fonts.body,
        }}
        {...props}
        {...blockMeta(node)}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rules
    hr: ({ node, ...props }: MarkdownComponentProps) => (
      <hr
        style={{
          border: 'none',
          borderTop: `1px solid ${theme.colors.border}`,
          margin: `${theme.space[4]}px 0`,
        }}
        {...props}
        {...blockMeta(node)}
      />
    ),

    // Tables
    table: ({ children, node, ...props }: MarkdownComponentProps) => (
      <div
        style={{
          overflowX: 'auto',
          marginBottom: theme.space[4],
          borderRadius: theme.radii[2],
          border: `1px solid ${theme.colors.border}`,
        }}
        {...blockMeta(node)}
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

    // Links. External links (web URLs, mailto) keep the underlined look;
    // internal links — repo-relative paths and resolver schemes routed through
    // the host — get the pill treatment (themed background + padding + radius,
    // no underline) so "goes somewhere in our world" reads differently from
    // "leaves to the browser".
    a: ({ children, href, ...props }: LinkProps) => {
      const external = isExternalLink(href || '');

      // External links keep the plain underlined look — no pill, no hover nub.
      if (external) {
        return (
          <LinkWithLoadingIndicator
            href={href || ''}
            onClick={onLinkClick ? (h, e) => onLinkClick(h, e as unknown as MouseEvent) : undefined}
            className={props.className}
            style={{ color: theme.colors.primary, textDecoration: 'underline' }}
          >
            {children}
          </LinkWithLoadingIndicator>
        );
      }

      // Internal pills get a JS-driven hover reaction (local state, applied as
      // inline styles). Doing it inline rather than via a `:hover` rule sidesteps
      // the write-once singleton `<style>` block, which never updates once
      // injected. Hovering reveals an info nub on the right (a sibling button,
      // not nested in the <a>) that fires onLinkInfoClick — the hook for opening
      // link information / a preview.
      const [hovered, setHovered] = useState(false);
      const [pressed, setPressed] = useState(false);
      const r = theme.radii[2];
      const internalPillStyle: React.CSSProperties = {
        color: theme.colors.accent,
        // Tactile press on the link text. Inline <a> can't be transform-scaled
        // (transforms don't apply to inline elements), so the press is a 1px
        // downward nudge (position/top works inline, no reflow) plus a quick
        // background darken.
        position: 'relative',
        top: pressed ? '1px' : '0',
        backgroundColor: pressed
          ? `color-mix(in srgb, ${theme.colors.muted} 88%, #000)`
          : theme.colors.muted,
        padding: '0.1em 0.35em',
        // When the nub is showing, square off the right corners so the pill and
        // nub meet flush at a seam; keep all corners rounded at rest.
        borderRadius: hovered ? `${r}px 0 0 ${r}px` : r,
        textDecoration: 'none',
        transition: 'top 0.08s ease, background-color 0.08s ease',
      };
      return (
        <span
          // Plain inline + position:relative as the nub's positioning context.
          // NOT inline-flex: that would make the <a> a flex item, which honors
          // its vertical padding as real box height and makes the pill taller.
          style={{ position: 'relative' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
        >
          <LinkWithLoadingIndicator
            href={href || ''}
            onClick={onLinkClick ? (h, e) => onLinkClick(h, e as unknown as MouseEvent) : undefined}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            className={props.className}
            style={internalPillStyle}
          >
            {children}
          </LinkWithLoadingIndicator>
          {hovered && onLinkInfoClick && (
            <button
              type="button"
              aria-label="Link information"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onLinkInfoClick(href || '', e as unknown as MouseEvent);
              }}
              style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '1.4em',
                width: '1.45em',
                padding: 0,
                border: 'none',
                // Thin divider so pill and nub read as two connected segments
                // meeting at a seam; square left corners, rounded right.
                borderLeft: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                color: theme.colors.accent,
                backgroundColor: theme.colors.muted,
                borderRadius: `0 ${r}px ${r}px 0`,
                zIndex: 1,
              }}
            >
              <Info size={13} />
            </button>
          )}
        </span>
      );
    },

    // Images and Videos (detected by file extension)
    img: ({ src, alt, ...props }: ImageProps) => (
      <OptimizedMarkdownMedia
        src={src || ''}
        alt={alt || ''}
        repositoryInfo={repositoryInfo}
        transformImageUri={transformImageUri}
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
        if (!srcsetValue || (!repositoryInfo && !transformImageUri)) return srcsetValue;

        return srcsetValue
          .split(',')
          .map((src: string) => {
            const trimmed = src.trim();
            const parts = trimmed.split(/\s+/);
            const url = parts[0];
            const descriptors = parts.slice(1).join(' ');

            const transformedUrl =
              transformImageUri?.(url) || transformImageUrl(url, repositoryInfo);
            return descriptors ? `${transformedUrl} ${descriptors}` : transformedUrl;
          })
          .join(', ');
      }, [srcsetValue, repositoryInfo, transformImageUri]);

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

      // Prefer the explicit inline/block flag stamped on the AST by the
      // rehypeCodeKind plugin — a <code> inside <pre> is a block, everything
      // else is inline. Authoritative, so it wins over the heuristics below.
      const explicitInline = (node as { properties?: { dataInline?: unknown } })?.properties
        ?.dataInline;

      // Check if this is a multi-line code block (with newlines)
      const hasNewlines = codeString.includes('\n');

      if (typeof explicitInline === 'boolean') {
        // Disambiguated upstream — no guessing needed.
        isInline = explicitInline;
        isCodeBlock = !explicitInline;
      } else if (!className && !hasNewlines) {
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
          <div style={containerStyle} {...blockMeta(node)}>
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
              // Ensure text color overrides any highlight.js styles. Inline
              // code is intentionally backgroundless — accent color + monospace
              // is enough to set it apart, and a filled background is reserved
              // for genuinely actionable elements. The --inline-code-* pill vars
              // are left unset so the highlightOverrides rules fall back to
              // their transparent/zero defaults.
              '--text-color': theme.colors.accent,
            } as React.CSSProperties
          }
          className={cleanClassName ? `inline-code ${cleanClassName}` : 'inline-code'}
          onDoubleClick={e => {
            // Treat the backtick-delimited span as one word boundary: the
            // native double-click picks a single word (splitting on dots,
            // slashes, etc.), so replace that selection with a range spanning
            // the whole <code>. Single-click and drag-select are untouched.
            const sel = window.getSelection();
            if (!sel) return;
            const range = document.createRange();
            range.selectNodeContents(e.currentTarget);
            sel.removeAllRanges();
            sel.addRange(range);
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
  };
};
