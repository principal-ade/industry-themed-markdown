import { ThemeProvider, useTheme, theme as defaultTheme, addMode } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SlidePresentation } from './SlidePresentation';

// Create a theme with multiple modes using the new theme helpers
const themeWithAllModes = addMode(
  addMode(
    addMode(
      addMode(
        addMode(defaultTheme, 'preview', {
          // Preview mode - Warm, rich colors with parchment background
          text: '#361B1B',
          background: '#F6F2EA',
          primary: '#0D3B4A',
          secondary: '#EFCF83',
          accent: '#AA5725',
          highlight: '#F6DEB9',
          muted: '#8A837A',
          border: '#C7B9A3',
          surface: '#FFFFFF',
          backgroundSecondary: '#EDE9E0',
          backgroundTertiary: '#DBCEB8',
          backgroundLight: '#FFFFFF',
          backgroundHover: '#E9E4DB',
          textSecondary: '#5C4B4B',
          textTertiary: '#8A837A',
          textMuted: '#B0A79A',
        }),
        'alexandria',
        {
          // Alexandria mode - Minimalist with OKLCH colors
          text: '#252525',
          background: '#faf9f7',
          primary: '#343434',
          secondary: '#f7f7f7',
          accent: '#f7f7f7',
          muted: '#f7f7f7',
          border: '#ebebeb',
          surface: '#faf9f7',
          backgroundSecondary: '#faf9f7',
          backgroundTertiary: '#f7f7f7',
          backgroundLight: '#f7f7f7',
          backgroundHover: '#f7f7f7',
          textSecondary: '#8e8e8e',
          textTertiary: '#8e8e8e',
          textMuted: '#8e8e8e',
        },
      ),
      'dark',
      {
        // Dark mode with amber accents
        text: '#e4e4e7',
        background: '#18181b',
        primary: '#f59e0b',
        secondary: '#1f2937',
        accent: '#d97706',
        highlight: 'rgba(245, 158, 11, 0.2)',
        muted: '#71717a',
        border: '#27272a',
        surface: '#1f1f23',
        backgroundSecondary: '#1f1f23',
        backgroundTertiary: '#27272a',
        backgroundLight: '#27272a',
        backgroundHover: '#2a2a2e',
        textSecondary: '#a1a1aa',
        textTertiary: '#71717a',
        textMuted: '#52525b',
      },
    ),
    'cyberpunk',
    {
      // Cyberpunk neon colors
      text: '#f0abfc',
      background: '#0a0a0a',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      highlight: 'rgba(0, 255, 255, 0.3)',
      muted: '#4a5568',
      border: '#ff00ff40',
      surface: '#1a1a1a',
      backgroundSecondary: '#141414',
      backgroundTertiary: '#1f1f1f',
      backgroundLight: '#2a2a2a',
      backgroundHover: '#333333',
      textSecondary: '#d8b4fe',
      textTertiary: '#a78bfa',
      textMuted: '#8b5cf6',
    },
  ),
  'high-contrast',
  {
    // High contrast mode
    text: '#000000',
    background: '#FFFFFF',
    primary: '#0000FF',
    secondary: '#FF0000',
    accent: '#00FF00',
    border: '#000000',
    muted: '#666666',
    textSecondary: '#333333',
    textTertiary: '#666666',
    textMuted: '#999999',
  },
);

// List of available modes
const availableModes = [
  { value: '', label: 'Default' },
  { value: 'preview', label: 'Preview' },
  { value: 'alexandria', label: 'Alexandria' },
  { value: 'dark', label: 'Dark' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'high-contrast', label: 'High Contrast' },
];

// Interactive wrapper component with theme switcher
interface SlidePresentationWithThemeSwitcherProps {
  slides: string[];
  initialSlide?: number;
  showNavigation?: boolean;
  showSlideCounter?: boolean;
  showFullscreenButton?: boolean;
  slideIdPrefix?: string;
  onSlideChange?: (slideIndex: number) => void;
  onCheckboxChange?: (slideIndex: number, lineNumber: number, checked: boolean) => void;
  onLinkClick?: (href: string, event?: MouseEvent) => void;
  containerHeight?: string;
}

