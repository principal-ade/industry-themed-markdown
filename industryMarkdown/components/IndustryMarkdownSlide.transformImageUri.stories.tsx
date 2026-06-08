import { ThemeProvider } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

/**
 * Demonstrates the `transformImageUri` host hook: the markdown references images
 * by an opaque `asset://<hash>` scheme, and the host resolves each hash to a
 * real (here, inline data-URL) image at render time. This mirrors how the
 * electron-app / web-ade resolve topic-image assets stored off the description.
 */
const meta: Meta<typeof IndustryMarkdownSlide> = {
  title: 'IndustryMarkdown/IndustryMarkdownSlide/transformImageUri',
  component: IndustryMarkdownSlide,
  decorators: [
    Story => (
      <ThemeProvider>
        <div style={{ height: '100vh', width: '100%' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// A tiny inline SVG, base64-encoded, standing in for stored asset bytes.
const svg = (label: string, color: string) =>
  `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">` +
      `<rect width="100%" height="100%" fill="${color}"/>` +
      `<text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="20" ` +
      `text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
  )}`;

// Host-owned asset table, keyed by content hash — the shape of a topic sidecar.
const assetTable: Record<string, string> = {
  abc123: svg('asset://abc123', '#2563eb'),
  def456: svg('asset://def456', '#16a34a'),
};

const transformImageUri = (src: string): string => {
  const match = src.match(/^asset:\/\/(.+)$/);
  if (match) return assetTable[match[1]] ?? src;
  return ''; // fall through to built-in resolution for non-asset URLs
};

export const ResolvesAssetScheme: Story = {
  args: {
    content: `# Topic with attached screenshots

Two images referenced by \`asset://\` hash, resolved by the host:

![Button primary](asset://abc123)

![Button secondary](asset://def456)

A regular external image still renders normally:

![External](https://placehold.co/320x120/orange/white?text=external)
`,
    slideIdPrefix: 'asset-story',
    slideIndex: 0,
    isVisible: true,
    transformImageUri,
  },
};

export const UnresolvedAssetFallsThrough: Story = {
  args: {
    content: `# Unknown asset

This hash is not in the host table, so the \`asset://\` src is left as-is
(renders as a broken image rather than throwing):

![Missing](asset://unknown999)
`,
    slideIdPrefix: 'asset-story-missing',
    slideIndex: 0,
    isVisible: true,
    transformImageUri,
  },
};
