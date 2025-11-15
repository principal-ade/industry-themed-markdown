import {
  ThemeProvider,
  useTheme,
  theme as defaultTheme,
  overrideColors,
  makeTheme,
  addMode,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Create a theme with multiple modes
const themeWithModes = addMode(
  addMode(defaultTheme, 'dark', {
    text: '#e4e4e7',
    background: '#18181b',
    primary: '#f59e0b',
    secondary: '#1f2937',
    accent: '#d97706',
    border: '#27272a',
    surface: '#1f1f23',
    backgroundSecondary: '#1f1f23',
    backgroundTertiary: '#27272a',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textMuted: '#52525b',
  }),
  'high-contrast',
  {
    text: '#000000',
    background: '#FFFFFF',
    primary: '#0000FF',
    secondary: '#FF0000',
    border: '#000000',
  },
  'dark', // Extend from dark mode
);

// Demo component that uses the theme
const ThemeDemoComponent = () => {
  const { theme, mode, setMode } = useTheme();

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        minHeight: '400px',
        transition: 'all 0.3s ease',
      }}
    >
      <h2
        style={{
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
          marginBottom: '16px',
        }}
      >
        Theme Mode Demo
      </h2>

      <p
        style={{
          color: theme.colors.textSecondary,
          marginBottom: '24px',
        }}
      >
        Current mode: <strong>{mode || 'default'}</strong>
      </p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setMode('')}
          style={{
            padding: '8px 16px',
            backgroundColor: !mode ? theme.colors.primary : theme.colors.secondary,
            color: !mode ? theme.colors.background : theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Default
        </button>
        <button
          onClick={() => setMode('dark')}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'dark' ? theme.colors.primary : theme.colors.secondary,
            color: mode === 'dark' ? theme.colors.background : theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Dark
        </button>
        <button
          onClick={() => setMode('high-contrast')}
          style={{
            padding: '8px 16px',
            backgroundColor:
              mode === 'high-contrast' ? theme.colors.primary : theme.colors.secondary,
            color: mode === 'high-contrast' ? theme.colors.background : theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          High Contrast
        </button>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ color: theme.colors.primary, marginBottom: '8px' }}>Color Palette</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '8px',
          }}
        >
          {Object.entries(theme.colors).map(
            ([name, color]) =>
              typeof color === 'string' && (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: color,
                      border: '1px solid #000',
                      borderRadius: '4px',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                    {name}
                  </span>
                </div>
              ),
          )}
        </div>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
        }}
      >
        <p style={{ color: theme.colors.text }}>
          This demo shows how theme modes work. The colors change based on the selected mode.
        </p>
        <p style={{ color: theme.colors.textSecondary, marginTop: '8px' }}>
          The mode is persisted in localStorage and will be remembered on page refresh.
        </p>
      </div>
    </div>
  );
};

// Story wrapper with ThemeProvider
const ThemeHelperDemo = () => {
  return (
    <ThemeProvider theme={themeWithModes}>
      <ThemeDemoComponent />
    </ThemeProvider>
  );
};

// Override colors demo
const OverrideColorsDemo = () => {
  const customTheme = overrideColors(defaultTheme, {
    primary: '#00ff00',
    secondary: '#ff00ff',
    background: '#1a1a1a',
    text: '#ffffff',
  });

  return (
    <ThemeProvider theme={customTheme}>
      <div style={{ padding: '24px', backgroundColor: customTheme.colors.background }}>
        <h2 style={{ color: customTheme.colors.primary }}>Override Colors Demo</h2>
        <p style={{ color: customTheme.colors.text }}>
          This theme has custom primary (green) and secondary (magenta) colors.
        </p>
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: customTheme.colors.secondary + '20',
            border: `2px solid ${customTheme.colors.secondary}`,
            borderRadius: '8px',
          }}
        >
          <p style={{ color: customTheme.colors.text }}>
            The overrideColors function makes it easy to create theme variations.
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
};

// Storybook meta
const meta: Meta = {
  title: 'IndustryTheme/ThemeHelpers',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ModesDemo: Story = {
  render: () => <ThemeHelperDemo />,
};

export const OverrideColors: Story = {
  render: () => <OverrideColorsDemo />,
};

export const MakeThemeDemo: Story = {
  render: () => {
    const customTheme = makeTheme(defaultTheme, {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#45b7d1',
      },
      fonts: {
        body: 'Comic Sans MS, cursive',
      },
    });

    return (
      <ThemeProvider theme={customTheme}>
        <div style={{ padding: '24px', backgroundColor: customTheme.colors.background }}>
          <h2
            style={{
              color: customTheme.colors.primary,
              fontFamily: customTheme.fonts.heading,
            }}
          >
            Make Theme Demo
          </h2>
          <p
            style={{
              color: customTheme.colors.text,
              fontFamily: customTheme.fonts.body,
            }}
          >
            This theme was created using makeTheme with custom colors and fonts.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <div
              style={{
                padding: '16px',
                backgroundColor: customTheme.colors.primary,
                color: customTheme.colors.background,
                borderRadius: '8px',
              }}
            >
              Primary
            </div>
            <div
              style={{
                padding: '16px',
                backgroundColor: customTheme.colors.secondary,
                color: customTheme.colors.background,
                borderRadius: '8px',
              }}
            >
              Secondary
            </div>
            <div
              style={{
                padding: '16px',
                backgroundColor: customTheme.colors.accent,
                color: customTheme.colors.background,
                borderRadius: '8px',
              }}
            >
              Accent
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  },
};
