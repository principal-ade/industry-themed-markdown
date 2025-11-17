import { Theme } from '@principal-ade/industry-theme';
import { BashCommandOptions, BashCommandResult } from '@principal-ade/markdown-utils';
import { AnimatedResizableLayout } from '@principal-ade/panels';
import React, { useState, useCallback, useRef, useEffect } from 'react';

import { extractAllSlideTitles } from '../utils/extractSlideTitles';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';
import { SlideNavigationHeader } from './SlideNavigationHeader';
import { SlideSearchBar, SearchResult } from './SlideSearchBar';

export interface SlidePresentationProps {
  // Core content
  slides: string[];
  initialSlide?: number;

  // Event handlers
  onSlideChange?: (slideIndex: number) => void;
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;

  // Layout options
  showNavigation?: boolean;
  showSlideCounter?: boolean;
  showFullscreenButton?: boolean;
  showPopoutButton?: boolean;
  isPopout?: boolean;
  containerHeight?: string;

  // TOC options
  tocDisplayMode?: 'overlay' | 'sidebar';
  tocSidebarPosition?: 'left' | 'right';
  initialTocOpen?: boolean;

  // Pop-out handlers
  onPopout?: () => void;
  onClose?: () => void;

  // IndustryMarkdownSlide props pass-through
  slideIdPrefix?: string;
  enableHtmlPopout?: boolean;
  enableKeyboardScrolling?: boolean;
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  handleRunBashCommand?: (
    command: string,
    options?: BashCommandOptions,
  ) => Promise<BashCommandResult>;
  handlePromptCopy?: (filledPrompt: string) => void;
  fontSizeScale?: number;
  theme: Theme;
}

