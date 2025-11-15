import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { SlidePresentationBook } from './SlidePresentationBook';

const meta: Meta<typeof SlidePresentationBook> = {
  title: 'IndustryMarkdown/SlidePresentationBook',
  component: SlidePresentationBook,
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
  },
  argTypes: {
    viewMode: {
      control: { type: 'radio' },
      options: ['single', 'book'],
    },
    initialSlide: {
      control: { type: 'number', min: 0, max: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const presentationSlides = [
  `# Chapter 1: Introduction

## Welcome to Our Story

This is the beginning of our journey through markdown presentations. In book mode, you'll see two pages side by side, just like reading a real book.

### Key Features
- **Book Layout**: Two slides displayed simultaneously
- **Natural Reading**: Left-to-right page flow
- **Smart Navigation**: Pages turn together
- **Keyboard Support**: Arrow keys for navigation

Press **Next** or use **Right Arrow** to turn the page.`,

  `# Understanding the Layout

## The Book Metaphor

When viewing in book mode, presentations feel more natural and familiar:

- **Left page**: Even-numbered slides (0, 2, 4...)
- **Right page**: Odd-numbered slides (1, 3, 5...)
- **Page turning**: Both pages change together
- **Single mode**: Traditional one-slide view

### Navigation Tips

| Key | Action |
|-----|--------|
| → | Next page/spread |
| ← | Previous page/spread |
| Space | Next page/spread |
| T | Toggle TOC |`,

  `# Chapter 2: Content Types

## Rich Markdown Support

The book layout preserves all markdown features while providing a more immersive reading experience.

### Code Examples

\`\`\`javascript
function BookPresentation({ slides }) {
  return (
    <SlidePresentationBook
      slides={slides}
      viewMode="book"
    />
  );
}
\`\`\`

This works beautifully across both pages!`,

  `# Visual Elements

## Tables and Lists

### Comparison Table

| Feature | Single View | Book View |
|---------|------------|-----------|
| Slides shown | 1 | 2 |
| Reading flow | Linear | Natural |
| Context | Limited | Enhanced |
| Space usage | Centered | Full width |

### Benefits of Book Layout

1. **Better context**: See related content together
2. **Natural progression**: Familiar reading pattern
3. **Efficient space**: Use wide screens effectively
4. **Reduced navigation**: See more at once`,

  `# Chapter 3: Interactive Elements

## Engaging Content

Book mode maintains all interactive features:

### Task Lists
- [x] Create book layout component
- [x] Implement page pairing logic
- [ ] Add page flip animations
- [ ] Create print-friendly export

### Interactive Code

\`\`\`python
def present_as_book(slides):
    """Display slides in book format"""
    for i in range(0, len(slides), 2):
        left_page = slides[i]
        right_page = slides[i+1] if i+1 < len(slides) else None
        display(left_page, right_page)
\`\`\``,

  `# Mermaid Diagrams

## Visual Documentation

\`\`\`mermaid
graph LR
    A[Single Mode] -->|Toggle| B[Book Mode]
    B --> C[Left Page]
    B --> D[Right Page]
    C --> E[Even Slides]
    D --> F[Odd Slides]

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
\`\`\`

Diagrams render perfectly in both viewing modes!`,

  `# Chapter 4: Navigation

## Moving Through Content

Book mode offers intuitive navigation:

### Keyboard Shortcuts

- **Arrow Keys**: Turn pages
- **Number Keys (1-9)**: Jump to specific slides
- **Home/End**: Beginning/end of presentation
- **F**: Toggle fullscreen
- **T**: Show table of contents
- **Ctrl/Cmd + F**: Search across all slides

The presentation adapts to your reading style!`,

  `# Search and Discovery

## Finding Information

The search feature works seamlessly in book mode:

1. **Global search**: Find content across all slides
2. **Highlighted results**: See matches on both pages
3. **Smart navigation**: Jump to any result
4. **Context preservation**: See surrounding content

### Search Tips
- Use **Ctrl/Cmd + F** to open search
- **Tab** through results
- **Enter** to jump to selection
- **Escape** to close search`,

  `# Chapter 5: Customization

## Adapting to Your Needs

Book mode is highly customizable:

### View Options
- **Font scaling**: Adjust text size
- **Theme support**: Light/dark modes
- **Page numbers**: Optional display
- **Progress bar**: Track position

### Layout Features
- **Responsive design**: Adapts to screen size
- **TOC sidebar**: Quick navigation
- **Fullscreen mode**: Immersive reading
- **Search overlay**: Find content fast`,

  `# The End

## Thank You for Reading!

This book-style presentation demonstrates the power of the dual-slide layout.

### What We Covered
- ✅ Book layout concept
- ✅ Navigation patterns
- ✅ Interactive features
- ✅ Customization options

### Next Steps
- Try toggling between single and book modes
- Experiment with keyboard shortcuts
- Explore the table of contents
- Test the search functionality

*Happy presenting!* 📚`,
];

export const DefaultBookView: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'book',
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
  },
};

export const SingleView: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'single',
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
  },
};

export const BookViewNoNavigation: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'book',
    showNavigation: false,
  },
};

export const InteractiveToggle: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<'single' | 'book'>('book');

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <label>
            View Mode:
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'single' | 'book')}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="single">Single Slide</option>
              <option value="book">Book Layout</option>
            </select>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
            {viewMode === 'book'
              ? '📖 Book Mode - Showing 2 slides'
              : '📄 Single Mode - Showing 1 slide'}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <SlidePresentationBook
            slides={presentationSlides}
            viewMode={viewMode}
            showNavigation={true}
            showSlideCounter={true}
            showFullscreenButton={true}
          />
        </div>
      </div>
    );
  },
};

