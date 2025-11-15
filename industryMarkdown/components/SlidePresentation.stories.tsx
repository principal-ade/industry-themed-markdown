import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SlidePresentation } from './SlidePresentation';

const meta: Meta<typeof SlidePresentation> = {
  title: 'IndustryMarkdown/SlidePresentation',
  component: SlidePresentation,
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
    initialSlide: {
      control: { type: 'number', min: 0, max: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const presentationSlides = [
  `# Welcome to the Presentation

## A Beautiful Slide Deck

This is the first slide of our presentation, demonstrating the SlidePresentation component.

### Key Features
- Navigate between slides
- Keyboard shortcuts (Ctrl/Cmd + Arrow keys)
- Progress indicator
- Slide counter

Press **Next** or use **Ctrl+Right Arrow** to continue.`,

  `# Slide 2: Rich Content

## Markdown Support

The SlidePresentation component supports all markdown features:

- **Bold text** and *italic text*
- \`inline code\` snippets
- Code blocks with syntax highlighting

\`\`\`javascript
function presentSlide(content) {
  return (
    <SlidePresentation
      slides={[content]}
      theme={theme}
    />
  );
}
\`\`\`

### Lists

1. Ordered lists
2. Unordered lists
3. Nested items
   - Like this
   - And this`,

  `# Slide 3: Tables and Data

## Presenting Data

Tables are great for presenting structured information:

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown Rendering | ✅ Complete | High |
| Navigation | ✅ Complete | High |
| Theming | ✅ Complete | Medium |
| Animations | 🚧 In Progress | Low |
| Export to PDF | 📋 Planned | Low |

### Task Tracking

- [x] Create presentation component
- [x] Add navigation controls
- [ ] Add transition animations
- [ ] Implement presenter mode`,

  `# Slide 4: Mermaid Diagrams

## Visual Representations

\`\`\`mermaid
graph LR
    A[Start Presentation] --> B[Show Slide 1]
    B --> C[Navigate]
    C --> D{Last Slide?}
    D -->|No| E[Next Slide]
    D -->|Yes| F[End]
    E --> C
\`\`\`

## Process Flow

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Component
    participant State
    
    User->>Component: Click Next
    Component->>State: Update currentSlide
    State-->>Component: New slide index
    Component-->>User: Display new slide
\`\`\``,

  `# Slide 5: Code Examples

## Interactive Code Blocks

### React Component Example

\`\`\`jsx
import { SlidePresentation } from 'themed-markdown';

function MyPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    '# Slide 1',
    '# Slide 2',
    '# Slide 3'
  ];
  
  return (
    <SlidePresentation
      slides={slides}
      initialSlide={currentSlide}
      onSlideChange={setCurrentSlide}
      theme={lightTheme}
    />
  );
}
\`\`\`

### TypeScript Support

\`\`\`typescript
interface PresentationProps {
  slides: string[];
  onComplete?: () => void;
}
\`\`\``,

  `# Thank You!

## End of Presentation

This concludes our demonstration of the SlidePresentation component.

### Summary

We've covered:
- ✅ Basic navigation and controls
- ✅ Rich markdown content
- ✅ Tables and lists
- ✅ Mermaid diagrams
- ✅ Code examples

### Questions?

Feel free to explore the component further or check out the documentation.

---

*Use the navigation controls or keyboard shortcuts to review any slide.*`,
];

const technicalSlides = [
  `# Technical Architecture

## System Overview

This presentation covers the technical architecture of our application.

### Agenda

1. Frontend Architecture
2. Backend Services
3. Data Flow
4. Security Considerations
5. Performance Optimization`,

  `# Frontend Architecture

## Component Structure

\`\`\`
src/
├── components/
│   ├── DocumentView/
│   ├── SlidePresentation/
│   └── IndustryMarkdownSlide/
├── themes/
│   ├── light.ts
│   └── dark.ts
└── utils/
    ├── markdown.ts
    └── mermaid.ts
\`\`\`

## Technology Stack

- **React** - UI Framework
- **TypeScript** - Type Safety
- **Storybook** - Component Development
- **Mermaid** - Diagram Rendering`,

  `# Backend Services

## Microservices Architecture

\`\`\`mermaid
graph TB
    subgraph "API Gateway"
        GW[Gateway Service]
    end
    
    subgraph "Core Services"
        AUTH[Auth Service]
        USER[User Service]
        CONTENT[Content Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        CACHE[(Redis)]
        S3[Object Storage]
    end
    
    GW --> AUTH
    GW --> USER
    GW --> CONTENT
    AUTH --> DB
    USER --> DB
    CONTENT --> S3
    AUTH --> CACHE
\`\`\``,

  `# Data Flow

## Request Lifecycle

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Service
    participant Database
    participant Cache
    
    Client->>Gateway: Request
    Gateway->>Cache: Check cache
    alt Cache Hit
        Cache-->>Gateway: Cached response
        Gateway-->>Client: Return data
    else Cache Miss
        Gateway->>Service: Forward request
        Service->>Database: Query
        Database-->>Service: Result
        Service->>Cache: Update cache
        Service-->>Gateway: Response
        Gateway-->>Client: Return data
    end
\`\`\``,

  `# Security Considerations

## Security Layers

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- OAuth 2.0 integration

### Data Protection
- End-to-end encryption for sensitive data
- TLS 1.3 for all communications
- Regular security audits

### Code Security
\`\`\`javascript
// Input validation example
function validateInput(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });
  
  return schema.validate(data);
}
\`\`\``,

  `# Performance Optimization

## Optimization Strategies

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization and CDN delivery
- Service Worker caching

### Backend Optimizations
- Database query optimization
- Redis caching layer
- Horizontal scaling with load balancing

### Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | < 2s | 1.8s |
| API Response Time | < 200ms | 150ms |
| Uptime | 99.9% | 99.95% |
| Error Rate | < 0.1% | 0.05% |`,
];

export const BasicPresentation: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    slideIdPrefix: 'basic',
  },
};

export const KeyboardShortcuts: Story = {
  args: {
    slides: [
      `# Keyboard Shortcuts Guide

The SlidePresentation component supports comprehensive keyboard navigation:

## Navigation Keys

| Key | Action |
|-----|--------|
| **→** (Right Arrow) | Next slide |
| **←** (Left Arrow) | Previous slide |
| **Space** | Next slide |
| **Enter** | Next slide |
| **Backspace** | Previous slide |
| **Home** | First slide |
| **End** | Last slide |

## Quick Jump

| Key | Action |
|-----|--------|
| **1-9** | Jump to slide 1-9 |

## Presentation Controls

| Key | Action |
|-----|--------|
| **F** | Toggle fullscreen |

Try these shortcuts now while viewing this presentation!`,
      `# Test the Shortcuts

Now on slide 2 of 3.

Try pressing:
- **Arrow keys** to navigate
- **Space** or **Enter** to go forward
- **1** to jump back to slide 1
- **3** to jump to slide 3
- **F** for fullscreen mode`,
      `# Last Slide

You made it to slide 3!

Quick recap:
- ✅ Arrow keys for navigation
- ✅ Space/Enter for next slide
- ✅ Number keys for quick jump
- ✅ F for fullscreen
- ✅ Home/End for first/last slide

Press **Home** to return to the beginning.`,
    ],
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    slideIdPrefix: 'keyboard',
  },
};

export const DarkThemePresentation: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    slideIdPrefix: 'dark',
  },
};

