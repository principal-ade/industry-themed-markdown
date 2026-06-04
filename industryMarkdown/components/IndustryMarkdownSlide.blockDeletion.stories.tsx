import { ThemeProvider } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

const INITIAL_CONTENT = `# Block deletion demo

Highlight any text in this slide. The highlight snaps to the top-level block
it touches and a floating **Delete** button appears. Clicking it removes that
block from the markdown and emits the updated content.

## How it works

- Each rendered block is tagged with its source line range.
- A highlight resolves to the outermost block(s) it overlaps.
- Deleting splices those lines out of the slide content.

Hover a bullet above (or a number below) — it turns into an ✕. Click it to
delete just that item.

1. First numbered step.
2. Second numbered step.
3. Third numbered step.

> Selecting inside this quote resolves to the whole quote.

\`\`\`ts
// Selecting any line here resolves to the whole code block.
const answer = 42;
console.log(answer);
\`\`\`

Try deleting this paragraph, then the list, then the code block.
`;

function BlockDeletionDemo({ mode }: { mode: 'block' | 'text' }) {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [log, setLog] = useState<string[]>([]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <IndustryMarkdownSlide
        content={content}
        slideIdPrefix="block-deletion-demo"
        slideIndex={0}
        isVisible
        selectableBlocks
        deletionMode={mode}
        onContentChange={setContent}
        onDeleteBlocks={info =>
          setLog(prev => [
            `Removed: ${JSON.stringify(info.removedText.slice(0, 40))}…`,
            ...prev,
          ])
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
        deletionMode: <strong>{mode}</strong>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          width: 300,
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
        <strong>Deletion log</strong>
        {log.length === 0 ? (
          <div style={{ opacity: 0.6, marginTop: 8 }}>Nothing deleted yet.</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{ marginTop: 8, wordBreak: 'break-word' }}>
              {entry}
            </div>
          ))
        )}
        <button
          type="button"
          onClick={() => setContent(INITIAL_CONTENT)}
          style={{
            marginTop: 12,
            padding: '4px 10px',
            fontSize: 11,
            border: '1px solid #888',
            background: 'transparent',
            color: 'white',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Reset content
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof BlockDeletionDemo> = {
  title: 'Industry/IndustryMarkdownSlide/Block Deletion',
  component: BlockDeletionDemo,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof BlockDeletionDemo>;

/** Highlight resolves to the whole top-level block. */
export const BlockMode: Story = {
  render: () => <BlockDeletionDemo mode="block" />,
};

/** Highlight removes exactly the selected text, mapped back to the source. */
export const TextMode: Story = {
  render: () => <BlockDeletionDemo mode="text" />,
};
