import { Theme } from '@principal-ade/industry-theme';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { IndustryZoomableMermaidDiagram } from './IndustryZoomableMermaidDiagram';

interface IndustryMermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  mermaidCode: string;
  theme: Theme;
}

export function IndustryMermaidModal({
  isOpen,
  onClose,
  mermaidCode,
  theme,
}: IndustryMermaidModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not its children
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker backdrop overlay
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: theme.space[4],
      }}
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: theme.colors.background, // Keep theme background
          borderRadius: theme.radii[3],
          padding: 0, // No padding to maximize diagram space
          width: '95vw',
          height: '95vh', // Use more screen space
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: theme.shadows[4],
        }}
      >
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: theme.space[2],
            right: theme.space[2],
            zIndex: 100, // Ensure button is above diagram
            background: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            fontSize: theme.fontSizes[4],
            color: theme.colors.text,
            cursor: 'pointer',
            lineHeight: 1,
            padding: `${theme.space[1]}px`,
            borderRadius: theme.radii[1],
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
            e.currentTarget.style.color = theme.colors.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = theme.colors.background;
            e.currentTarget.style.color = theme.colors.text;
          }}
          aria-label="Close"
        >
          ×
        </button>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: theme.colors.background,
            padding: `${theme.space[5]}px ${theme.space[2]}px ${theme.space[2]}px ${theme.space[2]}px`, // Add top padding to avoid X button
          }}
        >
          <IndustryZoomableMermaidDiagram
            id="mermaid-modal-diagram"
            code={mermaidCode}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
