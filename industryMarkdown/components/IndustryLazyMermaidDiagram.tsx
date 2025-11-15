import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import { MoveRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { IndustryMermaidDiagram } from './IndustryMermaidDiagram';

interface IndustryLazyMermaidDiagramProps {
  code: string;
  id: string;
  onCopyError?: (mermaidCode: string, errorMessage: string) => void;
  rootMargin?: string;
  onShowInPanel?: (code: string, title?: string) => void;
  theme?: Theme;
  onExpandClick?: () => void;
}

export function IndustryLazyMermaidDiagram({
  code,
  id,
  onCopyError,
  rootMargin = '200px',
  onShowInPanel,
  theme: themeOverride,
  onExpandClick,
}: IndustryLazyMermaidDiagramProps) {
  // Get theme from context or use override
  const theme = themeOverride ?? defaultTheme;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting to avoid SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Skip intersection observer if lazy loading is disabled or not mounted
    if (!isMounted) return;

    // Check if IntersectionObserver is available (browser environment)
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: render immediately if IntersectionObserver is not available
      setIsIntersecting(true);
      setHasRendered(true);
      return;
    }

    const observer = new IntersectionObserver(
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

    const currentElement = containerRef.current;
    if (currentElement && observer) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement && observer) {
        observer.unobserve(currentElement);
      }
    };
  }, [rootMargin, hasRendered, isMounted]);

  // Helper function to get placeholder style
  const getPlaceholderStyle = () => {
    return {
      position: 'relative' as const,
      margin: `${theme.space[4]}px 0`,
      padding: theme.space[5],
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radii[2],
      backgroundColor: theme.colors.backgroundSecondary,
      minHeight: '200px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
  };

  const getTextStyle = () => {
    return {
      textAlign: 'center' as const,
      fontSize: theme.fontSizes[2],
      color: theme.colors.textSecondary,
      fontFamily: theme.fonts.monospace,
    };
  };

  const getSecondaryTextStyle = () => {
    return {
      fontSize: theme.fontSizes[1],
      marginTop: theme.space[2],
      color: theme.colors.textTertiary,
    };
  };

  // If not mounted yet (SSR), don't render anything that depends on browser APIs
  if (!isMounted) {
    return (
      <div style={getPlaceholderStyle()}>
        <div style={getTextStyle()}>
          <div>📊 Mermaid Diagram</div>
          <div style={getSecondaryTextStyle()}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {hasRendered && onShowInPanel && !hasError && (
        <button
          onClick={e => {
            e.stopPropagation();
            // Try to extract a title from the diagram code (first comment or diagram type)
            const titleMatch = code.match(/^(?:%%\s*(.+)|(\w+)\s)/m);
            const title = titleMatch?.[1] || titleMatch?.[2] || 'Diagram from Markdown';
            onShowInPanel(code, title);
          }}
          style={{
            position: 'absolute',
            top: theme.space[2],
            right: theme.space[2],
            padding: `${theme.space[2]}px ${theme.space[3]}px`,
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii[1],
            fontSize: theme.fontSizes[1],
            fontWeight: theme.fontWeights.medium,
            cursor: 'pointer',
            zIndex: 10,
            fontFamily: theme.fonts.body,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: theme.space[1],
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = theme.colors.background;
          }}
          title="Show in diagram panel"
        >
          <MoveRight size={14} />
        </button>
      )}
      {hasRendered ? (
        <IndustryMermaidDiagram
          code={code}
          id={id}
          onCopyError={onCopyError}
          onError={setHasError}
          theme={theme}
          onExpandClick={onExpandClick}
        />
      ) : (
        <div style={getPlaceholderStyle()}>
          <div style={getTextStyle()}>
            <div>📊 Mermaid Diagram</div>
            <div style={getSecondaryTextStyle()}>
              {isIntersecting ? 'Loading...' : 'Scroll to view'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
