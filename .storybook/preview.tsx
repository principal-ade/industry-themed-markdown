import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider, slateNeonTheme } from '@principal-ade/industry-theme';
import 'highlight.js/styles/atom-one-dark.css';

// Dynamically import mermaid for Storybook
if (typeof window !== 'undefined') {
  import('mermaid').then(mermaidModule => {
    (window as Window & { mermaid?: typeof mermaidModule.default }).mermaid = mermaidModule.default;
  });
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#1a1a1a',
        }
      }
    },
  },

  decorators: [
    Story => {
      // Default to Slate Neon — the theme the electron app resolves to in dev
      // (`ThemeService` defaults to `slateNeon` and `getThemeByName` falls back
      // to it). Keeps Storybook color-accurate with the app, including the
      // theme-driven mermaid/diagram palette.
      return (
        <ThemeProvider theme={slateNeonTheme} initialMode="light">
          <Story />
        </ThemeProvider>
      );
    },
  ],

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light Theme', icon: 'sun' },
          { value: 'dark', title: 'Dark Theme', icon: 'moon' },
        ],
        showName: true,
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
