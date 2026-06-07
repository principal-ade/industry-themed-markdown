import {
  ThemeProvider,
  theme as defaultTheme,
  regalTheme,
  matrixTheme,
  slateTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DocumentView } from './DocumentView';

/**
 * Print-preview harness for DocumentView.
 *
 * Storybook runs in a browser, so it can't exercise Electron's
 * `webContents.printToPDF` (a main-process API). Instead the "Export PDF"
 * button calls `window.print()`, which drives the SAME Chromium print engine
 * that printToPDF uses. So whatever you see in the browser's print dialog here
 * is what the Electron export will produce — this is the place to tune page
 * breaks, `@media print` rules, and the A4 page frame.
 *
 * The on-screen view renders the document inside an A4-width "page" so you can
 * eyeball the layout without printing. The `@media print` block forces natural
 * height / visible overflow so the whole document paginates instead of being
 * clipped to one scroll viewport (the same effect the package's `disableScroll`
 * prop gives, but applied purely via print CSS so no package change is needed).
 */

// A4 at 96dpi ≈ 794px wide. Letter ≈ 816px.
const A4_WIDTH_PX = 794;

const PrintStyles: React.FC = () => (
  <style>{`
    /* On-screen page frame so the preview reads like paper */
    .pdf-page {
      width: ${A4_WIDTH_PX}px;
      margin: 24px auto;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.18);
    }

    /* The floating toolbar — never include it in the printed output */
    .pdf-toolbar { position: fixed; top: 16px; right: 16px; z-index: 1000; }

    @media print {
      /* Hide Storybook chrome + our toolbar */
      .pdf-toolbar { display: none !important; }

      /* Let the document expand to its natural height across pages.
         DocumentView/IndustryMarkdownSlide normally live in an
         overflow:auto, height:100% box — override that for print. */
      .pdf-page, .pdf-page * {
        overflow: visible !important;
        max-height: none !important;
      }
      .pdf-page { width: auto; margin: 0; box-shadow: none; }
      html, body { height: auto !important; }

      /* Keep headings with their content; don't split code/tables/diagrams */
      h1, h2, h3 { break-after: avoid-page; }
      pre, table, blockquote, .mermaid, [data-mermaid] {
        break-inside: avoid;
      }
    }

    /* Page size + margins for the generated PDF */
    @page { size: A4; margin: 16mm; }
  `}</style>
);

interface PreviewProps {
  content: string;
  theme: typeof defaultTheme;
}

const PrintPreview: React.FC<PreviewProps> = ({ content, theme }) => (
  <ThemeProvider theme={theme}>
    <PrintStyles />

    <div className="pdf-toolbar">
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          padding: '10px 16px',
          fontFamily: theme.fonts.body,
          fontSize: 14,
          fontWeight: 600,
          color: theme.colors.textOnPrimary,
          background: theme.colors.primary,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        Export PDF
      </button>
    </div>

    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background: theme.colors.backgroundLight ?? '#e5e5e5',
      }}
    >
      <div
        className="pdf-page"
        style={{ background: theme.colors.background }}
      >
        <DocumentView
          content={content}
          theme={theme}
          maxWidth={A4_WIDTH_PX}
          autoFocusOnVisible={false}
          enableKeyboardScrolling={false}
          transparentBackground={false}
        />
      </div>
    </div>
  </ThemeProvider>
);

const sampleContent = `# Quarterly Engineering Report

A faithful PDF export should look exactly like this on-screen render.

## Summary

The **DocumentView** component renders this document with the same theme,
fonts, and syntax highlighting used inside the app. Clicking **Export PDF**
runs \`window.print()\` — choose *Save as PDF* in the dialog.

## Code

\`\`\`typescript
async function exportPdf(win: BrowserWindow) {
  const data = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
  });
  return data; // the Electron equivalent of this preview
}
\`\`\`

## A long table to force pagination

| # | Area | Owner | Status |
|---|------|-------|--------|
| 1 | Rendering | A. Dev | ✅ |
| 2 | Theming | B. Dev | ✅ |
| 3 | Mermaid | C. Dev | 🚧 |
| 4 | Export | D. Dev | 🚧 |

## A Mermaid diagram

\`\`\`mermaid
flowchart LR
  MD[Markdown] --> DV[DocumentView]
  DV --> Print[window.print / printToPDF]
  Print --> PDF[(PDF)]
\`\`\`

## Lorem to push past one page

${Array.from({ length: 12 })
  .map(
    (_, i) =>
      `### Section ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
      `Phasellus ut lacus a sapien tincidunt aliquet. Curabitur non nulla sit amet ` +
      `nisl tempus convallis quis ac lectus.\n`,
  )
  .join('\n')}
`;

const meta: Meta<typeof PrintPreview> = {
  title: 'IndustryMarkdown/DocumentView Print',
  component: PrintPreview,
  parameters: { layout: 'fullscreen' },
  args: { content: sampleContent, theme: defaultTheme },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RegalTheme: Story = { args: { theme: regalTheme } };

export const MatrixTheme: Story = { args: { theme: matrixTheme } };

export const SlateTheme: Story = { args: { theme: slateTheme } };