export const SlidePresentation: React.FC<SlidePresentationProps> = ({
  slides,
  initialSlide = 0,
  onSlideChange,
  onCheckboxChange,
  showNavigation = true,
  showSlideCounter = true,
  showFullscreenButton = false,
  showPopoutButton = false,
  isPopout = false,
  containerHeight = '100%',
  tocDisplayMode = 'overlay',
  tocSidebarPosition = 'left',
  initialTocOpen,
  onPopout,
  onClose,
  slideIdPrefix = 'slide',
  enableHtmlPopout = true,
  enableKeyboardScrolling = true,
  onLinkClick,
  handleRunBashCommand,
  handlePromptCopy,
  fontSizeScale,
  theme,
}) => {
  // Detect if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force overlay mode on mobile, otherwise use the provided mode
  const effectiveTocDisplayMode = isMobile ? 'overlay' : tocDisplayMode;

  // Smart default: open by default in sidebar mode, closed in overlay mode
  const defaultTocOpen = initialTocOpen ?? (effectiveTocDisplayMode === 'sidebar');
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(defaultTocOpen);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(-1); // -1 means no selection
  const [searchStartSlide, setSearchStartSlide] = useState(0); // Track where search was initiated
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract slide titles for TOC
  const slideTitles = extractAllSlideTitles(slides);

  // Handle slide navigation
  const navigateToSlide = useCallback(
    (slideIndex: number) => {
      if (slideIndex >= 0 && slideIndex < slides.length) {
        setCurrentSlide(slideIndex);
        onSlideChange?.(slideIndex);
        // In overlay mode, close TOC when navigating
        // In sidebar mode, keep TOC open for easy navigation
        if (effectiveTocDisplayMode === 'overlay') {
          setShowTOC(false);
        }
      }
    },
    [slides.length, onSlideChange, effectiveTocDisplayMode],
  );

  // Search functionality - only rebuild when query or slides change, not currentSlide
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchResult(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    slides.forEach((slide, index) => {
      const slideText = slide.toLowerCase();
      const matches = slideText.split(query).length - 1;
      if (matches > 0) {
        results.push({ slideIndex: index, count: matches });
      }
    });

    setSearchResults(results);

    // Don't auto-highlight any result
    setCurrentSearchResult(-1);
  }, [searchQuery, slides]);

  const navigateToSearchResult = useCallback(
    (resultIndex: number) => {
      if (searchResults.length === 0) return;

      // If we're at -1 (no selection) and going forward, start at 0
      // If going backward from -1, wrap to last result
      let newIndex = resultIndex;
      if (currentSearchResult === -1) {
        newIndex = resultIndex < 0 ? searchResults.length - 1 : 0;
      } else {
        newIndex =
          ((resultIndex % searchResults.length) + searchResults.length) % searchResults.length;
      }

      setCurrentSearchResult(newIndex);

      // Only navigate if it's a different slide
      const targetSlide = searchResults[newIndex].slideIndex;
      if (targetSlide !== currentSlide) {
        navigateToSlide(targetSlide);
      }
    },
    [searchResults, navigateToSlide, currentSlide, currentSearchResult],
  );

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    // Keep search state - don't clear query or results
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchResult(-1);
    setSearchStartSlide(0);
  }, []);

  const goToPreviousSlide = useCallback(() => {
    navigateToSlide(currentSlide - 1);
  }, [currentSlide, navigateToSlide]);

  const goToNextSlide = useCallback(() => {
    navigateToSlide(currentSlide + 1);
  }, [currentSlide, navigateToSlide]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Allow Tab navigation in search
        if (
          showSearch &&
          (event.key === 'Tab' || event.key === 'Enter' || event.key === 'Escape')
        ) {
          // Continue to handle these keys
        } else {
          return;
        }
      }

      // Handle Cmd/Ctrl+F for search
      if ((event.metaKey || event.ctrlKey) && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault();
        event.stopPropagation();

        // If reopening search, update the start slide but keep the query/results
        if (!showSearch) {
          setSearchStartSlide(currentSlide); // Remember where we started searching
          setShowSearch(true);
        } else {
          // If search is already open, close it
          closeSearch();
        }
        return;
      }

      // Handle search-specific keys
      if (showSearch) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            closeSearch();
            return;
          case 'Tab':
            event.preventDefault();
            if (event.shiftKey) {
              navigateToSearchResult(currentSearchResult - 1);
            } else {
              navigateToSearchResult(currentSearchResult + 1);
            }
            return;
          case 'Enter':
            event.preventDefault();
            // If we have a selected result, navigate to it
            if (currentSearchResult >= 0 && currentSearchResult < searchResults.length) {
              const targetSlide = searchResults[currentSearchResult].slideIndex;
              if (targetSlide !== currentSlide) {
                navigateToSlide(targetSlide);
              }
            }
            // Always close the search bar on Enter
            closeSearch();
            return;
        }
        return; // Don't process other keys when search is open
      }

      switch (event.key) {
        case 'ArrowLeft':
          // Support both with and without modifier keys
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'ArrowRight':
          // Support both with and without modifier keys
          event.preventDefault();
          goToNextSlide();
          break;
        case ' ': // Spacebar
          // Spacebar goes to next slide (common in presentations)
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Enter':
          // Enter also goes to next slide
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Backspace':
          // Backspace goes to previous slide
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'Home':
          // Home goes to first slide
          event.preventDefault();
          navigateToSlide(0);
          break;
        case 'End':
          // End goes to last slide
          event.preventDefault();
          navigateToSlide(slides.length - 1);
          break;
        case 'f':
        case 'F':
          // F key toggles fullscreen
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'Escape':
          // Escape closes TOC if open
          if (showTOC) {
            event.preventDefault();
            setShowTOC(false);
          }
          break;
        case 't':
        case 'T':
          // T key toggles TOC
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            setShowTOC(prev => !prev);
          }
          break;
      }

      // Number keys 1-9 jump to specific slides
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9 && num <= slides.length) {
          event.preventDefault();
          navigateToSlide(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goToPreviousSlide,
    goToNextSlide,
    navigateToSlide,
    slides.length,
    toggleFullscreen,
    showTOC,
    showSearch,
    closeSearch,
    navigateToSearchResult,
    currentSearchResult,
    tocDisplayMode,
  ]);

  // Update state when slides change externally
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        position: 'relative',
      }}
    >
      {/* Navigation Bar */}
      {showNavigation && (
        <SlideNavigationHeader
          currentSlide={currentSlide}
          totalSlides={slides.length}
          showTOC={showTOC}
          isFullscreen={isFullscreen}
          showSlideCounter={showSlideCounter}
          showFullscreenButton={showFullscreenButton}
          showPopoutButton={showPopoutButton}
          isPopout={isPopout}
          theme={theme}
          tocDisplayMode={effectiveTocDisplayMode}
          isMobile={isMobile}
          onPrevious={goToPreviousSlide}
          onNext={goToNextSlide}
          onToggleTOC={() => setShowTOC(prev => !prev)}
          onToggleFullscreen={toggleFullscreen}
          onPopout={onPopout}
          onClose={onClose}
        />
      )}

      {/* Main Content Area with TOC Sidebar */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
        }}
      >
        {effectiveTocDisplayMode === 'sidebar' ? (
          // Sidebar Mode with AnimatedResizableLayout
          <AnimatedResizableLayout
            key={`toc-${tocSidebarPosition}`}
            collapsed={!showTOC}
            collapsibleSide={tocSidebarPosition}
            leftPanel={
              tocSidebarPosition === 'left' ? (
                // TOC on left
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: theme.colors.backgroundSecondary,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {/* TOC Header */}
                  <div
                    style={{
                      padding: theme.space[3],
                      borderBottom: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.background,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
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
                      Table of Contents
                    </h3>
                    <p
                      style={{
                        margin: `${theme.space[1]}px 0 0 0`,
                        fontSize: theme.fontSizes[0],
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
                    </p>
                  </div>

                  {/* TOC Items */}
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
                          backgroundColor:
                            currentSlide === index ? theme.colors.primary : 'transparent',
                          border: 'none',
                          borderRadius: theme.radii[1],
                          color:
                            currentSlide === index ? theme.colors.background : theme.colors.text,
                          fontSize: theme.fontSizes[1],
                          fontFamily: theme.fonts.body,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                        onMouseOver={e => {
                          if (currentSlide !== index) {
                            e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                          }
                        }}
                        onMouseOut={e => {
                          if (currentSlide !== index) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
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
                        {currentSlide === index && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '3px',
                              height: '60%',
                              backgroundColor:
                                currentSlide === index
                                  ? theme.colors.background
                                  : theme.colors.primary,
                              borderRadius: '0 2px 2px 0',
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Content on left
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                  {slides.length > 0 ? (
                    <IndustryMarkdownSlide
                      content={slides[currentSlide] || ''}
                      slideIdPrefix={`${slideIdPrefix}-${currentSlide}`}
                      slideIndex={currentSlide}
                      isVisible={true}
                      theme={theme}
                      onCheckboxChange={onCheckboxChange}
                      enableHtmlPopout={enableHtmlPopout}
                      enableKeyboardScrolling={enableKeyboardScrolling}
                      onLinkClick={onLinkClick}
                      handleRunBashCommand={handleRunBashCommand}
                      handlePromptCopy={handlePromptCopy}
                      fontSizeScale={fontSizeScale}
                      searchQuery={showSearch ? searchQuery : undefined}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.colors.muted,
                        fontSize: theme.fontSizes[2],
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      No slides available
                    </div>
                  )}
                </div>
              )
            }
            rightPanel={
              tocSidebarPosition === 'right' ? (
                // TOC on right
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: theme.colors.backgroundSecondary,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {/* TOC Header */}
                  <div
                    style={{
                      padding: theme.space[3],
                      borderBottom: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.background,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
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
                      Table of Contents
                    </h3>
                    <p
                      style={{
                        margin: `${theme.space[1]}px 0 0 0`,
                        fontSize: theme.fontSizes[0],
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
                    </p>
                  </div>

                  {/* TOC Items */}
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
                          backgroundColor:
                            currentSlide === index ? theme.colors.primary : 'transparent',
                          border: 'none',
                          borderRadius: theme.radii[1],
                          color:
                            currentSlide === index ? theme.colors.background : theme.colors.text,
                          fontSize: theme.fontSizes[1],
                          fontFamily: theme.fonts.body,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                        onMouseOver={e => {
                          if (currentSlide !== index) {
                            e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                          }
                        }}
                        onMouseOut={e => {
                          if (currentSlide !== index) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
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
                        {currentSlide === index && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '3px',
                              height: '60%',
                              backgroundColor:
                                currentSlide === index
                                  ? theme.colors.background
                                  : theme.colors.primary,
                              borderRadius: '0 2px 2px 0',
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Content on right
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                  {slides.length > 0 ? (
                    <IndustryMarkdownSlide
                      content={slides[currentSlide] || ''}
                      slideIdPrefix={`${slideIdPrefix}-${currentSlide}`}
                      slideIndex={currentSlide}
                      isVisible={true}
                      theme={theme}
                      onCheckboxChange={onCheckboxChange}
                      enableHtmlPopout={enableHtmlPopout}
                      enableKeyboardScrolling={enableKeyboardScrolling}
                      onLinkClick={onLinkClick}
                      handleRunBashCommand={handleRunBashCommand}
                      handlePromptCopy={handlePromptCopy}
                      fontSizeScale={fontSizeScale}
                      searchQuery={showSearch ? searchQuery : undefined}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.colors.muted,
                        fontSize: theme.fontSizes[2],
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      No slides available
                    </div>
                  )}
                </div>
              )
            }
            defaultSize={tocSidebarPosition === 'left' ? 20 : 80}
            minSize={15}
            showCollapseButton={false}
            theme={theme}
          />
        ) : (
          // Overlay Mode - original implementation
          <>
        {/* Table of Contents Sidebar (Overlay Mode) */}
        {effectiveTocDisplayMode === 'overlay' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '300px',
              backgroundColor: theme.colors.backgroundSecondary,
              borderRight: `1px solid ${theme.colors.border}`,
              transform: showTOC ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
              zIndex: 10,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
          {/* TOC Header */}
          <div
            style={{
              padding: theme.space[3],
              borderBottom: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.background,
              position: 'sticky',
              top: 0,
              zIndex: 1,
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
              Table of Contents
            </h3>
            <p
              style={{
                margin: `${theme.space[1]}px 0 0 0`,
                fontSize: theme.fontSizes[0],
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.body,
              }}
            >
              {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
            </p>
          </div>

          {/* TOC Items */}
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
                  position: 'relative',
                }}
                onMouseOver={e => {
                  if (currentSlide !== index) {
                    e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                  }
                }}
                onMouseOut={e => {
                  if (currentSlide !== index) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
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
                {currentSlide === index && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      backgroundColor:
                        currentSlide === index ? theme.colors.background : theme.colors.primary,
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Overlay to close TOC when clicking outside (Overlay Mode Only) */}
        {effectiveTocDisplayMode === 'overlay' && showTOC && (
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
        )}

        {/* Slide Content */}
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          {slides.length > 0 ? (
            <IndustryMarkdownSlide
              content={slides[currentSlide] || ''}
              slideIdPrefix={`${slideIdPrefix}-${currentSlide}`}
              slideIndex={currentSlide}
              isVisible={true}
              theme={theme}
              onCheckboxChange={onCheckboxChange}
              enableHtmlPopout={enableHtmlPopout}
              enableKeyboardScrolling={enableKeyboardScrolling}
              onLinkClick={onLinkClick}
              handleRunBashCommand={handleRunBashCommand}
              handlePromptCopy={handlePromptCopy}
              fontSizeScale={fontSizeScale}
              searchQuery={showSearch ? searchQuery : undefined}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.muted,
                fontSize: theme.fontSizes[2],
                fontFamily: theme.fonts.body,
              }}
            >
              No slides available
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {showNavigation && slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: theme.colors.border,
            opacity: 0.3,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              backgroundColor: theme.colors.primary,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Search Bar */}
      <SlideSearchBar
        showSearch={showSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        currentSearchResult={currentSearchResult}
        searchStartSlide={searchStartSlide}
        slideTitles={slideTitles}
        theme={theme}
        onResultClick={(index, slideIndex) => {
          setCurrentSearchResult(index);
          navigateToSlide(slideIndex);
        }}
        onClose={closeSearch}
        onClear={clearSearch}
      />
    </div>
  );
};
