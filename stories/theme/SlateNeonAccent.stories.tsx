import {
  ThemeProvider,
  contrastRatio,
  overrideColors,
  slateNeonTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { IndustryMarkdownSlide } from '../../industryMarkdown/components/IndustryMarkdownSlide';

const markdown = `## Accent in real markdown

Call \`resolveTheme()\` with \`config.theme.accent\` to update the preview.

Read [the source](./src/index.ts) or [the theme guide](./README.md).
External links like [documentation](https://example.com) stay orange.

### Dense technical prose

Set \`backgroundColor\` and \`textOnAccent\` before calling \`renderMarkdown()\`.
The \`ThemeProvider\` supplies context, while the \`theme\` prop controls this slide.

| Setting | Value |
| --- | --- |
| Accent token | \`colors.accent\` |
| Entry point | [src/index.ts](./src/index.ts) |
`;

const formatContrast = (foreground: string, background: string) => {
  const ratio = contrastRatio(foreground, background);
  return ratio === null
    ? 'Contrast unavailable'
    : `${ratio.toFixed(2)}:1 (${ratio >= 4.5 ? 'AA pass' : 'AA fail'} for normal text)`;
};

const AccentPreview = ({ accent, label }: { accent: string; label: string }) => {
  // Only override the accent; keep the package theme and other semantic colors intact.
  const theme = overrideColors(slateNeonTheme, { accent });

  return (
    <ThemeProvider theme={theme}>
      <section
        aria-label={label}
        style={{
          background: theme.colors.background,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii[3],
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{label}</h2>
          <p style={{ margin: '0 0 16px', color: theme.colors.textMuted }}>
            {accent} · {formatContrast(accent, theme.colors.background)}
          </p>
          <p style={{ color: accent, fontSize: 16, lineHeight: 1.6 }}>
            A full sentence in green shows how much attention the accent draws during reading.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {[12, 14, 16, 18].map(fontSize => (
              <span key={fontSize} style={{ color: accent, fontSize }}>
                {fontSize}px: Theme resolved, ready to render.
              </span>
            ))}
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Small metadata with <span style={{ color: accent }}>accent emphasis</span> should remain
            readable without overpowering nearby text.
          </p>
          <button
            type="button"
            style={{
              background: accent,
              color: theme.colors.textOnAccent,
              border: 0,
              borderRadius: theme.radii[2],
              padding: '8px 12px',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          >
            Accent button sample
          </button>
          <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
            Button text: {formatContrast(theme.colors.textOnAccent, accent)}
          </p>
        </div>
        <IndustryMarkdownSlide
          content={markdown}
          theme={theme}
          slideIdPrefix={`accent-${accent.replace('#', '')}`}
          slideIndex={0}
          isVisible={true}
          disableScroll={true}
          enableKeyboardScrolling={false}
          autoFocusOnVisible={false}
          enableHtmlPopout={false}
          onLinkClick={() => {}}
        />
      </section>
    </ThemeProvider>
  );
};

const AccentStories = ({ accent, compare }: { accent: string; compare: boolean }) => (
  <div
    style={{
      minHeight: '100vh',
      boxSizing: 'border-box',
      padding: 24,
      background: slateNeonTheme.colors.background,
      color: slateNeonTheme.colors.text,
      fontFamily: slateNeonTheme.fonts.body,
      lineHeight: 1.6,
    }}
  >
    <h1 style={{ marginTop: 0 }}>Slate Neon accent study</h1>
    <p>
      Story-only overrides. Compare emphasis, small text, inline code, internal link pills, and
      button labels. Orange external links and neutral body text stay unchanged.
    </p>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 20,
      }}
    >
      {compare ? (
        <>
          <AccentPreview label="Original neon" accent={slateNeonTheme.colors.accent} />
          <AccentPreview label="Soft green" accent="#7ccf9a" />
          <AccentPreview label="Muted sage" accent="#94bfa2" />
        </>
      ) : (
        <AccentPreview label="Custom accent" accent={accent} />
      )}
    </div>
  </div>
);

const meta = {
  title: 'IndustryTheme/Slate Neon Accent',
  component: AccentStories,
  parameters: { layout: 'fullscreen' },
  args: { accent: '#7ccf9a', compare: false },
  argTypes: {
    accent: { control: 'color', description: 'Local override of colors.accent only.' },
    compare: { control: false, table: { disable: true } },
  },
} satisfies Meta<typeof AccentStories>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  args: { compare: true },
};

export const Playground: Story = {};
