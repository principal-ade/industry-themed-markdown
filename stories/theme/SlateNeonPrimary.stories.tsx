import {
  ThemeProvider,
  contrastRatio,
  overrideColors,
  slateNeonTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { IndustryMarkdownSlide } from '../../industryMarkdown/components/IndustryMarkdownSlide';

const markdown = `## Primary in real markdown

Read the [documentation](https://example.com/docs), check the
[release notes](https://example.com/releases), or [contact support](mailto:help@example.com).

Inline code like \`resolveTheme()\` and [internal links](./src/index.ts)
keep the original green accent.

### Dense link text

Review the [installation guide](https://example.com/install) before opening the
[configuration reference](https://example.com/config) and [API overview](https://example.com/api).

### Prompt placeholders

\`\`\`prompt
Summarize {{repository}} and explain the changes in {{filePath}}.
\`\`\`
`;

const formatContrast = (foreground: string, background: string) => {
  const ratio = contrastRatio(foreground, background);
  return ratio === null
    ? 'Contrast unavailable'
    : `${ratio.toFixed(2)}:1 (${ratio >= 4.5 ? 'AA pass' : 'AA fail'} for normal text)`;
};

const PrimaryPreview = ({ primary, label }: { primary: string; label: string }) => {
  const theme = overrideColors(slateNeonTheme, { primary });

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
            {primary} · {formatContrast(primary, theme.colors.background)}
          </p>
          <p style={{ color: primary, fontSize: 16, lineHeight: 1.6 }}>
            A full sentence in the primary color shows how much attention it draws during reading.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {[12, 14, 16, 18].map(fontSize => (
              <span key={fontSize} style={{ color: primary, fontSize }}>
                {fontSize}px: Documentation and release notes.
              </span>
            ))}
          </div>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Small metadata with <span style={{ color: primary }}>primary emphasis</span> should
            remain readable without overpowering nearby text.
          </p>
          <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
            On highlight surface: {formatContrast(primary, theme.colors.highlight)}
          </p>
          {[
            { label: 'Semantic button text', color: theme.colors.textOnPrimary },
            { label: 'Hardcoded white text', color: '#ffffff' },
          ].map(button => (
            <div key={button.label} style={{ marginTop: 12 }}>
              <button
                type="button"
                style={{
                  background: primary,
                  color: button.color,
                  border: 0,
                  borderRadius: theme.radii[2],
                  padding: '8px 12px',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              >
                {button.label}
              </button>
              <p style={{ color: theme.colors.textMuted, fontSize: 14 }}>
                {formatContrast(button.color, primary)}
              </p>
            </div>
          ))}
        </div>
        <IndustryMarkdownSlide
          content={markdown}
          theme={theme}
          slideIdPrefix={`primary-${primary.replace('#', '')}`}
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

const PrimaryStories = ({ primary, compare }: { primary: string; compare: boolean }) => (
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
    <h1 style={{ marginTop: 0 }}>Slate Neon primary study</h1>
    <p>
      Story-only overrides of colors.primary. Compare small text, external links, prompt
      placeholders, and button labels. Green accents, neutral text, and secondary colors stay
      unchanged.
    </p>
    <p>
      Button samples compare textOnPrimary with the hardcoded white used by the Render HTML button.
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
          <PrimaryPreview label="Original orange" primary={slateNeonTheme.colors.primary} />
          <PrimaryPreview label="Soft peach" primary="#e6a080" />
          <PrimaryPreview label="Muted terracotta" primary="#cf987e" />
        </>
      ) : (
        <PrimaryPreview label="Custom primary" primary={primary} />
      )}
    </div>
  </div>
);

const meta = {
  title: 'IndustryTheme/Slate Neon Primary',
  component: PrimaryStories,
  parameters: { layout: 'fullscreen' },
  args: { primary: '#e6a080', compare: false },
  argTypes: {
    primary: { control: 'color', description: 'Local override of colors.primary only.' },
    compare: { control: false, table: { disable: true } },
  },
} satisfies Meta<typeof PrimaryStories>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  args: { compare: true },
};

export const Playground: Story = {};