const SlidePresentationWithThemeSwitcher = ({
  slides,
  ...props
}: SlidePresentationWithThemeSwitcherProps) => {
  const { theme, mode, setMode } = useTheme();

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Theme Switcher Controls */}
      <div
        style={{
          padding: '16px',
          backgroundColor: theme.colors.backgroundSecondary,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            color: theme.colors.text,
            fontWeight: 600,
            marginRight: '8px',
          }}
        >
          Theme Mode:
        </span>

        {/* Mode buttons */}
        {availableModes.map(modeOption => (
          <button
            key={modeOption.value}
            onClick={() => setMode(modeOption.value)}
            style={{
              padding: '8px 16px',
              backgroundColor:
                (mode || '') === modeOption.value ? theme.colors.primary : theme.colors.background,
              color:
                (mode || '') === modeOption.value ? theme.colors.background : theme.colors.text,
              border: `2px solid ${
                (mode || '') === modeOption.value ? theme.colors.primary : theme.colors.border
              }`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: (mode || '') === modeOption.value ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if ((mode || '') !== modeOption.value) {
                e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
              }
            }}
            onMouseLeave={e => {
              if ((mode || '') !== modeOption.value) {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
          >
            {modeOption.label}
          </button>
        ))}

        {/* Current mode info */}
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '14px',
            color: theme.colors.textSecondary,
          }}
        >
          Current: <strong>{mode || 'default'}</strong>
        </div>
      </div>

      {/* Slide Presentation */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SlidePresentation slides={slides} {...props} theme={theme} />
      </div>
    </div>
  );
};

// Wrapper component with ThemeProvider
const SlidePresentationWithThemeWrapper = (props: SlidePresentationWithThemeSwitcherProps) => {
  return (
    <ThemeProvider theme={themeWithAllModes}>
      <SlidePresentationWithThemeSwitcher {...props} />
    </ThemeProvider>
  );
};

