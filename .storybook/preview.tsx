import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider, theme } from '@principal-ade/industry-theme';
import 'highlight.js/styles/atom-one-dark.css';
import '@principal-ade/panels/dist/panels.css';

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
      return (
        <ThemeProvider theme={theme}>
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
