import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SlidePresentation } from './SlidePresentation';

const meta: Meta<typeof SlidePresentation> = {
  title: 'IndustryMarkdown/ExpandableMermaid',
  component: SlidePresentation,
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
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
};

export default meta;
type Story = StoryObj<typeof meta>;

const slidesWithExpandableMermaid = [
  `# Expandable Mermaid Diagrams

This presentation demonstrates the new expandable mermaid feature.

## How it works

Every mermaid diagram now has an **Expand** button that allows you to view it in full-slide mode.

Try clicking the expand button on the diagram below:

\`\`\`mermaid
graph TB
    A[Start] --> B{Has Expand Button?}
    B -->|Yes| C[Click to Expand]
    C --> D[View in Full Slide]
    D --> E[Click Close or Outside]
    E --> F[Return to Normal]
    F --> G[End]

    style A fill:#f9f,stroke:#333,stroke-width:4px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
\`\`\`

Click the **Expand** button (↗) in the top-right corner to view this diagram in full-slide mode!`,

  `# Multiple Diagrams

You can have multiple diagrams on a slide, each with its own expand button:

## Process Flow
\`\`\`mermaid
graph LR
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\`

## Decision Tree
\`\`\`mermaid
graph TD
    A[Decision] --> B{Option 1?}
    B -->|Yes| C[Path A]
    B -->|No| D[Path B]
\`\`\`

Each diagram can be expanded independently!`,

  `# Sequence Diagram

Complex diagrams benefit greatly from the expand feature:

\`\`\`mermaid
sequenceDiagram
    participant User
    participant UI
    participant Diagram
    participant Overlay

    User->>UI: Clicks Expand Button
    UI->>Overlay: Create Full-Slide Overlay
    Overlay->>Diagram: Render in Full Size
    Diagram-->>User: Display Expanded View

    User->>Overlay: Clicks Close/Outside
    Overlay->>UI: Remove Overlay
    UI-->>User: Return to Normal View

    Note over User,Overlay: The diagram can be expanded and collapsed easily
\`\`\`

This diagram shows the interaction flow. Click **Expand** to see it in detail!`,

  `# Complex Architecture Diagram

This complex architecture diagram is perfect for the expand feature:

\`\`\`mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI[React UI]
        State[State Management]
        Router[Router]
    end

    subgraph "API Gateway"
        GW[API Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiting]
    end

    subgraph "Microservices"
        UserService[User Service]
        OrderService[Order Service]
        PaymentService[Payment Service]
        NotificationService[Notification Service]
    end

    subgraph "Data Layer"
        UserDB[(User DB)]
        OrderDB[(Order DB)]
        PaymentDB[(Payment DB)]
        Cache[(Redis Cache)]
    end

    UI --> State
    State --> Router
    Router --> GW
    GW --> Auth
    Auth --> RateLimit

    RateLimit --> UserService
    RateLimit --> OrderService
    RateLimit --> PaymentService

    UserService --> UserDB
    OrderService --> OrderDB
    PaymentService --> PaymentDB

    style UI fill:#e1f5fe
    style GW fill:#fff3e0
\`\`\`

Click the **Expand** button to view this complex diagram in full detail!`,

  `# Pie Chart Example

Even simple diagrams can benefit from the expand feature:

\`\`\`mermaid
pie title Project Time Allocation
    "Development" : 45
    "Testing" : 20
    "Documentation" : 15
    "Meetings" : 10
    "Planning" : 10
\`\`\`

## Git Flow

\`\`\`mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    checkout develop
    merge feature
\`\`\`

Both charts have expand buttons for better viewing!`,

  `# Summary

## Expandable Mermaid Feature

### ✨ Key Features
- ✅ **Expand button** on every mermaid diagram
- ✅ **Full-slide overlay** for better viewing experience
- ✅ **Easy to close** - click the close button or outside the diagram
- ✅ **Perfect for complex diagrams** that need more viewing space
- ✅ **Works alongside** the existing "Show in panel" feature

### 🎯 Benefits
1. **Better readability** - View complex diagrams without scrolling
2. **User control** - Expand only when needed
3. **Clean interface** - No special syntax required
4. **Seamless experience** - Quick transition between modes
5. **Focus mode** - Overlay helps focus on the diagram

### 💡 Tips
- Look for the **↗ Expand** button in the top-right corner
- Click anywhere outside the diagram to close
- Use the **Close** button for precise control
- The feature works with all mermaid diagram types

Navigate back through the slides and try the expand feature!`,
];

export const ExpandableDiagrams: Story = {
  args: {
    slides: slidesWithExpandableMermaid,
    initialSlide: 0,
  },
};

export const MixedContent: Story = {
  args: {
    slides: [
      `# Mixed Content with Diagrams

This presentation shows how expandable diagrams work with other content.

## Regular Text Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. The diagram below can be expanded while keeping the rest of the content in place.

\`\`\`mermaid
graph TD
    A[Content] --> B[Diagram]
    B --> C[Expandable]
    C --> D[Interactive]
\`\`\`

### Code Example

\`\`\`javascript
// Diagrams can coexist with code
function expandDiagram() {
  console.log("Expanding diagram to full slide");
}
\`\`\``,

      `# Comparison View

## Without Expansion
When diagrams are complex, they can be hard to read in normal view.

## With Expansion Feature
Now users can choose to expand any diagram for better visibility.

\`\`\`mermaid
graph LR
    subgraph "Normal View"
        A1[Small] --> B1[Constrained]
    end

    subgraph "Expanded View"
        A2[Full Size] --> B2[Clear]
    end

    B1 -.->|Click Expand| A2
    B2 -.->|Click Close| A1
\`\`\`

Try expanding the diagram above to see the difference!`,

      `# The End

You've learned about the expandable mermaid diagram feature!

## Quick Recap

\`\`\`mermaid
mindmap
  root((Expandable Mermaid))
    Features
      Expand Button
      Full Slide Overlay
      Close Button
      Click Outside
    Benefits
      Better Readability
      User Control
      Clean Interface
    Use Cases
      Complex Diagrams
      Presentations
      Documentation
\`\`\`

Thank you for exploring this feature!`,
    ],
    initialSlide: 0,
  },
};
