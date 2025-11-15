/**
 * IndustryMermaidDiagram Component
 *
 * A theme-aware Mermaid diagram renderer that uses the industry theme
 * This is a replacement for ConfigurableMermaidDiagram that doesn't depend on the old theme system
 */

import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import { Expand, Copy, Check } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
}: IndustryMermaidDiagramProps) {
  // Get theme from context or use override
  const theme = themeOverride ?? defaultTheme;

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
      const mermaid = getMermaidSync();
      if (!mermaid || !containerElement) return;

      try {
        // Configure mermaid with theme colors
        // Create a slightly contrasted background for better visibility
        // Use backgroundSecondary for consistency between modal and inline views
        const diagramBackground = isModalMode
          ? 'transparent'
          : theme.colors.backgroundSecondary || theme.colors.background;
        const nodeBackground =
          theme.colors.backgroundTertiary ||
          theme.colors.backgroundSecondary ||
          theme.colors.primary + '22';

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            // Primary node colors
            primaryColor: nodeBackground,
            primaryTextColor: theme.colors.text,
            primaryBorderColor: theme.colors.border,

            // Secondary and tertiary colors
            secondaryColor: theme.colors.secondary + '44', // Add some transparency
            tertiaryColor: theme.colors.accent + '44',

            // Backgrounds
            background: diagramBackground,
            mainBkg: nodeBackground,
            secondBkg: theme.colors.backgroundSecondary || theme.colors.muted,
            tertiaryBkg: theme.colors.backgroundTertiary || theme.colors.accent + '22',
            altBackground: theme.colors.muted,

            // Cluster/Subgraph specific - ensure good contrast
            clusterBkg:
              theme.colors.muted ||
              theme.colors.backgroundTertiary ||
              theme.colors.backgroundSecondary,
            clusterBorder: theme.colors.border,
            titleColor: theme.colors.text,

            // Borders
            lineColor: theme.colors.border,
            secondaryBorderColor: theme.colors.border,
            tertiaryBorderColor: theme.colors.accent,

            // Text colors - ensure they work on various backgrounds
            textColor: theme.colors.text,
            labelTextColor: theme.colors.text,
            nodeTextColor: theme.colors.text,

            // Edge label styling
            edgeLabelBackground: theme.colors.background,

            // Error styling
            errorBkgColor: theme.colors.error + '33',
            errorTextColor: theme.colors.error,
          },
          securityLevel: 'loose',
          logLevel: 'error',
        });

        // Clear any previous content
        containerElement.innerHTML = '';

        // Create a unique element ID
        const elementId = `mermaid-${id}-${Date.now()}`;

        // Render the diagram into the container
        const { svg, bindFunctions } = await mermaid.render(elementId, code);
        containerElement.innerHTML = svg;

        if (bindFunctions) {
          bindFunctions(containerElement);
        }

        // Override mermaid's max-width constraint to allow full container usage
        const svgElement = containerElement.querySelector('svg');
        if (svgElement) {
          // Remove mermaid's default constraints
          svgElement.style.maxWidth = 'none';
          svgElement.style.maxHeight = 'none';
          svgElement.style.width = 'auto';
          svgElement.style.height = 'auto';
          svgElement.style.display = 'block';
          svgElement.style.margin = '0 auto';

          // Ensure SVG preserves aspect ratio
          if (!svgElement.getAttribute('preserveAspectRatio')) {
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }

          // Smart sizing: ensure diagrams initially fit within height limit
          // Note: Zoom is applied separately in its own useEffect to avoid re-rendering
          if (isFullSlide) {
            // Full-slide mode: scale diagram to fit within slide bounds
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            svgElement.style.objectFit = 'contain';
          } else if (isModalMode) {
            // Modal mode: remove ALL constraints for full zoom capability
            svgElement.style.width = 'auto';
            svgElement.style.height = 'auto';
            svgElement.style.maxWidth = 'none';
            svgElement.style.maxHeight = 'none';
            svgElement.style.minWidth = 'auto';
            svgElement.style.minHeight = 'auto';

            // Get the viewBox to determine natural size
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const [, , width, height] = viewBox.split(' ').map(Number);
              if (width && height) {
                // Set explicit dimensions for zoom calculations
                // Don't scale here - let the parent component handle scaling
                svgElement.setAttribute('width', width.toString());
                svgElement.setAttribute('height', height.toString());
              }
            }
          } else {
            // Default sizing to fit within the 400px container height
            svgElement.style.maxHeight = '360px'; // Leave room for padding
            svgElement.style.width = '100%'; // Fill container width
            svgElement.style.maxWidth = '100%'; // Respect parent container width
            // Let container handle overflow with scrolling
          }
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
  }, [hasRendered, code, id, theme, containerElement, onError, isModalMode, isFullSlide]);

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
          maxHeight: '400px', // Smart height limit - diagrams initially fit within 400px
          display: 'block',
          backgroundColor: hasRendered
            ? theme.colors.backgroundSecondary
            : theme.colors.backgroundSecondary,
          border: hasRendered
            ? `1px solid ${theme.colors.border}`
            : `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii[2],
          padding: hasRendered ? theme.space[3] : theme.space[4],
          margin: `${theme.space[4]}px 0`,
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
        {hasRendered && !isModalMode && onExpandClick && !errorDetails && (
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
