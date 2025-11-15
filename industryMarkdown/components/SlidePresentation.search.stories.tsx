import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SlidePresentation } from './SlidePresentation';

const meta = {
  title: 'Industry/SlidePresentation/Search',
  component: SlidePresentation,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <div style={{ height: '100vh', width: '100vw' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  args: {
    theme: defaultTheme,
  },
} satisfies Meta<typeof SlidePresentation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample slides with searchable content
const searchableSlides = [
  `# Introduction to React

React is a **JavaScript library** for building user interfaces.

## Key Features
- Component-based architecture
- Virtual DOM for performance
- Declarative programming style
- Rich ecosystem`,

  `# State Management

Managing state is crucial in React applications.

## Options Available
- useState Hook
- useReducer Hook
- Context API
- Redux
- MobX
- Zustand

Each has its own use cases and trade-offs.`,

  `# React Hooks

Hooks let you use state and other React features without writing a class.

## Common Hooks
- \`useState\` - for component state
- \`useEffect\` - for side effects
- \`useContext\` - for context values
- \`useReducer\` - for complex state
- \`useMemo\` - for expensive computations
- \`useCallback\` - for function memoization`,

  `# Performance Optimization

React provides several ways to optimize performance:

## Techniques
1. **Memoization** with React.memo
2. **Code splitting** with lazy loading
3. **Virtual DOM** reconciliation
4. **Batch updates** for state changes
5. **useCallback** and **useMemo** hooks

Performance is key for user experience.`,

  `# Testing React Components

Testing ensures your components work as expected.

## Testing Libraries
- Jest for unit testing
- React Testing Library
- Enzyme (deprecated)
- Cypress for E2E testing

Write tests for:
- Component rendering
- User interactions
- State changes
- API calls`,

  `# React and TypeScript

TypeScript adds static typing to React applications.

## Benefits
- Type safety
- Better IDE support
- Easier refactoring
- Self-documenting code
- Catch errors at compile time

\`\`\`typescript
interface Props {
  name: string;
  age: number;
}

const Component: React.FC<Props> = ({ name, age }) => {
  return <div>{name} is {age} years old</div>;
};
\`\`\``,

  `# Deployment Strategies

Deploy your React app to production.

## Hosting Options
- **Vercel** - Zero config deployments
- **Netlify** - Great for static sites
- **AWS** - Full control with S3/CloudFront
- **Heroku** - Easy PaaS solution
- **GitHub Pages** - Free for public repos

Each platform has different strengths for React apps.`,

  `# Conclusion

React continues to evolve with new features and patterns.

## Key Takeaways
- React makes UI development declarative
- Performance optimization is built-in
- Strong ecosystem and community
- TypeScript integration is seamless
- Testing is a first-class concern

Thank you for joining this presentation on React!`,
];

export const WithSearch: Story = {
  args: {
    slides: searchableSlides,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    containerHeight: '100%',
  },
};

export const SearchInstructions: Story = {
  args: {
    slides: [
      `# Search Functionality Demo

## How to use search:

1. Press **Cmd+F** (Mac) or **Ctrl+F** (Windows/Linux) to open search
2. Type your search term (e.g., "React", "hooks", "performance")
3. See matching slides highlighted with match counts
4. Navigate results:
   - **Tab** or **Enter**: Next result
   - **Shift+Tab**: Previous result
   - **Click** on a result pill to jump directly
5. Press **Escape** to close search

Try searching for common terms like:
- "React" (appears in multiple slides)
- "hooks" (specific to certain slides)
- "performance" (focused topic)
- "TypeScript" (single slide match)`,
      ...searchableSlides,
    ],
    showNavigation: true,
    showSlideCounter: true,
    initialSlide: 0,
  },
};

export const LongPresentation: Story = {
  args: {
    slides: [
      `# Long Presentation Test

This presentation has many slides to test search across large content.

Press **Cmd/Ctrl + F** to search across all ${20} slides.`,
      ...Array.from(
        { length: 19 },
        (_, i) => `# Slide ${i + 2}

## Content for slide ${i + 2}

This is slide number ${i + 2} of the presentation.

Some unique content for searching:
- ${i % 3 === 0 ? 'JavaScript' : ''}
- ${i % 4 === 0 ? 'TypeScript' : ''}
- ${i % 5 === 0 ? 'React' : ''}
- ${i % 2 === 0 ? 'Performance' : 'Testing'}

\`\`\`js
const slideNumber = ${i + 2};
console.log('This is slide ' + slideNumber);
\`\`\`

More text to make the slide longer and provide more search targets.
The quick brown fox jumps over the lazy dog.`,
      ),
    ],
    showNavigation: true,
    showSlideCounter: true,
  },
};

export const NoResults: Story = {
  args: {
    slides: [
      `# Search with No Results

Try searching for something that doesn't exist in any slide.

For example:
- "Flutter"
- "Angular"
- "Vue"
- "Svelte"

The search bar will show "No results" when nothing matches.`,
      `# Another Slide

This slide has different content to search through.

But it won't match the terms suggested in the first slide.`,
    ],
    showNavigation: true,
    showSlideCounter: true,
  },
};
