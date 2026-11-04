import { ThemeProvider, slateNeonTheme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

const CONTENT = `# Highlight-to-copy demo

Highlight any text in this slide. When the flag is on, the settled selection
is copied to the clipboard automatically and the callback fires.

Try it with the flag on, then toggle it off and confirm nothing is copied.

- First bullet for multi-word selections.
- Second bullet for cross-block highlights.

> A quote block. Selecting across this quote and the list above copies the
> rendered plain text.
`;

function HighlightCopyDemo({ enabled }: { enabled: boolean }) {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <IndustryMarkdownSlide
        content={CONTENT}
        slideIdPrefix="highlight-copy-demo"
        slideIndex={0}
        isVisible
        theme={defaultTheme}
        enableHighlightCopy={enabled}
        onCopyText={text =>
          setLog(prev => [`Copied ${text.length} chars: ${JSON.stringify(text.slice(0, 60))}…`, ...prev])
        }
      />

      <div
        style={{
          position: 'fixed',
          left: 16,
          top: 16,
          padding: '6px 10px',
          background: 'rgba(20, 20, 28, 0.92)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 12,
          borderRadius: 6,
          zIndex: 1000,
        }}
      >
        enableHighlightCopy: <strong>{String(enabled)}</strong>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          width: 320,
          maxHeight: '60vh',
          overflow: 'auto',
          padding: 12,
          background: 'rgba(20, 20, 28, 0.92)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 11,
          borderRadius: 6,
          zIndex: 1000,
        }}
      >
        <strong>Copy log</strong>
        {log.length === 0 ? (
          <div style={{ opacity: 0.6, marginTop: 8 }}>Highlight text to copy.</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{ marginTop: 8, wordBreak: 'break-word' }}>
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof HighlightCopyDemo> = {
  title: 'Industry/IndustryMarkdownSlide/Highlight Copy',
  component: HighlightCopyDemo,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HighlightCopyDemo>;

/** Flag on: settling a highlight auto-copies it. */
export const Enabled: Story = {
  render: () => <HighlightCopyDemo enabled />,
};

/** Flag off (default): highlighting never copies. */
export const Disabled: Story = {
  render: () => <HighlightCopyDemo enabled={false} />,
};
