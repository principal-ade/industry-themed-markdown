import { Theme } from '@principal-ade/industry-theme';
import React, { useState } from 'react';

export interface IndustryHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  theme: Theme;
}

export const useIndustryHtmlModal = () => {
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [htmlModalContent, setHtmlModalContent] = useState('');

  const openHtmlModal = (content: string) => {
    setHtmlModalContent(content);
    setHtmlModalOpen(true);
  };

  const closeHtmlModal = () => {
    setHtmlModalOpen(false);
  };

  return { htmlModalOpen, htmlModalContent, openHtmlModal, closeHtmlModal };
};

export function IndustryHtmlModal({ isOpen, onClose, htmlContent, theme }: IndustryHtmlModalProps) {
  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: theme.space[6],
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii[3],
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows[4],
  };

  const headerStyle: React.CSSProperties = {
    padding: theme.space[4],
    borderBottom: `1px solid ${theme.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.space[5],
    overflow: 'auto',
    flex: 1,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    color: theme.colors.text,
    fontSize: theme.fontSizes[3],
    fontWeight: theme.fontWeights.semibold,
    fontFamily: theme.fonts.heading,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: theme.fontSizes[5],
    cursor: 'pointer',
    color: theme.colors.textSecondary,
    padding: `${theme.space[1]}px ${theme.space[2]}px`,
    borderRadius: theme.radii[1],
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  };

  const handleCloseButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
    e.currentTarget.style.color = theme.colors.text;
  };

  const handleCloseButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = theme.colors.textSecondary;
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>HTML Preview</h3>
          <button
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            style={closeButtonStyle}
            onMouseEnter={handleCloseButtonHover}
            onMouseLeave={handleCloseButtonLeave}
            title="Close"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div style={contentStyle}>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  );
}
