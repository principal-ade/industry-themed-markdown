import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DocumentView } from './DocumentView';

const meta: Meta<typeof DocumentView> = {
  title: 'IndustryMarkdown/DocumentView',
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
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

const singleDocumentContent = `# Documentation Example

This is a comprehensive document view that demonstrates various markdown features.

## Introduction

The DocumentView component is designed to display markdown content in a readable, document-style format. It supports both single documents and segmented views with multiple sections.

## Features

### Rich Text Formatting

The component supports all standard markdown features:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`inline code\` for technical terms
- [Links](https://example.com) to external resources

### Code Blocks

\`\`\`javascript
// Example JavaScript code
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet("World");
\`\`\`

### Lists and Tasks

#### Unordered Lists
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

#### Ordered Lists
1. Step one
2. Step two
3. Step three

#### Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Markdown Parsing | Full CommonMark support | ✅ Complete |
| Syntax Highlighting | Multiple language support | ✅ Complete |
| Interactive Elements | Checkboxes, links | ✅ Complete |
| Theming | Light and dark themes | ✅ Complete |

## Conclusion

The DocumentView component provides a flexible and powerful way to display markdown content in your applications.`;

const segmentedContent = [
  `# Section 1: Getting Started

Welcome to the documentation! This first section covers the basics of getting started with our component library.

## Installation

\`\`\`bash
npm install themed-markdown
\`\`\`

## Basic Usage

Import and use the components in your React application:

\`\`\`javascript
import { DocumentView, defaultTheme } from 'themed-markdown';

function App() {
  return <DocumentView content={markdownContent} theme={defaultTheme} />;
}
\`\`\``,

  `# Section 2: Configuration

This section covers configuration options and customization.

## Theme Configuration

You can customize the appearance using the theme prop:

\`\`\`javascript
const customTheme = {
  colors: {
    primary: '#007bff',
    background: '#ffffff',
    text: '#333333',
  },
};
\`\`\`

## Layout Options

- **maxWidth**: Control the maximum width of the content
- **padding**: Adjust the spacing around content
- **showSectionHeaders**: Toggle section headers in segmented view`,

  `# Section 3: Advanced Features

Explore advanced features and capabilities.

## Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F[End]
    E --> F
\`\`\`

## Interactive Elements

### Checkboxes
- [ ] Interactive checkbox 1
- [ ] Interactive checkbox 2
- [x] Completed task

### Event Handlers

The component supports various event handlers for interactivity:
- \`onCheckboxChange\`: Handle checkbox state changes
- \`onSectionClick\`: Handle section navigation
- \`onLinkClick\`: Handle link clicks`,
];

export const SingleDocument: Story = {
  args: {
    content: singleDocumentContent,
    showSegmented: false,
    maxWidth: '900px',
    padding: '24px',
    slideIdPrefix: 'doc',
  },
};

export const SegmentedDocument: Story = {
  args: {
    content: segmentedContent,
    showSegmented: true,
    showSectionHeaders: true,
    showSeparators: true,
    maxWidth: '900px',
    padding: '24px',
    slideIdPrefix: 'segment',
  },
};

export const DarkThemeDocument: Story = {
  args: {
    content: singleDocumentContent,
    showSegmented: false,
    maxWidth: '900px',
    padding: '24px',
    slideIdPrefix: 'dark-doc',
  },
};

export const WideDocument: Story = {
  args: {
    content: singleDocumentContent,
    showSegmented: false,
    maxWidth: '1400px',
    padding: '32px',
    slideIdPrefix: 'wide-doc',
  },
};

export const CompactSegments: Story = {
  args: {
    content: segmentedContent,
    showSegmented: true,
    showSectionHeaders: false,
    showSeparators: false,
    maxWidth: '800px',
    padding: '16px',
    slideIdPrefix: 'compact',
  },
};

export const InteractiveDocument: Story = {
  args: {
    content: `# Interactive Document

This document demonstrates interactive features.

## Task Management

Track your progress with interactive checkboxes:

- [ ] Read the documentation
- [ ] Install the package
- [ ] Configure the theme
- [ ] Create your first component
- [ ] Deploy to production

## Code Examples

### React Component

\`\`\`jsx
function TodoList({ items }) {
  const [todos, setTodos] = useState(items);
  
  const toggleTodo = (index) => {
    const newTodos = [...todos];
    newTodos[index].completed = !newTodos[index].completed;
    setTodos(newTodos);
  };
  
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(index)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
\`\`\`

## Links and Navigation

- [GitHub Repository](https://github.com/example/repo)
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)`,
    showSegmented: false,
    maxWidth: '900px',
    padding: '24px',
    slideIdPrefix: 'interactive',
    onCheckboxChange: (slideIndex, lineNumber, checked) => {
      console.log('Checkbox changed:', { slideIndex, lineNumber, checked });
    },
    onLinkClick: (href, event) => {
      console.log('Link clicked:', href);
      if (event) event.preventDefault();
    },
  },
};

export const MermaidDiagramDocument: Story = {
  args: {
    content: `# System Architecture

## Overview

This document illustrates our system architecture using Mermaid diagrams.

## Wide Component Flow Diagram

This diagram demonstrates horizontal scrolling for wide content:

\`\`\`mermaid
graph LR
    subgraph "User Layer"
        Browser[Web Browser]
        Mobile[Mobile App]
        API_Client[API Client]
    end
    
    subgraph "CDN & Load Balancing"
        CloudFlare[CloudFlare CDN]
        LB[Load Balancer]
    end
    
    subgraph "Frontend Services"
        NextJS[Next.js App]
        Static[Static Assets]
        SSR[SSR Service]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway]
        RateLimiter[Rate Limiter]
        Auth[Auth Service]
    end
    
    subgraph "Backend Services"
        UserService[User Service]
        ContentService[Content Service]
        NotificationService[Notification Service]
        AnalyticsService[Analytics Service]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[S3 Storage]
        ElasticSearch[Elasticsearch]
    end
    
    subgraph "External Services"
        Stripe[Stripe Payments]
        SendGrid[SendGrid Email]
        Twilio[Twilio SMS]
    end
    
    Browser --> CloudFlare
    Mobile --> CloudFlare
    API_Client --> CloudFlare
    CloudFlare --> LB
    LB --> NextJS
    LB --> Static
    NextJS --> SSR
    NextJS --> Gateway
    Gateway --> RateLimiter
    RateLimiter --> Auth
    Auth --> UserService
    Auth --> ContentService
    Auth --> NotificationService
    Auth --> AnalyticsService
    UserService --> PostgreSQL
    UserService --> Redis
    ContentService --> PostgreSQL
    ContentService --> S3
    ContentService --> ElasticSearch
    NotificationService --> SendGrid
    NotificationService --> Twilio
    AnalyticsService --> ElasticSearch
\`\`\`

## Vertical Flow Diagram

\`\`\`mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        State[State Management]
        Router[Routing]
    end
    
    subgraph "Service Layer"
        API[API Gateway]
        Auth2[Authentication]
        Cache[Cache Service]
    end
    
    subgraph "Data Layer"
        DB[(Database)]
        Queue[Message Queue]
        Storage[File Storage]
    end
    
    UI --> State
    State --> API
    Router --> UI
    API --> Auth2
    API --> Cache
    Cache --> DB
    API --> Queue
    Queue --> Storage
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Submit Form
    Frontend->>API: POST /api/data
    API->>Database: INSERT query
    Database-->>API: Success
    API-->>Frontend: 201 Created
    Frontend-->>User: Success Message
\`\`\`

## Class Structure

\`\`\`mermaid
classDiagram
    class Component {
        +String name
        +String version
        +render()
        +update()
    }
    
    class DocumentView {
        +String content
        +Theme theme
        +display()
    }
    
    class SlidePresentation {
        +Array slides
        +Number currentSlide
        +navigate()
    }
    
    Component <|-- DocumentView
    Component <|-- SlidePresentation
\`\`\``,
    showSegmented: false,
    maxWidth: '1000px',
    padding: '24px',
    slideIdPrefix: 'mermaid-doc',
  },
};

export const TransparentBackground: Story = {
  args: {
    content: singleDocumentContent,
    showSegmented: false,
    maxWidth: '900px',
    padding: '24px',
    slideIdPrefix: 'transparent-doc',
    transparentBackground: true,
  },
  decorators: [
    Story => (
      <ThemeProvider>
        <div
          style={{
            height: '100vh',
            width: '100%',
            background: 'linear-gradient(to right, #74ebd5, #acb6e5)',
            padding: '20px',
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};
