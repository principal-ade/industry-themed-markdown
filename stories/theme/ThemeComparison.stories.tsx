import {
  ThemeProvider,
  matrixMinimalTheme,
  matrixTheme,
  regalTheme,
  slateTheme,
  terminalTheme,
  useTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// Component to show theme details
const ThemeShowcase = () => {
  const { theme, mode, setMode } = useTheme();

  return (
    <div
      style={{
        padding: '32px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        minHeight: '100vh',
        transition: 'all 0.3s ease',
        fontFamily: theme.fonts.body,
      }}
    >
      <h1
        style={{
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
          fontSize: '2.5rem',
          marginBottom: '8px',
        }}
      >
        Theme Showcase
      </h1>

      <p
        style={{
          color: theme.colors.textSecondary,
          marginBottom: '32px',
          fontFamily: theme.fonts.body,
        }}
      >
        Current mode: <strong>{mode || 'default'}</strong>
      </p>

      {/* Mode switcher for themes that have modes */}
      {theme.modes && Object.keys(theme.modes).length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={() => setMode('')}
            style={{
              padding: '12px 24px',
              backgroundColor: !mode ? theme.colors.primary : theme.colors.muted,
              color: !mode ? '#ffffff' : theme.colors.text,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: theme.fonts.body,
            }}
          >
            Light
          </button>
          {Object.keys(theme.modes).map(modeName => (
            <button
              key={modeName}
              onClick={() => setMode(modeName)}
              style={{
                padding: '12px 24px',
                backgroundColor: mode === modeName ? theme.colors.primary : theme.colors.muted,
                color: mode === modeName ? '#ffffff' : theme.colors.text,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
              }}
            >
              {modeName.charAt(0).toUpperCase() + modeName.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Typography Examples */}
      <div
        style={{
          padding: '24px',
          backgroundColor: theme.colors.surface || theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            marginBottom: '16px',
          }}
        >
          Typography
        </h2>

        <h3
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            marginBottom: '8px',
          }}
        >
          Heading Font: {theme.fonts.heading}
        </h3>

        <p
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.text,
            marginBottom: '8px',
          }}
        >
          Body Font: {theme.fonts.body}
        </p>

        <pre
          style={{
            fontFamily: theme.fonts.monospace,
            color: theme.colors.textSecondary,
            backgroundColor: theme.colors.backgroundTertiary,
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          <code>Monospace Font: {theme.fonts.monospace}</code>
        </pre>
      </div>

      {/* Color Palette */}
      <div
        style={{
          padding: '24px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            marginBottom: '16px',
          }}
        >
          Color Palette
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          {Object.entries(theme.colors).map(
            ([name, color]) =>
              typeof color === 'string' && (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    backgroundColor: theme.colors.background,
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      border: '1px solid ' + theme.colors.border,
                      borderRadius: '4px',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fonts.monospace,
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: theme.colors.textTertiary,
                        fontFamily: theme.fonts.monospace,
                      }}
                    >
                      {color}
                    </div>
                  </div>
                </div>
              ),
          )}
        </div>
      </div>

      {/* Sample Components */}
      <div
        style={{
          padding: '24px',
          backgroundColor: theme.colors.backgroundTertiary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
        }}
      >
        <h2
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            marginBottom: '16px',
          }}
        >
          Sample Components
        </h2>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: theme.fonts.body,
            }}
          >
            Primary Button
          </button>

          <button
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.secondary,
              color: theme.colors.text,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: theme.fonts.body,
            }}
          >
            Secondary Button
          </button>

          <button
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: theme.fonts.body,
            }}
          >
            Outlined Button
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: theme.colors.success,
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: theme.fonts.body,
            }}
          >
            Success
          </span>

          <span
            style={{
              padding: '4px 8px',
              backgroundColor: theme.colors.warning,
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: theme.fonts.body,
            }}
          >
            Warning
          </span>

          <span
            style={{
              padding: '4px 8px',
              backgroundColor: theme.colors.error,
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: theme.fonts.body,
            }}
          >
            Error
          </span>

          <span
            style={{
              padding: '4px 8px',
              backgroundColor: theme.colors.info,
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: theme.fonts.body,
            }}
          >
            Info
          </span>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
          }}
        >
          <h3
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              marginBottom: '8px',
            }}
          >
            Sample Card
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fonts.body,
            }}
          >
            This is a sample card component showing how the theme colors work together.
          </p>
        </div>
      </div>
    </div>
  );
};

// Theme switcher component
const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState<
    'terminal' | 'regal' | 'matrix' | 'matrixMinimal' | 'slate'
  >('slate');

  const activeTheme =
    currentTheme === 'terminal'
      ? terminalTheme
      : currentTheme === 'regal'
        ? regalTheme
        : currentTheme === 'matrix'
          ? matrixTheme
          : currentTheme === 'matrixMinimal'
            ? matrixMinimalTheme
            : slateTheme;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <button
          onClick={() => setCurrentTheme('terminal')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentTheme === 'terminal' ? '#0066cc' : '#333',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Terminal Theme (Default)
        </button>
        <button
          onClick={() => setCurrentTheme('regal')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentTheme === 'regal' ? '#d4a574' : '#333',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Regal Theme
        </button>
        <button
          onClick={() => setCurrentTheme('matrix')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentTheme === 'matrix' ? '#00ff41' : '#333',
            color: currentTheme === 'matrix' ? '#000000' : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Matrix Theme
        </button>
        <button
          onClick={() => setCurrentTheme('matrixMinimal')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentTheme === 'matrixMinimal' ? '#ffffff' : '#333',
            color: currentTheme === 'matrixMinimal' ? '#000000' : '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Matrix Minimal
        </button>
        <button
          onClick={() => setCurrentTheme('slate')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentTheme === 'slate' ? '#00bcd4' : '#333',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Slate Theme (New)
        </button>
      </div>

      <div style={{ paddingTop: '60px' }}>
        <ThemeProvider theme={activeTheme}>
          <ThemeShowcase />
        </ThemeProvider>
      </div>
    </>
  );
};

// Storybook meta
const meta: Meta = {
  title: 'IndustryTheme/Theme Comparison',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllThemes: Story = {
  render: () => <ThemeSwitcher />,
};

export const TerminalTheme: Story = {
  render: () => (
    <ThemeProvider theme={terminalTheme}>
      <ThemeShowcase />
    </ThemeProvider>
  ),
};

export const RegalTheme: Story = {
  render: () => (
    <ThemeProvider theme={regalTheme}>
      <ThemeShowcase />
    </ThemeProvider>
  ),
};

export const MatrixTheme: Story = {
  render: () => (
    <ThemeProvider theme={matrixTheme}>
      <ThemeShowcase />
    </ThemeProvider>
  ),
};

export const MatrixMinimalTheme: Story = {
  render: () => (
    <ThemeProvider theme={matrixMinimalTheme}>
      <ThemeShowcase />
    </ThemeProvider>
  ),
};

export const SlateTheme: Story = {
  render: () => (
    <ThemeProvider theme={slateTheme}>
      <ThemeShowcase />
    </ThemeProvider>
  ),
};
