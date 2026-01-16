import { Theme } from '@principal-ade/industry-theme';
import {
  BashCommandOptions,
  BashCommandResult,
  RepositoryInfo,
} from '@principal-ade/markdown-utils';
import React, { useRef } from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

export interface DocumentViewProps {
  content: string;

  // Event handlers
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;

  // Layout options
  maxWidth?: string | number;
  width?: number; // Optional width in pixels for responsive containers

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
  repositoryInfo?: RepositoryInfo;
  fontSizeScale?: number;
  theme: Theme;
  transparentBackground?: boolean;

  // Editing
  editable?: boolean; // When true, checkboxes are interactive. Default: false
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  content,
  onCheckboxChange,
  maxWidth = '900px',
  width, // Reserved for future responsive layout enhancements
  slideIdPrefix = 'document',
  enableHtmlPopout = true,
  enableKeyboardScrolling = true,
  autoFocusOnVisible = true,
  onLinkClick,
  handleRunBashCommand,
  handlePromptCopy,
  repositoryInfo,
  fontSizeScale,
  theme,
  transparentBackground = false,
  editable = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundColor = transparentBackground ? 'transparent' : theme.colors.background;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflow: 'auto',
        backgroundColor: backgroundColor,
      }}
    >
      <div
        style={{
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
          height: '100%',
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
          autoFocusOnVisible={autoFocusOnVisible}
          onLinkClick={onLinkClick}
          handleRunBashCommand={handleRunBashCommand}
          fontSizeScale={fontSizeScale}
          handlePromptCopy={handlePromptCopy}
          repositoryInfo={repositoryInfo}
          transparentBackground={transparentBackground}
          editable={editable}
          containerWidth={width}
        />
      </div>
    </div>
  );
};
