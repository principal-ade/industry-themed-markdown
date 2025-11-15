import { ThemeProvider, useTheme, glassmorphismTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Glassmorphism showcase component
const GlassmorphismShowcase = () => {
  const { theme, mode, setMode } = useTheme();

  // CSS for backdrop filter (blur effect)
  const glassStyle = {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)', // Safari support
  };

  const strongGlassStyle = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', // Safari support
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px',
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            ...strongGlassStyle,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '24px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: theme.shadows[2],
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              marginBottom: '16px',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Glassmorphism Theme
          </h1>
          <p
            style={{
              fontSize: '1.2rem',
              color: theme.colors.textSecondary,
              marginBottom: '24px',
            }}
          >
            Showcasing transparency, blur effects, and modern glass aesthetics
          </p>

          {/* Mode switcher */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setMode('')}
              style={{
                ...glassStyle,
                padding: '12px 24px',
                backgroundColor: !mode ? theme.colors.primary : theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
            >
              Light Glass
            </button>
            <button
              onClick={() => setMode('dark')}
              style={{
                ...glassStyle,
                padding: '12px 24px',
                backgroundColor: mode === 'dark' ? theme.colors.primary : theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
            >
              Dark Glass
            </button>
            <button
              onClick={() => setMode('frosted')}
              style={{
                ...glassStyle,
                padding: '12px 24px',
                backgroundColor: mode === 'frosted' ? theme.colors.primary : theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
              }}
            >
              Frosted Glass
            </button>
          </div>
        </div>

        {/* Grid of glass cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* Transparency levels */}
          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.backgroundLight,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>
              Light Transparency
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>
              backgroundLight: {theme.colors.backgroundLight}
            </p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              Subtle glass effect for overlays
            </p>
          </div>

          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>Base Transparency</h3>
            <p style={{ color: theme.colors.textSecondary }}>
              background: {theme.colors.background}
            </p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              Standard glass background
            </p>
          </div>

          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>Surface Glass</h3>
            <p style={{ color: theme.colors.textSecondary }}>surface: {theme.colors.surface}</p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              For card and panel surfaces
            </p>
          </div>

          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.backgroundSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>Secondary Glass</h3>
            <p style={{ color: theme.colors.textSecondary }}>
              backgroundSecondary: {theme.colors.backgroundSecondary}
            </p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              Slightly more opaque
            </p>
          </div>

          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.backgroundTertiary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>Tertiary Glass</h3>
            <p style={{ color: theme.colors.textSecondary }}>
              backgroundTertiary: {theme.colors.backgroundTertiary}
            </p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              Most opaque glass level
            </p>
          </div>

          <div
            style={{
              ...strongGlassStyle,
              backgroundColor: theme.colors.backgroundHover,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ color: theme.colors.primary, marginBottom: '12px' }}>Hover State Glass</h3>
            <p style={{ color: theme.colors.textSecondary }}>
              backgroundHover: {theme.colors.backgroundHover}
            </p>
            <p style={{ color: theme.colors.textTertiary, fontSize: '14px', marginTop: '8px' }}>
              Stronger blur for interactions
            </p>
          </div>
        </div>

        {/* Components showcase */}
        <div
          style={{
            ...glassStyle,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
          }}
        >
          <h2 style={{ color: theme.colors.primary, marginBottom: '24px' }}>Glass Components</h2>

          {/* Buttons */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px', fontSize: '1.2rem' }}>
              Buttons with Glass Effect
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                style={{
                  ...glassStyle,
                  padding: '12px 24px',
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                }}
              >
                Primary Glass
              </button>

              <button
                style={{
                  ...glassStyle,
                  padding: '12px 24px',
                  backgroundColor: theme.colors.secondary,
                  color: 'white',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                }}
              >
                Secondary Glass
              </button>

              <button
                style={{
                  ...glassStyle,
                  padding: '12px 24px',
                  backgroundColor: theme.colors.accent,
                  color: 'white',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                }}
              >
                Accent Glass
              </button>

              <button
                style={{
                  ...glassStyle,
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: theme.colors.primary,
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: theme.fonts.body,
                  fontWeight: 500,
                }}
              >
                Outlined Glass
              </button>
            </div>
          </div>

          {/* Status badges */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px', fontSize: '1.2rem' }}>
              Status Indicators
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span
                style={{
                  ...glassStyle,
                  padding: '6px 12px',
                  backgroundColor: theme.colors.success,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Success
              </span>

              <span
                style={{
                  ...glassStyle,
                  padding: '6px 12px',
                  backgroundColor: theme.colors.warning,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Warning
              </span>

              <span
                style={{
                  ...glassStyle,
                  padding: '6px 12px',
                  backgroundColor: theme.colors.error,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Error
              </span>

              <span
                style={{
                  ...glassStyle,
                  padding: '6px 12px',
                  backgroundColor: theme.colors.info,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Info
              </span>
            </div>
          </div>

          {/* Text hierarchy */}
          <div>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px', fontSize: '1.2rem' }}>
              Text Transparency Levels
            </h3>
            <p style={{ color: theme.colors.text, marginBottom: '8px' }}>
              Primary text: {theme.colors.text}
            </p>
            <p style={{ color: theme.colors.textSecondary, marginBottom: '8px' }}>
              Secondary text: {theme.colors.textSecondary}
            </p>
            <p style={{ color: theme.colors.textTertiary, marginBottom: '8px' }}>
              Tertiary text: {theme.colors.textTertiary}
            </p>
            <p style={{ color: theme.colors.textMuted }}>Muted text: {theme.colors.textMuted}</p>
          </div>
        </div>

        {/* Nested glass cards */}
        <div
          style={{
            ...strongGlassStyle,
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '20px',
            padding: '32px',
          }}
        >
          <h2 style={{ color: theme.colors.primary, marginBottom: '24px' }}>Nested Glass Layers</h2>
          <div
            style={{
              ...glassStyle,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ color: theme.colors.text, marginBottom: '12px' }}>First Layer</h3>
            <div
              style={{
                ...glassStyle,
                backgroundColor: theme.colors.backgroundLight,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h4 style={{ color: theme.colors.textSecondary, marginBottom: '8px' }}>
                Second Layer
              </h4>
              <p style={{ color: theme.colors.textTertiary, fontSize: '14px' }}>
                Multiple glass layers create depth and hierarchy while maintaining transparency
                throughout the design.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper with animated gradient background
const GlassmorphismWithBackground = () => {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
        backgroundSize: '400% 400%',
        animation: 'gradient 15s ease infinite',
      }}
    >
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <ThemeProvider theme={glassmorphismTheme}>
        <GlassmorphismShowcase />
      </ThemeProvider>
    </div>
  );
};

// Wrapper with mesh gradient
const GlassmorphismWithMesh = () => {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: `
        radial-gradient(at 40% 20%, hsla(280, 100%, 74%, 1) 0px, transparent 50%),
        radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 1) 0px, transparent 50%),
        radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%),
        radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 1) 0px, transparent 50%),
        radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 1) 0px, transparent 50%),
        radial-gradient(at 80% 100%, hsla(242, 100%, 70%, 1) 0px, transparent 50%),
        radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 1) 0px, transparent 50%)
      `,
        backgroundColor: '#13111c',
      }}
    >
      <ThemeProvider theme={glassmorphismTheme}>
        <GlassmorphismShowcase />
      </ThemeProvider>
    </div>
  );
};

// Storybook meta
const meta: Meta = {
  title: 'IndustryTheme/Glassmorphism',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatedGradient: Story = {
  render: () => <GlassmorphismWithBackground />,
};

export const MeshGradient: Story = {
  render: () => <GlassmorphismWithMesh />,
};
