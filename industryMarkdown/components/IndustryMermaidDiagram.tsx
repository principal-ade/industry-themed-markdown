/**
 * IndustryMermaidDiagram Component
 *
 * A theme-aware Mermaid diagram renderer that uses the industry theme
 * This is a replacement for ConfigurableMermaidDiagram that doesn't depend on the old theme system
 */

import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { Expand, Copy, Check, ArrowUpRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import {
  buildBeautifulMermaidOptions,
  isBeautifulMermaidSupported,
  stripBeautifulFontImports,
} from '../utils/beautifulMermaid';

/**
 * Which rendering engine to use:
 * - 'auto' (default): beautiful-mermaid for supported diagram types
 *   (graph/flowchart, sequence, class, ER, state, xychart), mermaid.js for the rest.
 * - 'mermaid': always use mermaid.js.
 * - 'beautiful': always use beautiful-mermaid; errors surface instead of falling back.
 */
export type MermaidRenderer = 'auto' | 'mermaid' | 'beautiful';

interface IndustryMermaidDiagramProps {
  code: string;
  id: string;
  theme?: Theme;
  onCopyError?: (mermaidCode: string, errorMessage: string) => void;
  onError?: (hasError: boolean) => void;
  rootMargin?: string;
  isModalMode?: boolean;
  isFullSlide?: boolean;
  onExpandClick?: () => void;
  /**
   * When provided, renders an "open in tab" arrow button alongside the
   * fullscreen/expand button. Intended for consumers (e.g. the Alexandria
   * window) that want to open the diagram as its own tab rather than the
   * in-app modal that `onExpandClick` drives.
   */
  onOpenInTab?: () => void;
  /**
   * Max height for the diagram container in regular (non-modal, non-full-slide)
   * mode. Any CSS length (e.g. '400px', '60vh'). Defaults to '400px'.
   */
  maxHeight?: string;
  /**
   * When true, keeps the container's border, background fill, padding, and
   * vertical margin (the default framed look). Set to false to render the
   * diagram bare — useful when the host already frames the diagram (e.g.
   * inside a card with its own border).
   */
  showChrome?: boolean;
  /**
   * Rendering engine selection (see {@link MermaidRenderer}). Defaults to
   * 'auto', which uses beautiful-mermaid when the diagram type is supported
   * and falls back to mermaid.js otherwise.
   */
  renderer?: MermaidRenderer;
}

// Define mermaid type
interface MermaidAPI {
  initialize: (config: object) => void;
  run: (options: { nodes: HTMLElement[] }) => Promise<void>;
  render: (
    id: string,
    code: string,
    container?: HTMLElement,
  ) => Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
}

// Get mermaid instance
const getMermaidSync = (): MermaidAPI | null => {
  if (typeof window !== 'undefined') {
    const mermaid = (window as Window & { mermaid?: MermaidAPI }).mermaid;
    if (mermaid) {
      return mermaid;
    }
  }
  return null;
};

/**
 * Shared post-render sizing: relax mermaid's default constraints and fit the
 * SVG to the container based on the current display mode. Both renderers
 * produce an `<svg>` element, so this runs for mermaid.js and beautiful-mermaid.
 */
function applySvgSizing(
  svgElement: SVGElement,
  opts: { isFullSlide: boolean; isModalMode: boolean; maxHeight: string; theme: Theme },
) {
  const { isFullSlide, isModalMode, maxHeight, theme } = opts;

  svgElement.style.maxWidth = 'none';
  svgElement.style.maxHeight = 'none';
  svgElement.style.width = 'auto';
  svgElement.style.height = 'auto';
  svgElement.style.display = 'block';
  svgElement.style.margin = '0 auto';

  if (!svgElement.getAttribute('preserveAspectRatio')) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  if (isFullSlide) {
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.maxWidth = '100%';
    svgElement.style.maxHeight = '100%';
    svgElement.style.objectFit = 'contain';
  } else if (isModalMode) {
    svgElement.style.width = 'auto';
    svgElement.style.height = 'auto';
    svgElement.style.maxWidth = 'none';
    svgElement.style.maxHeight = 'none';
    svgElement.style.minWidth = 'auto';
    svgElement.style.minHeight = 'auto';

    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [, , width, height] = viewBox.split(' ').map(Number);
      if (width && height) {
        svgElement.setAttribute('width', width.toString());
        svgElement.setAttribute('height', height.toString());
      }
    }
  } else {
    const svgMaxHeight = `calc(${maxHeight} - ${theme.space[3] * 2 + 2}px)`;
    svgElement.style.maxHeight = svgMaxHeight;
    svgElement.style.width = '100%';
    svgElement.style.maxWidth = '100%';
  }
}

