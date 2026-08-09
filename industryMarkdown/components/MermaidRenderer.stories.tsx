import defaultTheme, {
  iceTangerineTheme,
  Theme,
  ThemeProvider,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { IndustryMermaidDiagram, MermaidRenderer } from './IndustryMermaidDiagram';

const flowchartCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`;

const sequenceCode = `sequenceDiagram
    participant U as User
    participant A as API
    participant D as Database

    U->>A: GET /api/data
    A->>D: Query database
    D-->>A: Return results
    A-->>U: JSON response`;

const pieCode = `pie title Stack Distribution
    "TypeScript" : 35
    "React" : 25
    "Node.js" : 20
    "Other" : 20`;

const meta: Meta<typeof IndustryMermaidDiagram> = {
  title: 'IndustryMarkdown/MermaidRenderer',
  component: IndustryMermaidDiagram,
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    id: 'renderer-demo',
    code: flowchartCode,
  },
};

export default meta;
type Story = StoryObj<typeof IndustryMermaidDiagram>;

/** `renderer="auto"` (default) — flowcharts render with beautiful-mermaid. */
export const AutoFlowchart: Story = {
  args: {
    id: 'auto-flowchart',
    code: flowchartCode,
  },
};

/** Forced mermaid.js for the same diagram — the classic dagre layout. */
export const ForcedMermaid: Story = {
  args: {
    id: 'forced-mermaid',
    code: flowchartCode,
    renderer: 'mermaid',
  },
};

/** Forced beautiful-mermaid — ELK layout, theme-colored accents. */
export const ForcedBeautiful: Story = {
  args: {
    id: 'forced-beautiful',
    code: flowchartCode,
    renderer: 'beautiful',
  },
};

export const Sequence: Story = {
  args: {
    id: 'sequence',
    code: sequenceCode,
    renderer: 'beautiful',
  },
};

/**
 * Unsupported diagram types (pie, mindmap, gitGraph, gantt, ...) fall back to
 * mermaid.js in `auto` mode — this pie chart still renders via mermaid.js.
 */
export const UnsupportedFallsBackToMermaid: Story = {
  args: {
    id: 'pie-auto',
    code: pieCode,
  },
};

const themeOptions: Record<string, Theme> = {
  'Default (dark)': defaultTheme,
  'Ice Tangerine (light)': iceTangerineTheme,
};

const rendererOptions: MermaidRenderer[] = ['auto', 'mermaid', 'beautiful'];

/**
 * Side-by-side comparison of the two renderers with a theme switcher, so the
 * beautiful-mermaid color mapping can be eyeballed across themes.
 */
export const RendererComparison: Story = {
  args: {
    id: 'comparison',
  },
  render: () => {
    const [themeName, setThemeName] = useState(Object.keys(themeOptions)[0]);
    const [renderer, setRenderer] = useState<MermaidRenderer>('beautiful');
    const theme = themeOptions[themeName];

    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <label>
            Theme{' '}
            <select value={themeName} onChange={e => setThemeName(e.target.value)}>
              {Object.keys(themeOptions).map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Renderer{' '}
            <select value={renderer} onChange={e => setRenderer(e.target.value as MermaidRenderer)}>
              {rendererOptions.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <IndustryMermaidDiagram
          id="comparison-diagram"
          code={flowchartCode}
          theme={theme}
          renderer={renderer}
        />
      </div>
    );
  },
};
