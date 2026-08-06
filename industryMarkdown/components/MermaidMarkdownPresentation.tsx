import { Theme } from '@principal-ade/industry-theme';
import { Check, Copy } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { extractSlideTitle } from '../utils/presentationUtils';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';
import { IndustryZoomableMermaidDiagram } from './IndustryZoomableMermaidDiagram';
import { SlideNavigationHeader } from './SlideNavigationHeader';

export interface MermaidMarkdownSlide {
  /** Mermaid diagram source rendered in the top panel */
  mermaid: string;
  /** Associated markdown rendered in the bottom panel */
  markdown: string;
  /** Optional slide title used for the table of contents */
  title?: string;
}

export interface MermaidMarkdownPresentationProps {
  /** Ordered list of slides, each pairing a mermaid diagram with its markdown */
  slides: MermaidMarkdownSlide[];
  /** Index of the slide to show first (default: 0) */
  initialSlide?: number;
  /** Called whenever the active slide changes */
  onSlideChange?: (slideIndex: number) => void;
  theme: Theme;
  /** Show the navigation header with prev/next controls (default: true) */
  showNavigation?: boolean;
  /** Show the slide counter in the header (default: true) */
  showSlideCounter?: boolean;
  /** Show a copy button in the header that copies the active slide's mermaid + markdown (default: true) */
  showCopySlideButton?: boolean;
  /** Prefix used for markdown slide element ids */
  slideIdPrefix?: string;
  /** How the mermaid diagram fits the top panel (default: 'contain') */
  mermaidFitStrategy?: 'contain' | 'width' | 'height';
  /** Default size of the mermaid (top) panel as a percentage (default: 70) */
  mermaidPanelDefaultSize?: number;
  /** Default size of the markdown (bottom) panel as a percentage (default: 30) */
  markdownPanelDefaultSize?: number;
  /** Pass-through link click handler for the markdown panel */
  onLinkClick?: (href: string, event?: MouseEvent) => void;
}