export const TechnicalPresentation: Story = {
  args: {
    slides: technicalSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: false,
    slideIdPrefix: 'technical',
  },
};

export const MinimalNavigation: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: false,
    showFullscreenButton: false,
    slideIdPrefix: 'minimal',
  },
};

export const NoNavigation: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: false,
    slideIdPrefix: 'no-nav',
  },
};

export const InteractiveSlides: Story = {
  args: {
    slides: [
      `# Interactive Features

## Checkbox Interactions

Track your progress through the presentation:

- [ ] Viewed introduction
- [ ] Understood navigation
- [ ] Explored features
- [ ] Ready to continue

Click the checkboxes above to interact with them!`,

      `# Link Handling

## External Links

Visit these resources:

- [Documentation](https://docs.example.com)
- [GitHub Repository](https://github.com/example/repo)
- [Support Forum](https://forum.example.com)

*Note: Link clicks are logged to the console in this story.*`,

      `# Code Execution

## Bash Commands

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\`

*In a real implementation, these could be executable.*`,
    ],
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    slideIdPrefix: 'interactive',
    onSlideChange: slideIndex => {
      console.log('Slide changed to:', slideIndex);
    },
    onCheckboxChange: (slideIndex, lineNumber, checked) => {
      console.log('Checkbox changed:', { slideIndex, lineNumber, checked });
    },
    onLinkClick: (href, event) => {
      console.log('Link clicked:', href);
      if (event) event.preventDefault();
    },
  },
};

