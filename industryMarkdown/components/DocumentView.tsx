import { Theme } from '@principal-ade/industry-theme';
import { BashCommandOptions, BashCommandResult, RepositoryInfo } from '@principal-ade/markdown-utils';
import React, { useRef, useCallback } from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

export interface DocumentViewProps {
  // Content can be either full markdown or array of slides
  content: string | string[];

  // Display mode
  showSegmented?: boolean; // If true and content is array, show with section headers

  // Event handlers
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;
  onSectionClick?: (sectionIndex: number) => void;

  // Layout options
  maxWidth?: string | number;
  padding?: string | number;
  showSectionHeaders?: boolean;
  showSeparators?: boolean;

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
  repositoryInfo?: RepositoryInfo;
  fontSizeScale?: number;
  theme: Theme;
  transparentBackground?: boolean;
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  content,
  showSegmented = true,
  onCheckboxChange,
  onSectionClick,
  maxWidth = '900px',
  padding = '24px',
  showSectionHeaders = true,
  showSeparators = true,
  slideIdPrefix = 'document',
  enableHtmlPopout = true,
  enableKeyboardScrolling = true,
  onLinkClick,
  handleRunBashCommand,
  handlePromptCopy,
  repositoryInfo,
  fontSizeScale,
  theme,
  transparentBackground = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backgroundColor = transparentBackground ? 'transparent' : theme.colors.background;

  // Handle scroll to section
  const scrollToSection = useCallback((sectionIndex: number) => {
    if (sectionRefs.current[sectionIndex]) {
      sectionRefs.current[sectionIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Handle section header click
  const handleSectionClick = useCallback(
    (index: number) => {
      scrollToSection(index);
      onSectionClick?.(index);
    },
    [scrollToSection, onSectionClick],
  );

  // If content is a string (full document), render as single slide
  if (typeof content === 'string') {
    return (
      <div
        ref={containerRef}
        style={{
          height: '100%',
          overflow: 'auto',
          backgroundColor: backgroundColor,
          padding: typeof padding === 'number' ? `${padding}px` : padding,
        }}
      >
        <div
          style={{
            maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
            margin: '0 auto',
          }}
        >
          <IndustryMarkdownSlide
            content={content}
            slideIdPrefix={slideIdPrefix}
            slideIndex={0}
            isVisible={true}
            theme={theme}
            onCheckboxChange={onCheckboxChange}
            enableHtmlPopout={enableHtmlPopout}
            enableKeyboardScrolling={enableKeyboardScrolling}
            onLinkClick={onLinkClick}
            handleRunBashCommand={handleRunBashCommand}
            fontSizeScale={fontSizeScale}
            handlePromptCopy={handlePromptCopy}
            repositoryInfo={repositoryInfo}
          />
        </div>
      </div>
    );
  }

  // If content is an array and showSegmented is false, join and render as single slide
  if (!showSegmented) {
    const fullContent = content.join('\n\n---\n\n');
    return (
      <div
        ref={containerRef}
        style={{
          height: '100%',
          overflow: 'auto',
          backgroundColor: backgroundColor,
          padding: typeof padding === 'number' ? `${padding}px` : padding,
        }}
      >
        <div
          style={{
            maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
            margin: '0 auto',
          }}
        >
          <IndustryMarkdownSlide
            content={fullContent}
            slideIdPrefix={slideIdPrefix}
            slideIndex={0}
            isVisible={true}
            theme={theme}
            onCheckboxChange={onCheckboxChange}
            enableHtmlPopout={enableHtmlPopout}
            enableKeyboardScrolling={enableKeyboardScrolling}
            onLinkClick={onLinkClick}
            handleRunBashCommand={handleRunBashCommand}
            fontSizeScale={fontSizeScale}
            handlePromptCopy={handlePromptCopy}
            repositoryInfo={repositoryInfo}
          />
        </div>
      </div>
    );
  }

  // Segmented view with section headers
  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflow: 'auto',
        backgroundColor: backgroundColor,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
      }}
    >
      <div
        style={{
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
        }}
      >
        {content.map((slideContent, index) => (
          <div
            key={index}
            ref={el => {
              if (el) sectionRefs.current[index] = el;
            }}
            style={{
              marginBottom: index < content.length - 1 ? '48px' : '0',
              scrollMarginTop: '20px',
            }}
          >
            {/* Section header */}
            {showSectionHeaders && (
              <div
                onClick={() => handleSectionClick(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  opacity: 0.7,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.opacity = '0.7';
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Section {index + 1} of {content.length}
                </span>

                {/* Optional: Add a collapse/expand icon or other controls here */}
              </div>
            )}

            {/* Slide content */}
            <IndustryMarkdownSlide
              content={slideContent}
              slideIdPrefix={`${slideIdPrefix}-${index}`}
              slideIndex={index}
              isVisible={true}
              theme={theme}
              onCheckboxChange={onCheckboxChange}
              enableHtmlPopout={enableHtmlPopout}
              enableKeyboardScrolling={enableKeyboardScrolling}
              onLinkClick={onLinkClick}
              handleRunBashCommand={handleRunBashCommand}
              fontSizeScale={fontSizeScale}
              handlePromptCopy={handlePromptCopy}
              repositoryInfo={repositoryInfo}
            />

            {/* Separator between sections */}
            {showSeparators && index < content.length - 1 && (
              <div
                style={{
                  marginTop: '32px',
                  marginBottom: '32px',
                  height: '1px',
                  backgroundColor: theme.colors.border,
                  opacity: 0.3,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
