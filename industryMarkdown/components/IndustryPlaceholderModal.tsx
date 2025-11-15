import { Theme } from '@principal-ade/industry-theme';
import React, { useState } from 'react';

export interface IndustryPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeholders: string[];
  promptContent: string;
  onCopy: (filledPrompt: string) => void;
  theme: Theme;
}

export function IndustryPlaceholderModal({
  isOpen,
  onClose,
  placeholders,
  promptContent,
  onCopy,
  theme,
}: IndustryPlaceholderModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Replace placeholders in the prompt with user values
    let filledPrompt = promptContent;
    placeholders.forEach(placeholder => {
      const value = values[placeholder] || `{{${placeholder}}}`;
      const regex = new RegExp(
        `\\{\\{${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`,
        'g',
      );
      filledPrompt = filledPrompt.replace(regex, value);
    });

    // Copy to clipboard
    navigator.clipboard
      .writeText(filledPrompt)
      .then(() => {
        onCopy(filledPrompt);
        onClose();
        // Reset form for next time
        setValues({});
      })
      .catch(err => {
        console.error('Failed to copy filled prompt:', err);
      });
  };

  return (
    <div
      style={{
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
        padding: theme.space[5],
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: theme.radii[3],
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows[4],
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: theme.space[4],
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.colors.backgroundSecondary,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: theme.colors.text,
              fontSize: theme.fontSizes[3],
              fontWeight: theme.fontWeights.semibold,
              fontFamily: theme.fonts.heading,
            }}
          >
            Fill Prompt Placeholders
          </h3>
          <button
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: theme.fontSizes[5],
              cursor: 'pointer',
              color: theme.colors.textSecondary,
              padding: `${theme.space[1]}px`,
              borderRadius: theme.radii[1],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = theme.colors.backgroundTertiary;
              e.currentTarget.style.color = theme.colors.text;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.textSecondary;
            }}
            title="Close"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: theme.space[5],
            overflow: 'auto',
            flex: 1,
            backgroundColor: theme.colors.background,
          }}
        >
          <p
            style={{
              margin: `0 0 ${theme.space[4]}px 0`,
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes[2],
              lineHeight: theme.lineHeights.body,
              fontFamily: theme.fonts.body,
            }}
          >
            Fill in the values for the placeholders below. The prompt will be copied to your
            clipboard with the values substituted.
          </p>

          <form onSubmit={handleSubmit}>
            {placeholders.map((placeholder, index) => (
              <div key={index} style={{ marginBottom: theme.space[4] }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: theme.space[2],
                    fontWeight: theme.fontWeights.medium,
                    color: theme.colors.text,
                    fontSize: theme.fontSizes[1],
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {placeholder}
                </label>
                <input
                  type="text"
                  value={values[placeholder] || ''}
                  onChange={e =>
                    setValues(prev => ({
                      ...prev,
                      [placeholder]: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: `${theme.space[3]}px`,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii[1],
                    fontSize: theme.fontSizes[2],
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    outline: 'none',
                    fontFamily: theme.fonts.body,
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  placeholder={`Enter value for ${placeholder}`}
                />
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                gap: theme.space[3],
                justifyContent: 'flex-end',
                marginTop: theme.space[5],
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: `${theme.space[2]}px ${theme.space[4]}px`,
                  borderRadius: theme.radii[1],
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  cursor: 'pointer',
                  border: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.space[2],
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = theme.colors.background;
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  padding: `${theme.space[2]}px ${theme.space[4]}px`,
                  borderRadius: theme.radii[1],
                  fontSize: theme.fontSizes[2],
                  fontWeight: theme.fontWeights.medium,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.space[2],
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  fontFamily: theme.fonts.body,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