export const ShortPresentation: Story = {
  args: {
    slides: [
      '# First Page\n\nThis is the left page in book mode.',
      '# Second Page\n\nThis is the right page in book mode.',
      '# Third Page\n\nAnother left page with more content.',
    ],
    viewMode: 'book',
    showNavigation: true,
  },
};

export const EmptyRightPage: Story = {
  args: {
    slides: [
      ...presentationSlides.slice(0, 9), // Odd number of slides
    ],
    viewMode: 'book',
    initialSlide: 8, // Start at the last pair to show empty right page
    showNavigation: true,
  },
};

export const WithWideCodeBlocks: Story = {
  args: {
    slides: [
      `# Wide Code Block Test - Page 1

This page tests how wide code blocks are handled in book mode.

## JavaScript with Long Lines

\`\`\`javascript
const reallyLongVariableName = someVeryLongFunctionName(anotherReallyLongParameterName, yetAnotherVeryLongParameterName, andOneMoreReallyLongParameterName);

// This is a very long comment that explains what this code does and why it needs to be so long that it might cause horizontal scrolling issues in the code block
const configurationObject = {
  apiEndpoint: "https://api.example-with-very-long-domain-name.com/v2/users/authentication/validate",
  timeout: 30000,
  retries: 3
};
\`\`\``,

      `# Wide Code Block Test - Page 2

## SQL Query Example

\`\`\`sql
SELECT users.id, users.first_name, users.last_name, users.email, users.created_at, profiles.bio, profiles.location, profiles.website, profiles.social_links, organizations.name as org_name FROM users LEFT JOIN profiles ON users.id = profiles.user_id LEFT JOIN user_organizations ON users.id = user_organizations.user_id LEFT JOIN organizations ON user_organizations.organization_id = organizations.id WHERE users.status = 'active' AND profiles.visibility = 'public' AND organizations.is_verified = true ORDER BY users.created_at DESC LIMIT 100;
\`\`\`

## Configuration JSON

\`\`\`json
{
  "database": {
    "connection_string": "postgresql://username:password@database-server-with-very-long-hostname.example.com:5432/application_database_name"
  }
}
\`\`\``,

      `# Page 3 - More Wide Content

## Bash Script with Long Commands

\`\`\`bash
docker run --rm -v /path/to/very/long/directory/structure/that/contains/application/source/code:/app -p 8080:8080 -e NODE_ENV=production myapp:latest

curl -X POST "https://api.example.com/v1/users/authenticate" -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" -d '{"username":"user@example.com","password":"secretpassword"}'
\`\`\``,

      `# Page 4 - Even More Wide Content

## Python with Long Method Chains

\`\`\`python
result = DataFrame.from_dict(data_source).filter(column_name="status", value="active").join(other_dataframe, left_on="user_id", right_on="id").group_by("category").aggregate({"revenue": "sum", "count": "count"}).sort_values(by="revenue", ascending=False)
\`\`\`

This tests horizontal scrolling behavior in both left and right panels of book mode.`,
    ],
    viewMode: 'book',
    showNavigation: true,
    showSlideCounter: true,
  },
};

export const BookModeWithPopout: Story = {
  args: {
    slides: [
      `# Pop-out Book Mode Demo

## Pop-out Feature in Book View

This story demonstrates the pop-out button functionality in book mode.

### How It Works

- Click the **pop-out button** (📤) in the top-right corner
- The book view opens in a new window
- When in pop-out mode, you'll see a **close button** (✕) instead

Both pages will open together in the new window.`,

      `# Second Page

This is the right page of the first spread.

Try clicking the pop-out button to see the book presentation in a new window!

### Features Preserved

- ✅ Both pages visible
- ✅ Navigation works
- ✅ Panel collapse/expand
- ✅ All markdown features`,

      `# Third Page

This continues the demonstration.`,

      `# Fourth Page

All features work in pop-out mode!`,
    ],
    viewMode: 'book',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showPopoutButton: true,
    slideIdPrefix: 'book-popout',
    onPopout: () => {
      console.log('Pop-out requested - opening book view in new window');
      window.open(window.location.href, '_blank', 'width=1400,height=900');
    },
  },
};

export const BookModePopoutMode: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'book',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    isPopout: true,
    slideIdPrefix: 'book-popout-mode',
    onClose: () => {
      console.log('Close requested - window should close');
      window.close();
    },
  },
};

export const SingleModeWithSidebarTOCLeft: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'single',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    // tocDisplayMode defaults to 'sidebar' in single view
    tocSidebarPosition: 'left',
    slideIdPrefix: 'single-sidebar-toc-left',
  },
};

export const SingleModeWithSidebarTOCRight: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'single',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    // tocDisplayMode defaults to 'sidebar' in single view
    tocSidebarPosition: 'right',
    slideIdPrefix: 'single-sidebar-toc-right',
  },
};

export const BookModeWithOverlayTOC: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'book',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    // tocDisplayMode defaults to 'overlay' in book view
    slideIdPrefix: 'book-overlay-toc',
  },
};

export const SingleModeWithSidebarClosedByDefault: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'single',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocSidebarPosition: 'left',
    initialTocOpen: false,
    slideIdPrefix: 'single-sidebar-closed',
  },
};

export const BookModeWithOverlayOpenByDefault: Story = {
  args: {
    slides: presentationSlides,
    viewMode: 'book',
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    initialTocOpen: true,
    slideIdPrefix: 'book-overlay-open',
  },
};
