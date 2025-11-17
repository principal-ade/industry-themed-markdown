import { Theme } from '@principal-ade/industry-theme';
import { BashCommandOptions, BashCommandResult } from '@principal-ade/markdown-utils';
import { AnimatedResizableLayout } from '@principal-ade/panels';
import React, { useState, useCallback, useRef, useEffect } from 'react';

import { extractAllSlideTitles } from '../utils/extractSlideTitles';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';
import { SlideNavigationHeader } from './SlideNavigationHeader';
import { SlideSearchBar, SearchResult } from './SlideSearchBar';

export interface SlidePresentationBookProps {
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
  viewMode?: 'single' | 'book';

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
  autoFocusOnVisible?: boolean;
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  handleRunBashCommand?: (
    command: string,
    options?: BashCommandOptions,
  ) => Promise<BashCommandResult>;
  handlePromptCopy?: (filledPrompt: string) => void;
  fontSizeScale?: number;
  theme: Theme;
}

export const SlidePresentationBook: React.FC<SlidePresentationBookProps> = ({
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
  viewMode = 'single',
  tocDisplayMode,
  tocSidebarPosition = 'left',
  initialTocOpen,
  onPopout,
  onClose,
  slideIdPrefix = 'slide',
  enableHtmlPopout = true,
  enableKeyboardScrolling = true,
  autoFocusOnVisible = true,
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

  // Smart default: sidebar for single view, overlay for book view
  // But force overlay on mobile in single mode
  const effectiveTocDisplayMode = isMobile && viewMode === 'single'
    ? 'overlay'
    : (tocDisplayMode ?? (viewMode === 'single' ? 'sidebar' : 'overlay'));
  // Default to closed for both sidebar and overlay modes
  const defaultTocOpen = initialTocOpen ?? false;
  // Ensure initial slide is even in book mode for proper page pairing
  const adjustedInitialSlide =
    viewMode === 'book' ? Math.floor(initialSlide / 2) * 2 : initialSlide;
  const [currentSlide, setCurrentSlide] = useState(adjustedInitialSlide);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(defaultTocOpen);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(-1);
  const [searchStartSlide, setSearchStartSlide] = useState(0);
  const [collapsedSide, setCollapsedSide] = useState<'left' | 'right' | null>(null);
  const [lastInteractedSide, setLastInteractedSide] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract slide titles for TOC
  const slideTitles = extractAllSlideTitles(slides);

  // Calculate step size based on view mode
  const stepSize = viewMode === 'book' ? 2 : 1;

  // Handle slide navigation
  const navigateToSlide = useCallback(
    (slideIndex: number) => {
      // In book mode, ensure we navigate to even-numbered slides
      const targetSlide = viewMode === 'book' ? Math.floor(slideIndex / 2) * 2 : slideIndex;

      if (targetSlide >= 0 && targetSlide < slides.length) {
        setCurrentSlide(targetSlide);
        onSlideChange?.(targetSlide);
        // In overlay mode, close TOC when navigating
        // In sidebar mode, keep TOC open for easy navigation
        if (effectiveTocDisplayMode === 'overlay') {
          setShowTOC(false);
        }
      }
    },
    [slides.length, onSlideChange, viewMode, effectiveTocDisplayMode],
  );

  // Search functionality
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
    setCurrentSearchResult(-1);
  }, [searchQuery, slides]);

  const navigateToSearchResult = useCallback(
    (resultIndex: number) => {
      if (searchResults.length === 0) return;

      let newIndex = resultIndex;
      if (currentSearchResult === -1) {
        newIndex = resultIndex < 0 ? searchResults.length - 1 : 0;
      } else {
        newIndex =
          ((resultIndex % searchResults.length) + searchResults.length) % searchResults.length;
      }

      setCurrentSearchResult(newIndex);

      const targetSlide = searchResults[newIndex].slideIndex;
      if (targetSlide !== currentSlide) {
        navigateToSlide(targetSlide);
      }
    },
    [searchResults, navigateToSlide, currentSlide, currentSearchResult],
  );

  const closeSearch = useCallback(() => {
    setShowSearch(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchResult(-1);
    setSearchStartSlide(0);
  }, []);

  const goToPreviousSlide = useCallback(() => {
    navigateToSlide(currentSlide - stepSize);
  }, [currentSlide, navigateToSlide, stepSize]);

  const goToNextSlide = useCallback(() => {
    navigateToSlide(currentSlide + stepSize);
  }, [currentSlide, navigateToSlide, stepSize]);

  // Handle collapse toggles with focus behavior
  const handleCollapseLeft = useCallback(() => {
    if (collapsedSide === 'left') {
      // If left is hidden, show it (expand back)
      setCollapsedSide(null);
    } else if (collapsedSide === 'right') {
      // If focused on left (right is hidden), unfocus by showing both
      setCollapsedSide(null);
    } else {
      // Focus on left by hiding right
      setLastInteractedSide('right');
      setCollapsedSide('right');
    }
  }, [collapsedSide]);

  const handleCollapseRight = useCallback(() => {
    if (collapsedSide === 'right') {
      // If right is hidden, show it (expand back)
      setCollapsedSide(null);
    } else if (collapsedSide === 'left') {
      // If focused on right (left is hidden), unfocus by showing both
      setCollapsedSide(null);
    } else {
      // Focus on right by hiding left
      setLastInteractedSide('left');
      setCollapsedSide('left');
    }
  }, [collapsedSide]);

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
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
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

        if (!showSearch) {
          setSearchStartSlide(currentSlide);
          setShowSearch(true);
        } else {
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
            if (currentSearchResult >= 0 && currentSearchResult < searchResults.length) {
              const targetSlide = searchResults[currentSearchResult].slideIndex;
              if (targetSlide !== currentSlide) {
                navigateToSlide(targetSlide);
              }
            }
            closeSearch();
            return;
        }
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
        case ' ':
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Enter':
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Backspace':
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'Home':
          event.preventDefault();
          navigateToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          navigateToSlide(slides.length - 1);
          break;
        case 'f':
        case 'F':
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
    searchResults,
    effectiveTocDisplayMode,
  ]);

  // Update state when slides change externally
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Determine which slides to show
  const leftSlideIndex = currentSlide;
  const rightSlideIndex = viewMode === 'book' ? currentSlide + 1 : -1;

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
          isMobile={isMobile}
          theme={theme}
          viewMode={viewMode}
          tocDisplayMode={effectiveTocDisplayMode}
          collapseLeft={collapsedSide === 'left'}
          collapseRight={collapsedSide === 'right'}
          onPrevious={goToPreviousSlide}
          onNext={goToNextSlide}
          onToggleTOC={() => setShowTOC(prev => !prev)}
          onToggleFullscreen={toggleFullscreen}
          onPopout={onPopout}
          onClose={onClose}
          onCollapseLeft={handleCollapseLeft}
          onCollapseRight={handleCollapseRight}
        />
      )}

      {/* Main Content Area with TOC Sidebar */}
      <div
        style={{
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
        }}
      >
        {viewMode === 'single' && effectiveTocDisplayMode === 'sidebar' ? (
          // Single view with Sidebar Mode - use AnimatedResizableLayout
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
                    {slideTitles.map((title, index) => {
                      // In single view with sidebar, we're always in single mode
                      const isCurrentPage = index === currentSlide;

                      return (
                        <button
                          key={index}
                          onClick={() => navigateToSlide(index)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: `${theme.space[2]}px ${theme.space[3]}px`,
                            marginBottom: theme.space[1],
                            backgroundColor: isCurrentPage ? theme.colors.primary : 'transparent',
                            border: 'none',
                            borderRadius: theme.radii[1],
                            color: isCurrentPage ? theme.colors.background : theme.colors.text,
                            fontSize: theme.fontSizes[1],
                            fontFamily: theme.fonts.body,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                          onMouseOver={e => {
                            if (!isCurrentPage) {
                              e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                            }
                          }}
                          onMouseOut={e => {
                            if (!isCurrentPage) {
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
                          {isCurrentPage && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '60%',
                                backgroundColor: isCurrentPage
                                  ? theme.colors.background
                                  : theme.colors.primary,
                                borderRadius: '0 2px 2px 0',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Content on left (when TOC on right)
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                  {slides.length > 0 ? (
                    <IndustryMarkdownSlide
                      content={slides[leftSlideIndex] || ''}
                      slideIdPrefix={`${slideIdPrefix}-${leftSlideIndex}`}
                      slideIndex={leftSlideIndex}
                      isVisible={true}
                      theme={theme}
                      onCheckboxChange={onCheckboxChange}
                      enableHtmlPopout={enableHtmlPopout}
                      enableKeyboardScrolling={enableKeyboardScrolling}
                      autoFocusOnVisible={autoFocusOnVisible}
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
                    {slideTitles.map((title, index) => {
                      // In single view with sidebar, we're always in single mode
                      const isCurrentPage = index === currentSlide;

                      return (
                        <button
                          key={index}
                          onClick={() => navigateToSlide(index)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: `${theme.space[2]}px ${theme.space[3]}px`,
                            marginBottom: theme.space[1],
                            backgroundColor: isCurrentPage ? theme.colors.primary : 'transparent',
                            border: 'none',
                            borderRadius: theme.radii[1],
                            color: isCurrentPage ? theme.colors.background : theme.colors.text,
                            fontSize: theme.fontSizes[1],
                            fontFamily: theme.fonts.body,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                          onMouseOver={e => {
                            if (!isCurrentPage) {
                              e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                            }
                          }}
                          onMouseOut={e => {
                            if (!isCurrentPage) {
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
                          {isCurrentPage && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '60%',
                                backgroundColor: isCurrentPage
                                  ? theme.colors.background
                                  : theme.colors.primary,
                                borderRadius: '0 2px 2px 0',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Content on right (when TOC on left)
                <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                  {slides.length > 0 ? (
                    <IndustryMarkdownSlide
                      content={slides[leftSlideIndex] || ''}
                      slideIdPrefix={`${slideIdPrefix}-${leftSlideIndex}`}
                      slideIndex={leftSlideIndex}
                      isVisible={true}
                      theme={theme}
                      onCheckboxChange={onCheckboxChange}
                      enableHtmlPopout={enableHtmlPopout}
                      enableKeyboardScrolling={enableKeyboardScrolling}
                      autoFocusOnVisible={autoFocusOnVisible}
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
          // Book mode OR Overlay mode - use original TOC overlay
          <>
            {/* Table of Contents Overlay */}
            {showTOC && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '300px',
                  zIndex: 10,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRight: `1px solid ${theme.colors.border}`,
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
              {slideTitles.map((title, index) => {
                const isCurrentPage =
                  viewMode === 'book'
                    ? index === leftSlideIndex || index === rightSlideIndex
                    : index === currentSlide;

                return (
                  <button
                    key={index}
                    onClick={() => navigateToSlide(index)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: `${theme.space[2]}px ${theme.space[3]}px`,
                      marginBottom: theme.space[1],
                      backgroundColor: isCurrentPage ? theme.colors.primary : 'transparent',
                      border: 'none',
                      borderRadius: theme.radii[1],
                      color: isCurrentPage ? theme.colors.background : theme.colors.text,
                      fontSize: theme.fontSizes[1],
                      fontFamily: theme.fonts.body,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseOver={e => {
                      if (!isCurrentPage) {
                        e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                      }
                    }}
                    onMouseOut={e => {
                      if (!isCurrentPage) {
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
                    {isCurrentPage && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '60%',
                          backgroundColor: isCurrentPage
                            ? theme.colors.background
                            : theme.colors.primary,
                          borderRadius: '0 2px 2px 0',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            {slideTitles.map((title, index) => {
              const isCurrentPage =
                viewMode === 'book'
                  ? index === leftSlideIndex || index === rightSlideIndex
                  : index === currentSlide;

              return (
                <button
                  key={index}
                  onClick={() => navigateToSlide(index)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: `${theme.space[2]}px ${theme.space[3]}px`,
                    marginBottom: theme.space[1],
                    backgroundColor: isCurrentPage ? theme.colors.primary : 'transparent',
                    border: 'none',
                    borderRadius: theme.radii[1],
                    color: isCurrentPage ? theme.colors.background : theme.colors.text,
                    fontSize: theme.fontSizes[1],
                    fontFamily: theme.fonts.body,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseOver={e => {
                    if (!isCurrentPage) {
                      e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                    }
                  }}
                  onMouseOut={e => {
                    if (!isCurrentPage) {
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
                  {isCurrentPage && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '60%',
                        backgroundColor: isCurrentPage
                          ? theme.colors.background
                          : theme.colors.primary,
                        borderRadius: '0 2px 2px 0',
                      }}
                    />
                  )}
                </button>
              );
            })}
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

        {/* Slide Content - Book or Single View */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            gap: 0,
            padding: 0,
            backgroundColor: theme.colors.background,
            width: '100%',
          }}
        >
          {slides.length > 0 ? (
            viewMode === 'book' && slides.length > 1 ? (
              // Book Mode with AnimatedResizableLayout (only when we have more than 1 slide)
              <AnimatedResizableLayout
                key={`${lastInteractedSide}-${collapsedSide}`} // Force re-mount when collapse state changes
                collapsed={collapsedSide !== null}
                collapsibleSide={lastInteractedSide}
                leftPanel={
                  <div
                    style={{
                      height: '100%',
                      width: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        boxShadow: 'none',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <IndustryMarkdownSlide
                        content={slides[leftSlideIndex] || ''}
                        slideIdPrefix={`${slideIdPrefix}-${leftSlideIndex}`}
                        slideIndex={leftSlideIndex}
                        isVisible={true}
                        theme={theme}
                        onCheckboxChange={onCheckboxChange}
                        enableHtmlPopout={enableHtmlPopout}
                        enableKeyboardScrolling={enableKeyboardScrolling}
                        autoFocusOnVisible={autoFocusOnVisible}
                        onLinkClick={onLinkClick}
                        handleRunBashCommand={handleRunBashCommand}
                        handlePromptCopy={handlePromptCopy}
                        fontSizeScale={fontSizeScale}
                        searchQuery={showSearch ? searchQuery : undefined}
                        transparentBackground={true}
                        additionalPadding={{
                          left: `${theme.space[4]}px`,
                          right: `${theme.space[2]}px`,
                          top: `${theme.space[3]}px`,
                        }}
                        disableScroll={false}
                      />
                    </div>
                  </div>
                }
                rightPanel={
                  rightSlideIndex < slides.length ? (
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: '100%',
                          backgroundColor: 'transparent',
                          borderRadius: 0,
                          boxShadow: 'none',
                          overflowY: 'auto',
                          overflowX: 'auto',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <IndustryMarkdownSlide
                          content={slides[rightSlideIndex] || ''}
                          slideIdPrefix={`${slideIdPrefix}-${rightSlideIndex}`}
                          slideIndex={rightSlideIndex}
                          isVisible={true}
                          theme={theme}
                          onCheckboxChange={onCheckboxChange}
                          enableHtmlPopout={enableHtmlPopout}
                          enableKeyboardScrolling={enableKeyboardScrolling}
                          autoFocusOnVisible={autoFocusOnVisible}
                          onLinkClick={onLinkClick}
                          handleRunBashCommand={handleRunBashCommand}
                          handlePromptCopy={handlePromptCopy}
                          fontSizeScale={fontSizeScale}
                          searchQuery={showSearch ? searchQuery : undefined}
                          transparentBackground={true}
                          additionalPadding={{
                            left: `${theme.space[2]}px`,
                            right: `${theme.space[4]}px`,
                            top: `${theme.space[3]}px`,
                          }}
                          disableScroll={false}
                        />
                      </div>
                    </div>
                  ) : (
                    // Empty right page for odd number of slides
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: theme.colors.background,
                        borderRadius: 0,
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.colors.textSecondary || theme.colors.muted,
                        fontSize: theme.fontSizes[1],
                        fontFamily: theme.fonts.body,
                        fontStyle: 'italic',
                        padding: `0 ${theme.space[4]}px 0 ${theme.space[2]}px`,
                      }}
                    >
                      End of presentation
                    </div>
                  )
                }
                defaultSize={50}
                minSize={30}
                showCollapseButton={false}
                theme={theme}
              />
            ) : (
              // Single Page View (or Book Mode with only 1 slide)
              <div
                style={{
                  flex: '1 1 0%',
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  position: 'relative',
                  width: '100%',
                  // Center the single slide in book mode
                  ...(viewMode === 'book' && slides.length === 1
                    ? {
                        display: 'flex',
                        justifyContent: 'center',
                      }
                    : {}),
                }}
              >
                <div
                  style={{
                    // In book mode with 1 slide, constrain width to look like a single page
                    ...(viewMode === 'book' && slides.length === 1
                      ? {
                          width: '50%',
                          maxWidth: '800px',
                          minWidth: '400px',
                          height: '100%',
                        }
                      : {
                          width: '100%',
                          height: '100%',
                        }),
                  }}
                >
                  <IndustryMarkdownSlide
                    content={slides[leftSlideIndex] || ''}
                    slideIdPrefix={`${slideIdPrefix}-${leftSlideIndex}`}
                    slideIndex={leftSlideIndex}
                    isVisible={true}
                    theme={theme}
                    onCheckboxChange={onCheckboxChange}
                    enableHtmlPopout={enableHtmlPopout}
                    enableKeyboardScrolling={enableKeyboardScrolling}
                    autoFocusOnVisible={autoFocusOnVisible}
                    onLinkClick={onLinkClick}
                    handleRunBashCommand={handleRunBashCommand}
                    handlePromptCopy={handlePromptCopy}
                    fontSizeScale={fontSizeScale}
                    searchQuery={showSearch ? searchQuery : undefined}
                    transparentBackground={false}
                    disableScroll={false}
                  />
                </div>
              </div>
            )
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

        {/* Page numbers in the padding area (Book Mode with multiple slides only) */}
        {viewMode === 'book' && slides.length > 1 && (
          <>
            {/* Left page number */}
            <div
              style={{
                position: 'absolute',
                bottom: theme.space[3],
                left: theme.space[3],
                fontSize: theme.fontSizes[0],
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.monospace,
              }}
            >
              {leftSlideIndex + 1}
            </div>

            {/* Right page number */}
            {rightSlideIndex < slides.length && (
              <div
                style={{
                  position: 'absolute',
                  bottom: theme.space[3],
                  right: theme.space[3],
                  fontSize: theme.fontSizes[0],
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.monospace,
                }}
              >
                {rightSlideIndex + 1}
              </div>
            )}
          </>
        )}
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
              width: `${((currentSlide + stepSize) / slides.length) * 100}%`,
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