export const SingleSlide: Story = {
  args: {
    slides: [
      `# Single Slide Presentation

Sometimes you just need one slide.

## Use Cases

- Quick demonstrations
- Single-page documentation
- Status dashboards
- Welcome screens

## Features Still Available

Even with a single slide, you still get:
- Full markdown support
- Theme customization
- Interactive elements
- Responsive layout

No navigation controls are shown when there's only one slide.`,
    ],
    showNavigation: true,
    showSlideCounter: true,
    slideIdPrefix: 'single',
  },
};

export const CustomHeight: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    containerHeight: '600px',
    slideIdPrefix: 'custom-height',
  },
};

export const StartFromMiddle: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 2,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    slideIdPrefix: 'middle-start',
  },
};

export const WithPopoutButton: Story = {
  args: {
    slides: [
      `# Pop-out Window Demo

## Pop-out Feature

This story demonstrates the pop-out button functionality.

### How It Works

- Click the **pop-out button** (📤) in the top-right corner
- The presentation opens in a new window
- When in pop-out mode, you'll see a **close button** (✕) instead

### Use Cases

- Present on external display while controlling from main window
- Keep reference slides visible while working
- Share specific slides in separate windows`,

      `# Second Slide

This is just to show that navigation works with the pop-out feature.

Try clicking the pop-out button to see the presentation in a new window!`,
    ],
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showPopoutButton: true,
    slideIdPrefix: 'popout',
    onPopout: () => {
      console.log('Pop-out requested - opening new window');
      window.open(window.location.href, '_blank', 'width=1200,height=800');
    },
  },
};

export const PopoutMode: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    isPopout: true,
    slideIdPrefix: 'popout-mode',
    onClose: () => {
      console.log('Close requested - window should close');
      window.close();
    },
  },
};

export const WithSidebarTOCLeft: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocDisplayMode: 'sidebar',
    tocSidebarPosition: 'left',
    slideIdPrefix: 'sidebar-toc-left',
  },
};

export const WithSidebarTOCRight: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocDisplayMode: 'sidebar',
    tocSidebarPosition: 'right',
    slideIdPrefix: 'sidebar-toc-right',
  },
};

export const OverlayTOC: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocDisplayMode: 'overlay',
    slideIdPrefix: 'overlay-toc',
  },
};

export const OverlayTOCOpenByDefault: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocDisplayMode: 'overlay',
    initialTocOpen: true,
    slideIdPrefix: 'overlay-toc-open',
  },
};

export const SidebarTOCClosedByDefault: Story = {
  args: {
    slides: presentationSlides,
    initialSlide: 0,
    showNavigation: true,
    showSlideCounter: true,
    showFullscreenButton: true,
    tocDisplayMode: 'sidebar',
    tocSidebarPosition: 'left',
    initialTocOpen: false,
    slideIdPrefix: 'sidebar-toc-closed',
  },
};
