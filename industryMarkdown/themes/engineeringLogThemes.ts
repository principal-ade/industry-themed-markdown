/**
 * Engineering Log themes
 *
 * Two looks for engineering-log style markdown, defined here in-repo while the
 * aesthetic is being refined. Both are Theme UI spec-compliant and expose a
 * light base with a `dark` mode so the same theme works for day/blueprint
 * reading and night/terminal reading.
 *
 * - `engineeringLogTheme`  — Tech / service manual: blueprint grid, sharp
 *   90° corners, condensed technical headers, drafting-orange accents.
 * - `engineeringPaperTheme` — White engineering paper: warm paper background,
 *   typewriter monospace body, faint gridline borders, redline-pen accents.
 */

import type { Theme } from '@principal-ade/industry-theme';

// Engineering-log themes carry one extra color role that the shared Theme
// interface doesn't know about: `backgroundGrid`, the faint graph-paper grid
// painted behind framed mermaid diagrams. Components read it defensively and
// ignore it when absent, so it survives the mode/merge helpers (which spread
// `colors` wholesale) untouched.
type EngineeringLogColors = Theme['colors'] & { backgroundGrid: string };

// Shared scale values (identical across both themes; only colors, fonts,
// radii, and shadows differ).
const space: Theme['space'] = [0, 4, 8, 16, 32, 64, 128, 256, 512];
const fontSizes: Theme['fontSizes'] = [12, 14, 16, 18, 20, 24, 32, 48, 64, 96];
const fontWeights: Theme['fontWeights'] = {
  body: 400,
  heading: 600,
  bold: 700,
  light: 300,
  medium: 500,
  semibold: 600,
};
const lineHeights: Theme['lineHeights'] = {
  body: 1.6,
  heading: 1.3,
  tight: 1.25,
  relaxed: 1.75,
};
const breakpoints: Theme['breakpoints'] = ['640px', '768px', '1024px', '1280px'];
const sizes: Theme['sizes'] = [16, 32, 64, 128, 256, 512, 768, 1024, 1536];
const zIndices: Theme['zIndices'] = [0, 1, 10, 20, 30, 40, 50];

// ---------------------------------------------------------------------------
// Tech / Service Manual
// ---------------------------------------------------------------------------
//
// Blueprint-influenced: a light drafting-table blue base with technical blue
// ink, drafting-orange (redline) accents, and square corners throughout.

