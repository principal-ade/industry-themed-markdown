import { ThemeProvider, theme as defaultTheme, regalTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DocumentView } from './DocumentView';

const meta: Meta<typeof DocumentView> = {
  title: 'IndustryMarkdown/DocumentView/MapcnReadme',
  component: DocumentView,
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
  args: {
    theme: defaultTheme,
    repositoryInfo: {
      owner: 'AnmolSaini16',
      repo: 'mapcn',
      branch: 'main',
    },
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

// Pulled from https://github.com/AnmolSaini16/mapcn (main branch) README.md
const mapcnReadme = `<h1 align="center">mapcn</h1>

<p align="center">
  Free & open-source, ready-to-use, customizable map components for React.<br/>
  Zero config. One command setup. Built on <a href="https://maplibre.org/">MapLibre GL</a>, styled with <a href="https://tailwindcss.com/">Tailwind</a>, works seamlessly with <a href="https://ui.shadcn.com/">shadcn/ui</a>.
</p>

<p align="center">
  <a href="https://mapcn.dev/docs">Get Started</a> ·
  <a href="https://mapcn.dev/docs/installation">Installation</a> ·
  <a href="https://mapcn.dev/docs/basic-map">Components</a>
</p>

<br />

<p align="center">
  <a href="https://vercel.com/oss">
    <img alt="Vercel OSS Program" src="https://img.shields.io/badge/Vercel-OSS-black?logo=vercel&style=flat-square" />
  </a>
</p>

<p align="center">
  <img src="public/banner.png" alt="mapcn banner" />
</p>

## Features

- 🎨 **Theme-aware** — Automatically adapts to light/dark mode
- 🎯 **Zero config** — Works out of the box with sensible defaults
- 📦 **shadcn/ui compatible** — Uses the same patterns and styling conventions
- 🗺️ **MapLibre GL powered** — Full access to MapLibre's powerful mapping capabilities
- 🧩 **Composable** — Build complex map UIs with simple, declarative components
- 📍 **Markers & Popups** — Rich marker system with popups, tooltips, and labels
- 🛤️ **Routes** — Draw routes and paths on your maps
- 🎮 **Controls** — Zoom, compass, locate, and fullscreen controls

## Basemap Terms of Service

This project uses [CARTO Basemaps](https://docs.carto.com/faqs/carto-basemaps) which are based on OpenStreetMap data.

- **Commercial use**: Requires a CARTO Enterprise license. [Request a demo](https://carto.com/request-live-demo) for pricing details.
- **Non-commercial use**: Free for CARTO grantees under their [basemap terms](https://carto.com/legal/bmap).
- **Alternative**: You can switch to [OpenStreetMap](https://www.openstreetmap.org/) tiles or any other MapLibre-compatible tile provider (MapTiler, Stadia Maps, etc).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Star History

<a href="https://www.star-history.com/#AnmolSaini16/mapcn&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=AnmolSaini16/mapcn&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=AnmolSaini16/mapcn&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=AnmolSaini16/mapcn&type=date&legend=top-left" />
 </picture>
</a>
`;

export const Default: Story = {
  args: {
    content: mapcnReadme,
    maxWidth: '900px',
    slideIdPrefix: 'mapcn-readme',
    onLinkClick: (href, event) => {
      console.log('Link clicked:', href);
      if (event) event.preventDefault();
    },
  },
};

export const Wide: Story = {
  args: {
    content: mapcnReadme,
    maxWidth: '1400px',
    slideIdPrefix: 'mapcn-readme-wide',
  },
};

export const RegalTheme: Story = {
  args: {
    content: mapcnReadme,
    maxWidth: '900px',
    slideIdPrefix: 'mapcn-readme-regal',
    theme: regalTheme,
  },
};
