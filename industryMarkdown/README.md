# Industry-themed Markdown Components

This module provides markdown components that use the Theme UI spec-compliant industryTheme system instead of the legacy theme system.

## Usage

```tsx
import {
  IndustryMarkdownSlide,
  ThemeProvider,
  defaultTheme as industryTheme,
} from 'themed-markdown';

function App() {
  return (
    <ThemeProvider theme={industryTheme} initialColorMode="dark">
      <IndustryMarkdownSlide
        content="# Hello World\nThis is a slide using industryTheme!"
        slideIdPrefix="slide"
        slideIndex={0}
        isVisible={true}
        theme={industryTheme}
        autoFocusOnVisible={false}
      />
    </ThemeProvider>
  );
}
```

> **Note:** All components accept a `theme` prop. `DocumentView` requires you to pass a theme explicitly. Other components will fall back to `defaultTheme` if one is not provided, but passing your active theme explicitly keeps styling predictable.

Set `autoFocusOnVisible` to `false` to opt out of the default behavior that moves focus (and potentially scrolls) to the slide when it becomes visible.

## Key Differences from ConfigurableMarkdownSlide

1. **Theme System**: Uses Theme UI spec-compliant industryTheme instead of the legacy theme system
2. **Direct Implementation**: All markdown components are implemented directly using industryTheme values
3. **Modern Architecture**: Built for consistency with industry standards
4. **Clean Separation**: No mixing of theme systems
5. **Theme UI Spec**: Uses arrays for spacing, font sizes, and other scale values (e.g., `theme.space[4]` instead of `theme.spacing.md`)

## Available Components

### Core Components

- `IndustryMarkdownSlide` - Main markdown slide component with full markdown rendering capabilities
- `createIndustryMarkdownComponents` - Factory function to create markdown components with industryTheme

### Modal Components

- `IndustryHtmlModal` - Modal for rendering HTML content
- `IndustryPlaceholderModal` - Modal for filling prompt placeholders
- `IndustryMermaidModal` - Modal for displaying Mermaid diagrams with zoom capabilities
- `IndustryZoomableMermaidDiagram` - Zoomable Mermaid diagram component

### Diagram Components

- `IndustryLazyMermaidDiagram` - Lazy-loaded Mermaid diagram with intersection observer

### Hooks

- `useIndustryHtmlModal` - Hook for managing HTML modal state

### Theme System

- `ThemeProvider` - Theme context provider
- `industryTheme` - Default Theme UI spec-compliant theme object

## Theme Structure

The industryTheme follows Theme UI specifications:

```typescript
{
  colors: {
    text: string,
    background: string,
    primary: string,
    // ... more colors
  },
  space: number[], // [0, 4, 8, 16, 32, ...]
  fonts: {
    body: string,
    heading: string,
    monospace: string
  },
  fontSizes: number[], // [12, 14, 16, 18, ...]
  // ... more theme properties
}
```

## Migration Guide

To migrate from `ConfigurableMarkdownSlide` to `IndustryMarkdownSlide`:

1. Replace the import:

   ```tsx
   // Old
   import { ConfigurableMarkdownSlide } from 'some-old-package';

   // New
   import { IndustryMarkdownSlide } from 'themed-markdown';
   ```

2. Update the theme provider:

   ```tsx
   // Old
   import { ThemeProvider, darkTheme } from 'some-old-package';

   // New
   import { ThemeProvider, defaultTheme as industryTheme } from 'themed-markdown';
   ```

3. Component props remain largely the same, but theme-related props work differently.
