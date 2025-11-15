import { Theme } from '@principal-ade/industry-theme';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Columns,
  ExternalLink,
  X,
} from 'lucide-react';
import React from 'react';

import { FocusLeftIcon, FocusRightIcon } from './FocusLeftIcon';

interface HeaderButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  theme: Theme;
  children: React.ReactNode;
  width?: string;
  minWidth?: string;
  padding?: string;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  onClick,
  disabled = false,
  active = false,
  title,
  theme,
  children,
  width = '36px',
  minWidth,
  padding,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space[1],
        width: minWidth ? undefined : width,
        minWidth: minWidth,
        height: '36px',
        padding: padding || (minWidth ? `0 ${theme.space[2]}px` : undefined),
        backgroundColor:
          isHovered && !disabled && !active
            ? theme.colors.backgroundSecondary
            : active
              ? theme.colors.primary
              : 'transparent',
        border: `1px solid ${
          isHovered && !disabled
            ? theme.colors.text
            : active
              ? theme.colors.primary
              : theme.colors.border
        }`,
        borderRadius: theme.radii[1],
        color: active
          ? theme.colors.background
          : disabled
            ? theme.colors.muted
            : isHovered
              ? theme.colors.text
              : theme.colors.textSecondary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: theme.fontSizes[1],
        fontFamily: theme.fonts.body,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
      title={title}
    >
      {children}
    </button>
  );
};

export interface SlideNavigationHeaderProps {
  currentSlide: number;
  totalSlides: number;
  showTOC: boolean;
  isFullscreen: boolean;
  showSlideCounter: boolean;
  showFullscreenButton: boolean;
  showPopoutButton?: boolean;
  isPopout?: boolean;
  theme: Theme;
  viewMode?: 'single' | 'book';
  tocDisplayMode?: 'overlay' | 'sidebar';
  collapseLeft?: boolean;
  collapseRight?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleTOC: () => void;
  onToggleFullscreen: () => void;
  onPopout?: () => void;
  onClose?: () => void;
  onCollapseLeft?: () => void;
  onCollapseRight?: () => void;
  additionalButtons?: React.ReactNode;
  additionalButtonsPosition?: 'after-toc' | 'before-collapse';
}

export const SlideNavigationHeader: React.FC<SlideNavigationHeaderProps> = ({
  currentSlide,
  totalSlides,
  showTOC,
  isFullscreen,
  showSlideCounter,
  showFullscreenButton,
  showPopoutButton = false,
  isPopout = false,
  theme,
  viewMode = 'single',
  tocDisplayMode = 'overlay',
  collapseLeft = false,
  collapseRight = false,
  onPrevious,
  onNext,
  onToggleTOC,
  onToggleFullscreen,
  onPopout,
  onClose,
  onCollapseLeft,
  onCollapseRight,
}) => {
  const navigationHeight = '48px';

  return (
    <div
      style={{
        height: navigationHeight,
        minHeight: navigationHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${theme.space[3]}px`,
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.background,
        flexShrink: 0,
      }}
    >
      {/* Left: TOC button and Previous button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.space[2],
        }}
      >
        {/* Table of Contents button */}
        <HeaderButton
          onClick={onToggleTOC}
          active={showTOC}
          theme={theme}
          title={
            tocDisplayMode === 'sidebar'
              ? showTOC
                ? 'Hide table of contents (T)'
                : 'Show table of contents (T)'
              : showTOC
                ? 'Close table of contents (Esc)'
                : 'Open table of contents (T)'
          }
        >
          <Menu size={18} />
        </HeaderButton>

        <HeaderButton
          onClick={onPrevious}
          disabled={currentSlide === 0}
          theme={theme}
          title="Previous slide"
          minWidth="100px"
        >
          <ChevronLeft size={18} />
          Previous
        </HeaderButton>

        {/* Focus/Expand Left Panel button (for book mode) */}
        {viewMode === 'book' && onCollapseLeft && (
          <HeaderButton
            onClick={onCollapseLeft}
            active={collapseRight}
            theme={theme}
            title={
              collapseLeft
                ? 'Expand left panel'
                : collapseRight
                  ? 'Show both panels'
                  : 'Focus on left panel'
            }
          >
            {collapseLeft ? (
              <PanelLeftClose size={18} style={{ transform: 'rotate(180deg)' }} />
            ) : collapseRight ? (
              <Columns size={18} />
            ) : (
              <FocusLeftIcon size={18} />
            )}
          </HeaderButton>
        )}
      </div>

      {/* Center: Slide counter */}
      {showSlideCounter && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: theme.colors.textSecondary,
            fontSize: theme.fontSizes[1],
            fontFamily: theme.fonts.monospace,
          }}
        >
          {viewMode === 'book' ? (
            <>
              <span style={{ fontWeight: 600 }}>{Math.floor(currentSlide / 2) + 1}</span>
              <span style={{ opacity: 0.5, margin: '0 0.4em' }}>of</span>
              <span style={{ fontWeight: 600 }}>{Math.ceil(totalSlides / 2)}</span>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600 }}>{currentSlide + 1}</span>
              <span style={{ opacity: 0.5, margin: '0 0.4em' }}>of</span>
              <span style={{ fontWeight: 600 }}>{totalSlides}</span>
            </>
          )}
        </div>
      )}

      {/* Right: Next button and fullscreen */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.space[2],
        }}
      >
        {/* Focus/Expand Right Panel button (for book mode) */}
        {viewMode === 'book' && onCollapseRight && (
          <HeaderButton
            onClick={onCollapseRight}
            active={collapseLeft}
            theme={theme}
            title={
              collapseRight
                ? 'Expand right panel'
                : collapseLeft
                  ? 'Show both panels'
                  : 'Focus on right panel'
            }
          >
            {collapseRight ? (
              <PanelRightClose size={18} style={{ transform: 'rotate(180deg)' }} />
            ) : collapseLeft ? (
              <Columns size={18} />
            ) : (
              <FocusRightIcon size={18} />
            )}
          </HeaderButton>
        )}

        <HeaderButton
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          theme={theme}
          title="Next slide"
          minWidth="100px"
        >
          Next
          <ChevronRight size={18} />
        </HeaderButton>

        {showPopoutButton && onPopout && !isPopout && (
          <HeaderButton onClick={onPopout} theme={theme} title="Pop out to new window">
            <ExternalLink size={18} />
          </HeaderButton>
        )}
        {isPopout && onClose && (
          <HeaderButton onClick={onClose} theme={theme} title="Close window">
            <X size={18} />
          </HeaderButton>
        )}
        {showFullscreenButton && !showPopoutButton && (
          <HeaderButton
            onClick={onToggleFullscreen}
            theme={theme}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </HeaderButton>
        )}
      </div>
    </div>
  );
};