export const MermaidMarkdownPresentation: React.FC<MermaidMarkdownPresentationProps> = ({
  slides,
  initialSlide = 0,
  onSlideChange,
  theme,
  showNavigation = true,
  showSlideCounter = true,
  showCopySlideButton = true,
  slideIdPrefix = 'mermaid-slide',
  mermaidFitStrategy = 'contain',
  mermaidPanelDefaultSize = 70,
  markdownPanelDefaultSize = 30,
  onLinkClick,
}) => {
  const [currentSlide, setCurrentSlide] = useState(
    Math.min(Math.max(initialSlide, 0), Math.max(slides.length - 1, 0)),
  );
  const [showTOC, setShowTOC] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slide = slides[currentSlide];

  const slideTitles = useMemo(
    () =>
      slides.map((s, index) => s.title || extractSlideTitle(s.markdown) || `Slide ${index + 1}`),
    [slides],
  );

  const [copiedSlide, setCopiedSlide] = useState(false);

  const handleCopySlide = useCallback(async () => {
    const activeSlide = slides[currentSlide];
    if (!activeSlide) return;

    const text = [
      `# ${slideTitles[currentSlide]}`,
      '',
      '## Mermaid',
      '```mermaid',
      activeSlide.mermaid,
      '```',
      '',
      '## Markdown',
      activeSlide.markdown,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlide(true);
      setTimeout(() => setCopiedSlide(false), 2000);
    } catch (err) {
      console.error('Failed to copy slide:', err);
    }
  }, [slides, currentSlide, slideTitles]);

  const navigateToSlide = useCallback(
    (slideIndex: number) => {
      if (slideIndex < 0 || slideIndex >= slides.length) return;
      setCurrentSlide(slideIndex);
      setShowTOC(false);
      onSlideChange?.(slideIndex);
    },
    [slides.length, onSlideChange],
  );

  const goToPreviousSlide = useCallback(
    () => navigateToSlide(currentSlide - 1),
    [navigateToSlide, currentSlide],
  );

  const goToNextSlide = useCallback(
    () => navigateToSlide(currentSlide + 1),
    [navigateToSlide, currentSlide],
  );

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
    setIsFullscreen(prev => !prev);
  }, []);

  useEffect(() => {
    if (initialSlide < slides.length) {
      setCurrentSlide(initialSlide);
    }
  }, [initialSlide, slides.length]);

  // Presentation keyboard navigation (arrow keys + Home/End).
  // ArrowUp/Down/space are left to the markdown pane, which owns its own
  // scrolling behavior.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showTOC && event.key === 'Escape') {
        setShowTOC(false);
        return;
      }
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Home':
          event.preventDefault();
          navigateToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          navigateToSlide(slides.length - 1);
          break;
        case 't':
        case 'T':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            setShowTOC(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTOC, goToPreviousSlide, goToNextSlide, navigateToSlide, slides.length]);

  if (slides.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          color: theme.colors.muted,
          fontSize: theme.fontSizes[2],
          fontFamily: theme.fonts.body,
        }}
      >
        No slides available
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        position: 'relative',
      }}
    >
      {showNavigation && (
        <SlideNavigationHeader
          currentSlide={currentSlide}
          totalSlides={slides.length}
          showTOC={showTOC}
          isFullscreen={isFullscreen}
          showSlideCounter={showSlideCounter}
          showFullscreenButton={false}
          theme={theme}
          onPrevious={goToPreviousSlide}
          onNext={goToNextSlide}
          onToggleTOC={() => setShowTOC(prev => !prev)}
          onToggleFullscreen={toggleFullscreen}
          additionalButtons={
            showCopySlideButton && (
              <button
                onClick={handleCopySlide}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  backgroundColor: copiedSlide ? theme.colors.success : 'transparent',
                  border: `1px solid ${copiedSlide ? theme.colors.success : theme.colors.border}`,
                  borderRadius: theme.radii[1],
                  color: copiedSlide ? theme.colors.background : theme.colors.textSecondary,
                  fontSize: theme.fontSizes[1],
                  fontFamily: theme.fonts.body,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={copiedSlide ? 'Slide copied' : 'Copy slide information'}
              >
                {copiedSlide ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )
          }
        />
      )}

      {/* Resizable split: mermaid diagram on top, markdown below */}
      <Group orientation="vertical" style={{ flex: 1, minHeight: 0 }}>
        <Panel
          id="mermaid-panel"
          defaultSize={`${mermaidPanelDefaultSize}%`}
          minSize="15%"
          style={{ minHeight: 0, overflow: 'hidden' }}
        >
          <IndustryZoomableMermaidDiagram
            code={slide.mermaid}
            id={`${slideIdPrefix}-${currentSlide}-diagram`}
            theme={theme}
            fitStrategy={mermaidFitStrategy}
          />
        </Panel>
        <Separator
          style={{
            backgroundColor: theme.colors.border,
            minHeight: '6px',
            cursor: 'row-resize',
            position: 'relative',
          }}
        />
        <Panel
          id="markdown-panel"
          defaultSize={`${markdownPanelDefaultSize}%`}
          minSize="15%"
          style={{ minHeight: 0, overflow: 'hidden' }}
        >
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <IndustryMarkdownSlide
              content={slide.markdown}
              slideIdPrefix={`${slideIdPrefix}-${currentSlide}`}
              slideIndex={currentSlide}
              isVisible={true}
              theme={theme}
              onLinkClick={onLinkClick}
            />
          </div>
        </Panel>
      </Group>

      {/* TOC overlay */}
      {showTOC && (
        <>
          <div
            onClick={() => setShowTOC(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9,
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '48px',
              left: theme.space[2],
              zIndex: 10,
              minWidth: '260px',
              maxHeight: '60%',
              overflowY: 'auto',
              backgroundColor: theme.colors.backgroundSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii[2],
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                padding: theme.space[3],
                borderBottom: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: theme.fontSizes[3],
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                  fontWeight: 600,
                }}
              >
                Slides
              </h3>
            </div>
            <div style={{ padding: theme.space[2] }}>
              {slideTitles.map((title, index) => (
                <button
                  key={index}
                  onClick={() => navigateToSlide(index)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: `${theme.space[2]}px ${theme.space[3]}px`,
                    marginBottom: theme.space[1],
                    backgroundColor: currentSlide === index ? theme.colors.primary : 'transparent',
                    border: 'none',
                    borderRadius: theme.radii[1],
                    color: currentSlide === index ? theme.colors.background : theme.colors.text,
                    fontSize: theme.fontSizes[1],
                    fontFamily: theme.fonts.body,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.space[2] }}>
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: '24px',
                        fontSize: theme.fontSizes[0],
                        fontFamily: theme.fonts.monospace,
                        opacity: 0.6,
                      }}
                    >
                      {index + 1}.
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
