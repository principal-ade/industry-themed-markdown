import { theme } from '@principal-ade/industry-theme';
import { parseMarkdownIntoPresentation } from '@principal-ade/markdown-utils';
import type { Meta, StoryObj } from '@storybook/react';

import { SlidePresentationDiff } from './SlidePresentationDiff';

const meta: Meta<typeof SlidePresentationDiff> = {
  title: 'Components/SlidePresentationDiff',
  component: SlidePresentationDiff,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SlidePresentationDiff>;

// Sample markdown presentations for testing
const beforeMarkdown = `
## Introduction

Welcome to our presentation about React components.

This is the first slide.

## Core Concepts

React is a JavaScript library for building user interfaces.

Key features:
- Component-based
- Declarative
- Learn once, write anywhere

## State Management

State allows components to create and manage their own data.

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

## Props

Props are arguments passed into React components.

Props are passed to components via HTML attributes.

## Conclusion

Thank you for attending this presentation!

Questions?
`.trim();

const afterMarkdown = `
## Introduction to React

Welcome to our updated presentation about React components and hooks.

This is the improved first slide with more detail.

## Core Concepts

React is a powerful JavaScript library for building user interfaces.

Key features:
- Component-based architecture
- Declarative programming
- Learn once, write anywhere
- Virtual DOM for performance

## State Management with Hooks

State allows components to create and manage their own data.

Using the useState hook:

\`\`\`javascript
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1);
\`\`\`

## Effects and Side Effects

The useEffect hook lets you perform side effects in function components.

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Props

Props are arguments passed into React components.

Props are passed to components via HTML attributes and are read-only.

## Conclusion

Thank you for attending this presentation!

Questions? Feel free to ask!
`.trim();

const minimalBeforeMarkdown = `
## Slide 1

Original content

## Slide 2

More original content
`.trim();

const minimalAfterMarkdown = `
## Slide 1

Modified content

## Slide 2

More original content

## Slide 3

Brand new slide
`.trim();

const noChangesMarkdown = `
## Slide 1

Content that stays the same

## Slide 2

More unchanging content
`.trim();

export const BasicDiff: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(beforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(afterMarkdown, 'after'),
    theme: theme,
  },
};

export const MinimalDiff: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(minimalBeforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(minimalAfterMarkdown, 'after'),
    theme: theme,
  },
};

export const OnlyChangedSlides: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(beforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(afterMarkdown, 'after'),
    theme: theme,
    showOnlyChanged: true,
  },
};

export const NoChanges: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(noChangesMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(noChangesMarkdown, 'after'),
    theme: theme,
  },
};

const onlyAdditionsAfter = `
${beforeMarkdown}

## New Slide 1

This is a new slide

## New Slide 2

Another new slide
`.trim();

export const OnlyAdditions: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(beforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(onlyAdditionsAfter, 'after'),
    theme: theme,
  },
};

const onlyDeletionsBefore = `
${beforeMarkdown}

## Extra Slide 1

This will be deleted

## Extra Slide 2

This will also be deleted
`.trim();

export const OnlyDeletions: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(onlyDeletionsBefore, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(beforeMarkdown, 'after'),
    theme: theme,
  },
};

const complexBeforeMarkdown = `
## Slide A

Content A

## Slide B

Content B

## Slide C

Content C

## Slide D

Content D

## Slide E

Content E
`.trim();

const complexAfterMarkdown = `
## Slide A

Modified content A

## Slide C

Content C

## Slide D

Modified content D

## Slide E

Content E

## Slide F

Brand new content F
`.trim();

export const ComplexChanges: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(complexBeforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(complexAfterMarkdown, 'after'),
    theme: theme,
  },
};

const mermaidBeforeMarkdown = `
## Architecture Overview

Here's our system architecture:

\`\`\`mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
\`\`\`

## Data Flow

Data flows through the system
`.trim();

const mermaidAfterMarkdown = `
## Architecture Overview

Here's our updated system architecture:

\`\`\`mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
    C --> E[(Database)]
    D --> E[(Database)]
\`\`\`

## Data Flow

Data flows through the system with caching

\`\`\`mermaid
graph LR
    A[Request] --> B[Cache]
    B --> C[Database]
\`\`\`
`.trim();

export const WithMermaidDiagrams: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(mermaidBeforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(mermaidAfterMarkdown, 'after'),
    theme: theme,
  },
};

export const WithCallback: Story = {
  args: {
    beforePresentation: parseMarkdownIntoPresentation(beforeMarkdown, 'before'),
    afterPresentation: parseMarkdownIntoPresentation(afterMarkdown, 'after'),
    theme: theme,
    onSlideChange: (beforeIndex, afterIndex) => {
      console.log('Slide changed:', { beforeIndex, afterIndex });
    },
  },
};