export function IndustryMermaidDiagram({
  code,
  id,
  theme: themeOverride,
  onCopyError,
  onError,
  rootMargin = '200px',
  isModalMode = false,
  isFullSlide = false,
  onExpandClick,
  onOpenInTab,
  maxHeight = '400px',
  showChrome = true,
  renderer = 'auto',
}: IndustryMermaidDiagramProps) {
  // Get theme from context or use override
  const theme = themeOverride ?? defaultTheme;

  // Optional engineering-paper grid: a custom color role that only themes that
  // opt in define. When present (and chrome is shown), the diagram container is
  // rendered over a faint minor+major graph grid so the framed diagram reads
  // like a drawing on engineering paper.
  const gridColor = (theme.colors as Record<string, string | undefined>).backgroundGrid;
  const gridBackground = gridColor
    ? {
        // Same 1px weight for every line; the major grid sits at a *lower*
        // alpha than the minor lines so it never reads as heavier, while the
        // minor lines carry a touch more presence.
        backgroundImage: [
          `linear-gradient(to right, ${gridColor}1A 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${gridColor}1A 1px, transparent 1px)`,
          `linear-gradient(to right, ${gridColor}12 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${gridColor}12 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
      }
    : undefined;

  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const [copiedError, setCopiedError] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref to set up intersection observer when element is attached
  const containerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setContainerElement(node);

      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Set up new observer if conditions are met
      if (node && !hasRendered) {
        // Skip intersection observer in modal mode or if not available
        if (isModalMode || typeof IntersectionObserver === 'undefined') {
          setIsIntersecting(true);
          setHasRendered(true);
          return;
        }

        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting && !hasRendered) {
              setHasRendered(true);
            }
          },
          {
            rootMargin,
            threshold: 0.01,
          },
        );

        observerRef.current.observe(node);
      }
    },
    [rootMargin, hasRendered, isModalMode],
  );

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!hasRendered) return;

    const renderDiagram = async () => {
      if (!containerElement) return;

      const useBeautiful =
        renderer === 'beautiful' || (renderer === 'auto' && isBeautifulMermaidSupported(code));

      if (useBeautiful) {
        try {
          const svg = renderMermaidSVG(code, buildBeautifulMermaidOptions(theme));
          // Strip the Google Fonts @import lines — the theme font family stays
          // declared in the SVG's `text { font-family }` rule, so diagrams
          // render correctly offline.
          containerElement.innerHTML = stripBeautifulFontImports(svg);

          const svgElement = containerElement.querySelector('svg');
          if (svgElement) {
            applySvgSizing(svgElement, { isFullSlide, isModalMode, maxHeight, theme });
          }

          setErrorDetails(null);
          if (onError) onError(false);
          return;
        } catch (err: unknown) {
          if (renderer === 'beautiful') {
            // Forced beautiful renderer: surface the error instead of falling back.
            console.error('Beautiful-mermaid rendering error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
            setErrorDetails({ code, message: errorMessage });
            if (onError) onError(true);
            if (containerElement) containerElement.innerHTML = '';
            return;
          }
          // 'auto' mode: fall through to mermaid.js for this diagram.
        }
      }

      const mermaid = getMermaidSync();
      if (!mermaid) {
        // No mermaid.js loaded and beautiful-mermaid already failed (or doesn't
        // support this diagram type) — surface an error instead of leaving the
        // placeholder stuck on "Loading...".
        console.error('Mermaid rendering error: no mermaid renderer available');
        setErrorDetails({ code, message: 'No diagram renderer available (mermaid not loaded)' });
        if (onError) onError(true);
        return;
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            lineColor: theme.colors.text,
            arrowheadColor: theme.colors.text,
            edgeColor: theme.colors.text,
            transitionColor: theme.colors.text,
            signalColor: theme.colors.text,
            signalTextColor: theme.colors.text,
            loopTextColor: theme.colors.text,
          },
          securityLevel: 'loose',
          logLevel: 'error',
        });

        // Clear any previous content
        containerElement.innerHTML = '';

        // Create a unique element ID. Mermaid derives a `querySelector` from
        // this, so it must be a valid CSS selector — sanitize the caller's `id`
        // (which may carry `:`, `/`, `.`, etc.) to a selector-safe token.
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-');
        const elementId = `mermaid-${safeId}-${Date.now()}`;

        // Render the diagram into the container
        const { svg, bindFunctions } = await mermaid.render(elementId, code);
        containerElement.innerHTML = svg;

        if (bindFunctions) {
          bindFunctions(containerElement);
        }

        const svgElement = containerElement.querySelector('svg');
        if (svgElement) {
          applySvgSizing(svgElement, { isFullSlide, isModalMode, maxHeight, theme });
        } else {
          console.warn('No SVG element found after mermaid render');
        }

        setErrorDetails(null);
        if (onError) onError(false);
      } catch (err: unknown) {
        console.error('Mermaid rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
        setErrorDetails({ code, message: errorMessage });
        if (onError) onError(true);

        // Clear container so we can show error via React state
        if (containerElement) {
          containerElement.innerHTML = '';
        }
      }
    };

    renderDiagram();
  }, [
    hasRendered,
    code,
    id,
    theme,
    containerElement,
    onError,
    isModalMode,
    isFullSlide,
    maxHeight,
    renderer,
  ]);

  // Handle copy error action
  const handleCopyError = async () => {
    if (!errorDetails) return;

    const errorText = `Mermaid Rendering Error:
${errorDetails.message}

Failed Mermaid Code:
\`\`\`mermaid
${errorDetails.code}
\`\`\``;

    try {
      await navigator.clipboard.writeText(errorText);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);

      // Call onCopyError callback if provided
      if (onCopyError) {
        onCopyError(errorDetails.code, errorDetails.message);
      }
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  const containerStyle: React.CSSProperties = isFullSlide
    ? {
        // Full-slide mode: take up entire slide area
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        padding: theme.space[4],
        margin: 0,
        overflow: 'auto',
      }
    : isModalMode
      ? {
          // Modal mode: fill available space
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          margin: 0,
          overflow: 'visible',
        }
      : {
          // Regular mode: apply constraints
          position: 'relative',
          maxHeight, // Smart height limit - diagrams fit within the configured height
          display: 'block',
          backgroundColor: showChrome ? theme.colors.backgroundSecondary : 'transparent',
          ...(showChrome ? gridBackground : undefined),
          border: showChrome ? `1px solid ${theme.colors.border}` : 'none',
          borderRadius: showChrome ? theme.radii[2] : 0,
          padding: showChrome ? (hasRendered ? theme.space[3] : theme.space[4]) : 0,
          margin: showChrome ? `${theme.space[4]}px 0` : 0,
          // Enable horizontal scrolling for wide diagrams, vertical for tall ones
          overflowX: hasRendered ? 'auto' : 'visible',
          overflowY: hasRendered ? 'auto' : 'visible',
        };

  const placeholderStyle: React.CSSProperties = {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes[2],
    fontFamily: theme.fonts.body,
  };

  if (isModalMode || isFullSlide) {
    // Modal mode: simple wrapper for the zoom container
    return (
      <div ref={containerRef} style={containerStyle} className="mermaid-container">
        {!hasRendered && (
          <div style={placeholderStyle}>
            <div>📊 Mermaid Diagram</div>
            <div style={{ fontSize: theme.fontSizes[1], marginTop: theme.space[2], opacity: 0.7 }}>
              Loading...
            </div>
          </div>
        )}
        {errorDetails && (
          <div
            style={{
              padding: theme.space[4],
              background: `${theme.colors.error}22`,
              border: `1px solid ${theme.colors.error}`,
              borderRadius: theme.radii[2],
              color: theme.colors.text,
              fontFamily: theme.fonts.monospace,
              fontSize: theme.fontSizes[1],
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: theme.space[2],
              }}
            >
              <div style={{ fontWeight: theme.fontWeights.bold }}>
                Failed to render Mermaid diagram
              </div>
              <button
                onClick={handleCopyError}
                style={{
                  padding: theme.space[1],
                  backgroundColor: copiedError
                    ? theme.colors.success
                    : theme.colors.backgroundSecondary,
                  border: `1px solid ${copiedError ? theme.colors.success : theme.colors.border}`,
                  borderRadius: theme.radii[1],
                  color: copiedError ? theme.colors.background : theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.space[1],
                  fontSize: theme.fontSizes[0],
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s ease',
                }}
                title="Copy error details"
              >
                {copiedError ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Error
                  </>
                )}
              </button>
            </div>
            <div
              style={{
                fontSize: theme.fontSizes[0],
                opacity: 0.8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {errorDetails.message}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        {hasRendered && !isModalMode && (onExpandClick || onOpenInTab) && !errorDetails && (
          <div
            style={{
              position: 'absolute',
              top: theme.space[2],
              right: theme.space[2],
              zIndex: 10,
              display: 'flex',
              gap: theme.space[1],
            }}
          >
            {onExpandClick && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onExpandClick();
                }}
                style={{
                  padding: theme.space[1],
                  backgroundColor: theme.colors.backgroundSecondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii[1],
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                }}
                title="View fullscreen"
              >
                <Expand size={14} />
              </button>
            )}
            {onOpenInTab && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onOpenInTab();
                }}
                style={{
                  padding: theme.space[1],
                  backgroundColor: theme.colors.backgroundSecondary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii[1],
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                }}
                title="Open in new tab"
              >
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        )}
        <div ref={containerRef} style={containerStyle} className="mermaid-container">
          {!hasRendered && (
            <div style={placeholderStyle}>
              <div>📊 Mermaid Diagram</div>
              <div
                style={{ fontSize: theme.fontSizes[1], marginTop: theme.space[2], opacity: 0.7 }}
              >
                {isIntersecting ? 'Loading...' : 'Scroll to view'}
              </div>
            </div>
          )}
          {errorDetails && (
            <div
              style={{
                padding: theme.space[4],
                background: `${theme.colors.error}22`,
                border: `1px solid ${theme.colors.error}`,
                borderRadius: theme.radii[2],
                color: theme.colors.text,
                fontFamily: theme.fonts.monospace,
                fontSize: theme.fontSizes[1],
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: theme.space[2],
                }}
              >
                <div style={{ fontWeight: theme.fontWeights.bold }}>
                  Failed to render Mermaid diagram
                </div>
                <button
                  onClick={handleCopyError}
                  style={{
                    padding: theme.space[1],
                    backgroundColor: copiedError
                      ? theme.colors.success
                      : theme.colors.backgroundSecondary,
                    border: `1px solid ${copiedError ? theme.colors.success : theme.colors.border}`,
                    borderRadius: theme.radii[1],
                    color: copiedError ? theme.colors.background : theme.colors.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.space[1],
                    fontSize: theme.fontSizes[0],
                    fontFamily: theme.fonts.body,
                    transition: 'all 0.2s ease',
                  }}
                  title="Copy error details"
                >
                  {copiedError ? (
                    <>
                      <Check size={14} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Error
                    </>
                  )}
                </button>
              </div>
              <div
                style={{
                  fontSize: theme.fontSizes[0],
                  opacity: 0.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {errorDetails.message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
