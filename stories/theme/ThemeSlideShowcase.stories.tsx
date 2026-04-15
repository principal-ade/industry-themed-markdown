import {
  ThemeProvider,
  terminalTheme,
  regalTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SlidePresentation } from '../../industryMarkdown/components/SlidePresentation';

// Sample slides array
const slides = [
  `# Theme Showcase
## Exploring Different Visual Styles

See how different themes transform the same content.`,

  `# Typography Example

## Heading Level 2
### Heading Level 3

Regular paragraph text demonstrates the body font choice. Each theme brings its own personality through typography, colors, and spacing.

**Bold text** and *italic text* show emphasis styles.`,

  `# Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return {
    message: "Welcome",
    timestamp: Date.now()
  };
}
\`\`\`

Inline code like \`const x = 42\` also follows the theme.`,

  `# Lists and Structure

## Unordered List
- First item
- Second item with **emphasis**
- Third item with \`code\`

## Ordered List
1. Step one
2. Step two
3. Step three`,

  `# Table Example

| Feature | Terminal | Regal | Glassmorphism |
|---------|----------|-------|---------------|
| Font | Monospace | Mixed | Sans-serif |
| Colors | Minimal | Rich | Transparent |
| Style | Developer | Academic | Modern |
| Mood | Clean | Elegant | Futuristic |`,

  `# Blockquote

> "Design is not just what it looks like and feels like. Design is how it works."
>
> — Steve Jobs

Different themes interpret quotes differently.`,

  `# Interactive Elements

Buttons and interactive components adapt to each theme's style:

- Primary actions use the theme's primary color
- Secondary actions use muted colors
- Hover states follow theme conventions`,

  `# Thank You

Each theme tells a different story.

Choose the one that matches your voice.`,
];

// Terminal theme slides
const TerminalSlides = () => (
  <div style={{ width: '100%', height: '100vh', backgroundColor: terminalTheme.colors.background }}>
    <ThemeProvider theme={terminalTheme}>
      <SlidePresentation slides={slides} containerHeight="100%" theme={terminalTheme} />
    </ThemeProvider>
  </div>
);

// Regal theme slides
const RegalSlides = () => (
  <div style={{ width: '100%', height: '100vh', backgroundColor: regalTheme.colors.background }}>
    <ThemeProvider theme={regalTheme}>
      <SlidePresentation slides={slides} containerHeight="100%" theme={regalTheme} />
    </ThemeProvider>
  </div>
);


// Storybook meta
const meta: Meta = {
  title: 'IndustryTheme/Theme Slides Comparison',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Terminal: Story = {
  render: () => <TerminalSlides />,
};

export const Regal: Story = {
  render: () => <RegalSlides />,
};