const meta: Meta<typeof SlidePresentation> = {
  title: 'IndustryMarkdown/SlidePresentationWithThemeSwitcher',
  component: SlidePresentationWithThemeWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    initialSlide: {
      control: { type: 'number', min: 0, max: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const demoSlides = [
  `# Theme Switcher Demo
  
## Dynamic Theme Support

This presentation demonstrates the ability to switch between different themes dynamically.

### Available Theme Modes:
- **Default** - Dark Academia with warm amber gold
- **Preview** - Warm, rich colors with parchment background
- **Alexandria** - Minimalist with OKLCH colors
- **Dark** - Classic dark mode with amber accents
- **Cyberpunk** - Neon colors on black background
- **High Contrast** - Maximum contrast for accessibility

### Features:
- Live theme switching
- Dark mode toggle
- Persistent navigation controls
- Smooth transitions

Use the controls above to switch themes and see the changes in real-time!`,

  `# Typography & Colors

## Heading Styles

### Primary Colors
The primary color changes based on the selected theme.

### Secondary Colors
Secondary colors provide accent and emphasis.

### Text Hierarchy
- Primary text for main content
- Secondary text for supporting information
- Muted text for less important details

\`\`\`javascript
// Code blocks adapt to theme colors
function greetUser(name) {
  return \`Hello, \${name}! Welcome to themed presentations.\`;
}
\`\`\`

> Blockquotes also inherit theme styles for consistency.`,

  `# Tables & Lists

## Data Presentation

| Feature | Default | Preview | Alexandria | Dark | Cyberpunk | High Contrast |
|---------|---------|---------|------------|------|-----------|---------------|
| Background | Dark Navy | Parchment | Off-white | Black | Pure Black | White |
| Primary | Amber Gold | Deep Teal | Minimal Gray | Amber | Cyan Neon | Blue |
| Accent | Muted Gold | Terracotta | Light Gray | Dark Amber | Yellow Neon | Green |
| Text | Warm Cream | Dark Brown | Dark Gray | Light Gray | Purple-Pink | Black |

### Theme Characteristics

1. **Default Theme**
   - Dark academia aesthetic
   - Warm amber gold accents
   - Deep midnight blue background

2. **Preview Theme**
   - Rich, warm colors
   - Parchment-like background
   - Terracotta and ochre accents

3. **Alexandria Theme**
   - Minimalist design
   - OKLCH color space
   - High contrast

4. **Dark Theme**
   - Classic dark mode
   - Amber accent colors
   - Easy on the eyes
   - Perfect for low-light environments

5. **Cyberpunk Theme**
   - Neon color scheme
   - High contrast neon on black
   - Futuristic aesthetic
   - Bold and vibrant

6. **High Contrast**
   - Maximum contrast ratios
   - WCAG AAA compliant
   - Accessibility focused
   - Clear visual separation`,

  `# Mermaid Diagrams

## Visual Elements

\`\`\`mermaid
graph TD
    A[User Selects Theme] --> B{Theme Type}
    B -->|Default| C[Dark Academia]
    B -->|Preview| D[Warm Rich Colors]
    B -->|Alexandria| E[Minimalist]
    B -->|Dark| H[Classic Dark Mode]
    B -->|Cyberpunk| I[Neon Aesthetic]
    B -->|High Contrast| J[Maximum Contrast]
    C --> F[Apply Theme]
    D --> F
    E --> F
    H --> F
    I --> F
    J --> F
    F --> G[Update UI]
\`\`\`

## Theme Flow

\`\`\`mermaid
sequenceDiagram
    participant User
    participant ThemeProvider
    participant Component
    
    User->>ThemeProvider: Select Theme
    ThemeProvider->>ThemeProvider: Update Context
    ThemeProvider->>Component: Propagate Theme
    Component->>User: Render with New Theme
\`\`\``,

  `# Interactive Elements

## Checkboxes and Tasks

Try interacting with these elements in different themes:

- [ ] Test default mode
- [ ] Test preview mode
- [ ] Test alexandria mode
- [ ] Test dark mode
- [ ] Test cyberpunk mode
- [ ] Test high contrast mode
- [ ] Check navigation controls
- [ ] Verify color contrast
- [ ] Test theme persistence

### Links and Actions

- [Documentation](#) - Theme documentation
- [Source Code](#) - View implementation
- [Examples](#) - More theme examples

### Code Examples

\`\`\`typescript
interface ThemeColors {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

type ThemeMode = 'light' | 'dark';
\`\`\``,

  `# Summary

## Theme System Benefits

### Flexibility
- Multiple pre-configured themes
- Easy theme switching
- Dark mode support

### Consistency
- Unified color system
- Consistent typography
- Coherent visual hierarchy

### Accessibility
- High contrast options
- Readable text colors
- Clear visual indicators

### Developer Experience
- Type-safe theme definitions
- Easy customization
- Theme provider pattern

---

*Switch between themes using the controls above to see how this presentation adapts!*`,
];

export const ThemeSwitcherDemo: Story = {
  args: {
    slides: demoSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    slideIdPrefix: 'theme-demo',
  },
};

export const MinimalThemeSwitcher: Story = {
  args: {
    slides: [
      `# Minimal Theme Demo

This story shows the theme switcher with minimal navigation controls.

## Key Points

- Theme buttons remain visible
- Dark mode toggle available
- Simplified slide navigation
- Clean, focused presentation

Try switching themes to see how the minimal layout adapts!`,

      `# Second Slide

Content adapts to the selected theme while maintaining readability.

### Features
- Clean typography
- Consistent spacing
- Theme-aware colors
- Smooth transitions`,
    ],
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: false,
    showFullscreenButton: false,
    slideIdPrefix: 'minimal-theme',
  },
};