export const engineeringLogTheme: Theme = {
  space,
  fontSizes,
  fontScale: 1.0,
  fontWeights,
  lineHeights,
  breakpoints,
  sizes,
  zIndices,

  fonts: {
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading:
      '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    monospace: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
  },

  // Sharp 90° corners — drafting, not rounded cards.
  radii: [0, 0, 0, 0, 0, 0, 0, 0],

  shadows: [
    'none',
    '0 1px 2px 0 rgba(18, 41, 66, 0.12)',
    '0 1px 0 0 rgba(18, 41, 66, 0.08)',
    '0 2px 4px 0 rgba(18, 41, 66, 0.14)',
    '0 4px 8px 0 rgba(18, 41, 66, 0.16)',
    '0 8px 16px 0 rgba(18, 41, 66, 0.2)',
  ],

  colors: {
    // Base colors — light blueprint paper
    text: '#1a2b3c', // Technical ink
    background: '#f2f6fb', // Light drafting-table blue
    primary: '#1e5aa8', // Blueprint blue
    secondary: '#16477e', // Deeper blueprint blue
    accent: '#d9750a', // Drafting orange (redline)
    highlight: '#e3edf8', // Blue highlight
    muted: '#d9e3ef', // Muted blue-grey

    // Status colors
    success: '#2f7d4f', // Engineering green
    warning: '#b57a10', // Caution amber
    error: '#b5372f', // Safety red
    info: '#1e5aa8', // Blueprint blue

    // Additional semantic colors
    border: '#b8cbe0', // Gridline blue
    backgroundSecondary: '#eaf1f8', // Slightly deeper table
    backgroundTertiary: '#e1ebf5', // Even deeper table
    backgroundLight: '#f9fbfd', // Near-white
    backgroundDark: '#e2ebf4', // Container backdrop
    backgroundHover: '#e0ebf7', // Blue hover
    surface: '#ffffff', // White card
    textSecondary: '#33475b', // Dark slate
    textTertiary: '#5a6f84', // Mid slate
    textMuted: '#7c90a3', // Faded slate

    // Search highlight colors
    highlightBg: '#ffedd4', // Orange-tinted highlight
    highlightBorder: '#d9750a', // Drafting-orange border

    // Faint graph-paper grid behind framed mermaid diagrams
    backgroundGrid: '#9db9d8',

    // Text on primary background
    textOnPrimary: '#ffffff', // White on blueprint blue
    textOnSecondary: '#ffffff', // White on deeper blue
    textOnAccent: '#0c1b29', // Dark navy on drafting orange
  } as EngineeringLogColors,

  modes: {
    dark: {
      // Base colors — blueprint at night
      text: '#d7e3ee', // Light blueprint ink
      background: '#0c1620', // Deep blueprint navy
      primary: '#4d8fd6', // Lighter blueprint blue
      secondary: '#69a3e0', // Hover blue
      accent: '#f0a050', // Brighter drafting orange
      highlight: '#16273a', // Navy highlight
      muted: '#1a2c40', // Muted navy

      // Status colors
      success: '#4c9a6b',
      warning: '#d9a23e',
      error: '#e06057',
      info: '#4d8fd6',

      // Additional semantic colors
      border: '#22364a', // Dim navy gridline
      backgroundSecondary: '#101e2c', // Slightly lighter navy
      backgroundTertiary: '#15273a', // Even lighter navy
      backgroundLight: '#0a131c', // Deeper navy
      backgroundDark: '#081018', // Container backdrop
      backgroundHover: '#1a3050', // Blue hover
      surface: '#12202e', // Navy surface
      textSecondary: '#9db4c9', // Light slate
      textTertiary: '#6f879e', // Mid slate
      textMuted: '#567083', // Faded slate

      // Search highlight colors
      highlightBg: '#3a2a10', // Dark orange tint
      highlightBorder: '#d9750a', // Drafting-orange border

      // Faint graph-paper grid behind framed mermaid diagrams
      backgroundGrid: '#2c4a66',

      // Text on primary background
      textOnPrimary: '#081018', // Navy on lighter blue
      textOnSecondary: '#081018', // Navy on hover blue
      textOnAccent: '#0c1620', // Navy on drafting orange
    } as EngineeringLogColors,
  },

  buttons: {
    primary: {
      color: '#ffffff',
      bg: 'primary',
      borderWidth: 0,
      '&:hover': {
        bg: 'secondary',
      },
    },
    secondary: {
      color: 'primary',
      bg: 'transparent',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'primary',
      '&:hover': {
        bg: 'highlight',
      },
    },
    ghost: {
      color: 'text',
      bg: 'transparent',
      '&:hover': {
        bg: 'backgroundHover',
      },
    },
  },

  text: {
    heading: {
      fontFamily: 'heading',
      fontWeight: 'heading',
      lineHeight: 'heading',
    },
    body: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
    },
    caption: {
      fontSize: 1,
      color: 'textSecondary',
    },
  },

  cards: {
    primary: {
      bg: 'surface',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: 0,
    },
    secondary: {
      bg: 'backgroundSecondary',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// White Engineering Paper
// ---------------------------------------------------------------------------
//
// The paper feel: a warm white manila base, typewriter monospace body, faint
// gridline borders, and a redline-pen accent for emphasis.

export const engineeringPaperTheme: Theme = {
  space,
  fontSizes,
  fontScale: 1.0,
  fontWeights,
  lineHeights,
  breakpoints,
  sizes,
  zIndices,

  fonts: {
    body: '"Courier Prime", "Courier New", "Courier", "Lucida Console", monospace',
    heading: '"Courier Prime", "Courier New", "Courier", "Lucida Console", monospace',
    monospace: '"Courier Prime", "Courier New", "Courier", "Lucida Console", monospace',
  },

  // Slightly rounded — a fresh notepad, not machine-cut metal.
  radii: [0, 2, 2, 2, 2, 4, 6, 8],

  shadows: [
    'none',
    '0 1px 2px 0 rgba(60, 45, 20, 0.08)',
    '0 1px 3px 0 rgba(60, 45, 20, 0.1)',
    '0 2px 5px 0 rgba(60, 45, 20, 0.12)',
    '0 4px 8px 0 rgba(60, 45, 20, 0.14)',
    '0 8px 16px 0 rgba(60, 45, 20, 0.18)',
  ],

  colors: {
    // Base colors — warm white paper
    text: '#212121', // Ink
    background: '#fbf9f2', // Warm manila paper
    primary: '#2459a6', // Engineering pen blue
    secondary: '#1c4785', // Darker pen blue
    accent: '#c8453a', // Redline pen
    highlight: '#f0ead8', // Pencil tint
    muted: '#e9e3d2', // Pencil grey

    // Status colors
    success: '#3f7d4e', // Fountain green
    warning: '#b8860b', // Pencil gold
    error: '#c8453a', // Redline red
    info: '#2459a6', // Pen blue

    // Additional semantic colors
    border: '#d5cfc0', // Faint gridline
    backgroundSecondary: '#f4f0e4', // Slightly deeper paper
    backgroundTertiary: '#ece6d6', // Even deeper paper
    backgroundLight: '#ffffff', // Pure white
    backgroundDark: '#f4f1e7', // Container backdrop
    backgroundHover: '#efe9d8', // Pencil hover
    surface: '#ffffff', // White card
    textSecondary: '#4a4a4a', // Dark pencil
    textTertiary: '#6e6e6e', // Mid pencil
    textMuted: '#8d8d8d', // Faded pencil

    // Search highlight colors
    highlightBg: '#fff1c9', // Yellow highlighter
    highlightBorder: '#e0a63c', // Stronger highlighter

    // Faint graph-paper grid behind framed mermaid diagrams
    backgroundGrid: '#b7cbe8',

    // Text on primary background
    textOnPrimary: '#ffffff', // White on pen blue
    textOnSecondary: '#ffffff', // White on darker pen blue
    textOnAccent: '#ffffff', // White on redline red
  } as EngineeringLogColors,

  modes: {
    dark: {
      // Base colors — dark ink pad
      text: '#d8d3c5', // Warm off-white
      background: '#161513', // Dark paper
      primary: '#6b9ad9', // Lighter pen blue
      secondary: '#88ace3', // Hover blue
      accent: '#e07066', // Brighter redline
      highlight: '#26231d', // Dark pencil tint
      muted: '#2b2822', // Dark pencil grey

      // Status colors
      success: '#5da370',
      warning: '#d3a23f',
      error: '#e07066',
      info: '#6b9ad9',

      // Additional semantic colors
      border: '#3a352c', // Faint dark gridline
      backgroundSecondary: '#1e1c18', // Slightly lighter paper
      backgroundTertiary: '#27231d', // Even lighter paper
      backgroundLight: '#121110', // Deeper paper
      backgroundDark: '#100f0d', // Container backdrop
      backgroundHover: '#2b2620', // Pencil hover
      surface: '#201d18', // Dark card
      textSecondary: '#b3ac9c', // Light pencil
      textTertiary: '#857e70', // Mid pencil
      textMuted: '#6a6356', // Faded pencil

      // Search highlight colors
      highlightBg: '#4a3a12', // Dark highlighter
      highlightBorder: '#e0a63c', // Stronger highlighter

      // Faint graph-paper grid behind framed mermaid diagrams
      backgroundGrid: '#45423a',

      // Text on primary background
      textOnPrimary: '#161513', // Dark paper on lighter blue
      textOnSecondary: '#161513', // Dark paper on hover blue
      textOnAccent: '#161513', // Dark paper on brighter redline
    } as EngineeringLogColors,
  },

  buttons: {
    primary: {
      color: '#ffffff',
      bg: 'primary',
      borderWidth: 0,
      '&:hover': {
        bg: 'secondary',
      },
    },
    secondary: {
      color: 'primary',
      bg: 'transparent',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'primary',
      '&:hover': {
        bg: 'highlight',
      },
    },
    ghost: {
      color: 'text',
      bg: 'transparent',
      '&:hover': {
        bg: 'backgroundHover',
      },
    },
  },

  text: {
    heading: {
      fontFamily: 'heading',
      fontWeight: 'heading',
      lineHeight: 'heading',
    },
    body: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
    },
    caption: {
      fontSize: 1,
      color: 'textSecondary',
    },
  },

  cards: {
    primary: {
      bg: 'surface',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: 2,
    },
    secondary: {
      bg: 'backgroundSecondary',
      border: '1px solid',
      borderColor: 'border',
      borderRadius: 2,
    },
  },
};
