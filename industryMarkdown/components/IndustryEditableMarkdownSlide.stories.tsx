import { ThemeProvider, theme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { IndustryEditableMarkdownSlide } from './IndustryEditableMarkdownSlide';
import { IndustryEditableMermaidDiagram } from './IndustryEditableMermaidDiagram';

const meta: Meta<typeof IndustryEditableMarkdownSlide> = {
  title: 'IndustryMarkdown/IndustryEditableMarkdownSlide',
  component: IndustryEditableMarkdownSlide,
  decorators: [
    Story => (
      <ThemeProvider theme={theme}>
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
    theme,
  },
  argTypes: {
    theme: {
      options: ['light', 'dark'],
      mapping: {
        light: theme,
        dark: theme,
      },
      control: { type: 'radio' },
    },
    autoSaveDelay: {
      control: { type: 'number', min: 0, max: 5000, step: 500 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const initialContent = `# Editable Markdown Slide

This is an **editable** markdown slide. Click the Edit button to modify this content!

## Features

- 📝 Live markdown editing
- 💾 Auto-save functionality
- ⌨️ Keyboard shortcuts (Ctrl/Cmd+S to save, Esc to cancel)
- 🎨 Syntax-highlighted editor
- 👀 Live preview when not editing

## Try It Out

1. Click the **Edit** button in the top-right corner
2. Modify this content
3. Save your changes or let auto-save handle it
4. See your changes rendered immediately

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet("Storybook");
\`\`\``;

export const Default: Story = {
  args: {
    content: initialContent,
    slideIdPrefix: 'editable',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1000,
    onContentChange: newContent => {
      console.log('Content changed:', newContent);
    },
  },
};

export const WithAutoSave: Story = {
  args: {
    content: `# Auto-Save Demo

This slide has auto-save enabled with a 2-second delay.

## How it works

1. Click **Edit** to enter edit mode
2. Make some changes to the content
3. Wait 2 seconds without typing
4. The content will auto-save **without exiting edit mode**!

You'll see "Saving..." appear briefly when auto-save triggers, but you'll remain in edit mode to continue making changes.

### Try editing this list:

- [ ] First item
- [ ] Second item
- [ ] Third item`,
    slideIdPrefix: 'autosave',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
    onSave: async content => {
      console.log('Auto-saving content...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Content saved:', content);
    },
  },
};

export const DarkTheme: Story = {
  args: {
    content: initialContent,
    slideIdPrefix: 'dark-editable',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1000,
  },
};

export const ReadOnly: Story = {
  args: {
    content: `# Read-Only Mode

This slide is in read-only mode. The edit button is hidden and editing is disabled.

## Use Cases

- Displaying content that shouldn't be modified
- Viewing historical versions
- Restricted access scenarios

### Content Protection

When \`editable\` is set to \`false\`, users cannot modify the content.`,
    slideIdPrefix: 'readonly',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: false,
    showEditButton: false,
  },
};

export const NoAutoSave: Story = {
  args: {
    content: `# Manual Save Only

This slide has auto-save disabled. You must manually save your changes.

## Save Options

- Click the **Save** button
- Press **Ctrl/Cmd + S**

## Cancel Options

- Click the **Cancel** button
- Press **Esc**`,
    slideIdPrefix: 'manual-save',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 0,
    onContentChange: newContent => {
      console.log('Content changed (not auto-saved):', newContent);
    },
  },
};

// Interactive example with state management
const InteractiveExample = () => {
  const [content, setContent] = useState(`# Interactive Example

This example demonstrates state management with the editable slide.

## Current Features

- Content persists across edits
- Save count: 0
- Last saved: Never

Try editing and saving to see the counters update!`);

  const [saveCount, setSaveCount] = useState(0);

  const handleSave = async (newContent: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const count = saveCount + 1;
    const time = new Date().toLocaleTimeString();

    setSaveCount(count);

    // Update the content with new metadata
    const updatedContent = newContent
      .replace(/- Save count: \d+/, `- Save count: ${count}`)
      .replace(/- Last saved: .*/, `- Last saved: ${time}`);

    setContent(updatedContent);
    console.log(`Save #${count} at ${time}`);
  };

  return (
    <IndustryEditableMarkdownSlide
      content={content}
      slideIdPrefix="interactive"
      slideIndex={0}
      isVisible={true}
      theme={theme}
      editable={true}
      showEditButton={true}
      autoSaveDelay={3000}
      onContentChange={setContent}
      onSave={handleSave}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

export const WithComplexContent: Story = {
  args: {
    content: `# Complex Content Example

This slide demonstrates editing complex markdown content.

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start Editing] --> B{Changes Made?}
    B -->|Yes| C[Auto-Save Timer]
    B -->|No| D[Keep Editing]
    C --> E[Save Content]
    E --> F[Update Display]
    D --> B
\`\`\`

*Note: When you edit this slide, the Mermaid diagram above appears as raw code that you can modify directly in the text editor.*

## Workflow Comparison

### Current Approach (Markdown Slide Editor)
1. Click **Edit** button on the slide
2. Edit the entire markdown content (including \`\`\`mermaid code blocks)
3. Live preview shows rendered diagrams
4. Save the entire content

### Alternative Approach (Individual Diagram Editors)
- Each Mermaid diagram could have its own **Edit Diagram** button
- Click it to edit just that specific diagram
- See dedicated Mermaid code editor with live preview
- Save just that diagram's changes

## Table Editing

| Feature | Current Slide Editor | Individual Diagram Editor |
|---------|---------------------|---------------------------|
| Edit entire content | ✅ | ❌ |
| Edit specific diagram | ✅ (as text) | ✅ (visual editor) |
| Live Mermaid preview | ✅ | ✅ |
| Side-by-side editing | ✅ | ✅ |
| Syntax highlighting | ✅ (markdown) | ✅ (mermaid-specific) |

## Task List

- [x] Create editable markdown slide component
- [x] Create editable Mermaid diagram component  
- [x] Add auto-save to both components
- [ ] Integrate both editing approaches
- [ ] Add version history
- [ ] Add collaborative editing

## Code Integration Example

If you want individual diagram edit buttons within a slide:

\`\`\`tsx
// Instead of markdown mermaid blocks, use:
<IndustryEditableMermaidDiagram 
  code="graph TD\\nA --> B"
  id="diagram-1"
  theme={theme}
  editable={true}
/>
\`\`\`

## Links and References

- [Mermaid Documentation](https://mermaid-js.github.io/mermaid/)
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)`,
    slideIdPrefix: 'complex',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
  },
};

export const ErrorHandling: Story = {
  args: {
    content: `# Error Handling Demo

This example simulates save failures to demonstrate error handling.

## Save Behavior

Every other save attempt will fail to demonstrate error recovery.

Try editing and saving multiple times to see both success and failure cases.`,
    slideIdPrefix: 'error',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 0, // Manual save only for testing
    onSave: async content => {
      // Simulate alternating success/failure
      const shouldFail = Math.random() > 0.5;

      if (shouldFail) {
        console.error('Save failed (simulated error)');
        throw new Error('Failed to save content to server');
      }

      console.log('Save successful:', content);
    },
  },
};

// Hybrid example showing both markdown editing and individual diagram editing
const HybridEditingExample = () => {
  const [markdownContent, setMarkdownContent] = useState(`# Hybrid Editing Demo

This slide shows **both** editing approaches working together.

## Regular Markdown Content

This text is part of the markdown slide and gets edited when you click the slide's **Edit** button.

- You can edit this list
- Add new items
- Modify the entire content structure

## Individual Mermaid Diagram

Below is a **separate** editable Mermaid diagram with its own **Edit Diagram** button:`);

  const [diagramCode, setDiagramCode] = useState(`graph LR
    A[Slide Editor] --> B[Edit entire markdown]
    C[Diagram Editor] --> D[Edit specific diagram]
    B --> E[Saves slide content]
    D --> F[Saves diagram only]
    
    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style E fill:#e8f5e8
    style F fill:#fff3e0`);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Editable Markdown Slide */}
      <div style={{ flex: 1 }}>
        <IndustryEditableMarkdownSlide
          content={markdownContent}
          slideIdPrefix="hybrid"
          slideIndex={0}
          isVisible={true}
          theme={theme}
          editable={true}
          showEditButton={true}
          autoSaveDelay={2000}
          onContentChange={setMarkdownContent}
          onSave={async content => {
            console.log('Markdown slide saved:', content);
            await new Promise(resolve => setTimeout(resolve, 300));
          }}
        />
      </div>

      {/* Individual Editable Mermaid Diagram */}
      <div style={{ height: '400px', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
        <IndustryEditableMermaidDiagram
          code={diagramCode}
          id="hybrid-diagram"
          theme={theme}
          editable={true}
          showEditButton={true}
          autoSaveDelay={2000}
          onCodeChange={setDiagramCode}
          onSave={async code => {
            console.log('Mermaid diagram saved:', code);
            await new Promise(resolve => setTimeout(resolve, 300));
          }}
        />
      </div>
    </div>
  );
};

export const HybridEditing: Story = {
  render: () => <HybridEditingExample />,
};

export const PracticalDocumentationExample: Story = {
  args: {
    content: `# API Documentation <span style="background: #dbeafe; color: #1e3a8a; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 10px;">v2.0.1</span>

## User Authentication <span style="background: #dcfce7; color: #14532d; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">Stable</span>

### Login Endpoint

<span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace;">POST</span> \`/api/auth/login\` <span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500; margin-left: 8px;">Rate Limited</span>

Authenticates a user and returns a JWT token.

**Status:** <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ Active</span>
**Environment:** <span style="background: #bbf7d0; color: #14532d; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">PROD</span> <span style="background: #fed7aa; color: #7c2d12; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">STAGING</span>

#### Request Body

\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

#### Response <span style="background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500;">200 OK</span>

\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "role": "admin"
  }
}
\`\`\`

---

### Get User Profile <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">Beta</span>

<span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace;">GET</span> \`/api/users/profile\` <span style="background: #eff6ff; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 500; margin-left: 8px;">Auth Required</span>

Returns the authenticated user's profile information.

**Required Permissions:** <span style="background: #e9d5ff; color: #6b21a8; padding: 2px 8px; border-radius: 3px; font-size: 11px;">user:read</span>

---

## Database Operations <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">Deprecated in v3.0</span>

### Update User <span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🔴 Critical</span>

<span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace;">PUT</span> \`/api/users/{id}\` 

⚠️ **Warning:** This endpoint modifies user data directly. <span style="background: #fef3c7; color: #78350f; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">TODO</span> Add validation middleware.

**Security:** <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Admin Only</span>

---

## Feature Availability

<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <h4 style="margin: 0 0 12px 0;">Available Features by Plan</h4>
  
  <div style="margin: 10px 0;">
    <strong>Free Tier:</strong>
    <span style="background: #f0fdf4; color: #14532d; border-left: 3px solid #22c55e; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">✓ Basic Auth</span>
    <span style="background: #f0fdf4; color: #14532d; border-left: 3px solid #22c55e; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">✓ Read Operations</span>
    <span style="background: #f1f5f9; color: #475569; border-left: 3px solid #94a3b8; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">– Advanced Features</span>
  </div>
  
  <div style="margin: 10px 0;">
    <strong>Pro Plan:</strong>
    <span style="background: #f0fdf4; color: #14532d; border-left: 3px solid #22c55e; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">✓ All Free Features</span>
    <span style="background: #f0fdf4; color: #14532d; border-left: 3px solid #22c55e; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">✓ Write Operations</span>
    <span style="background: #fefce8; color: #713f12; border-left: 3px solid #fbbf24; padding: 3px 10px; font-size: 12px; font-weight: 500; display: inline-block; margin: 4px;">⚡ Webhooks (Beta)</span>
  </div>
</div>

## Quick Reference

| Method | Endpoint | Status | Auth |
|--------|----------|--------|------|
| <span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace;">GET</span> | \`/api/users\` | <span style="background: #10b981; color: white; padding: 1px 6px; border-radius: 10px; font-size: 10px;">Active</span> | <span style="background: #e0e7ff; color: #4338ca; padding: 1px 6px; border-radius: 3px; font-size: 10px;">Required</span> |
| <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace;">POST</span> | \`/api/users\` | <span style="background: #10b981; color: white; padding: 1px 6px; border-radius: 10px; font-size: 10px;">Active</span> | <span style="background: #e0e7ff; color: #4338ca; padding: 1px 6px; border-radius: 3px; font-size: 10px;">Required</span> |
| <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; font-family: monospace;">DELETE</span> | \`/api/users/{id}\` | <span style="background: #f59e0b; color: white; padding: 1px 6px; border-radius: 10px; font-size: 10px;">Beta</span> | <span style="background: #ef4444; color: white; padding: 1px 6px; border-radius: 3px; font-size: 10px;">Admin</span> |`,
    slideIdPrefix: 'api-docs',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
  },
};

export const WithBadgesAndLabels: Story = {
  args: {
    content: `# Badges & Labels Showcase

Using inline HTML and CSS to create beautiful badges, labels, and status indicators.

## Status Badges

<div style="text-align: center; margin: 20px 0;">
  <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin: 6px;">✓ Active</span>
  <span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin: 6px;">⚠ Warning</span>
  <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin: 6px;">✕ Error</span>
  <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin: 6px;">ℹ Info</span>
  <span style="background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; margin: 6px;">★ Premium</span>
</div>

## Version Tags

<div style="text-align: center; margin: 20px 0;">
  <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; display: inline-block; margin: 6px;">v1.0.0</span>
  <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; display: inline-block; margin: 6px;">v2.0.0-beta</span>
  <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; display: inline-block; margin: 6px;">v3.0.0-alpha</span>
  <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; display: inline-block; margin: 6px;">deprecated</span>
</div>

## Technology Stack Badges

<div style="text-align: center; margin: 20px 0;">
  <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">React</span>
  <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">TypeScript</span>
  <span style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Tailwind CSS</span>
  <span style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Node.js</span>
</div>

## Priority Labels

<div style="text-align: center; margin: 20px 0;">
  <span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 3px 10px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-block; margin: 6px;">🔴 Critical</span>
  <span style="background: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-block; margin: 6px;">🟡 High</span>
  <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-block; margin: 6px;">🔵 Medium</span>
  <span style="background: #f0f9ff; color: #0c4a6e; border: 1px solid #e0f2fe; padding: 3px 10px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-block; margin: 6px;">⚪ Low</span>
</div>

## Build Status Indicators

<div style="display: flex; gap: 10px; margin: 20px 0;">
  <span style="background: #065f46; color: #ecfdf5; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
    <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; animation: pulse 2s infinite;"></span>
    Build Passing
  </span>
  <span style="background: #7c2d12; color: #fef2f2; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
    <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>
    Build Failed
  </span>
  <span style="background: #78350f; color: #fefce8; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
    <span style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; display: inline-block; animation: pulse 2s infinite;"></span>
    Building...
  </span>
</div>

## Feature Flags

<div style="margin: 20px 0;">
  <span style="background: #f0fdf4; color: #14532d; border-left: 3px solid #22c55e; padding: 4px 12px; font-size: 13px; font-weight: 500; display: inline-block; margin: 4px;">✓ Enabled</span>
  <span style="background: #f1f5f9; color: #475569; border-left: 3px solid #94a3b8; padding: 4px 12px; font-size: 13px; font-weight: 500; display: inline-block; margin: 4px;">– Disabled</span>
  <span style="background: #fefce8; color: #713f12; border-left: 3px solid #fbbf24; padding: 4px 12px; font-size: 13px; font-weight: 500; display: inline-block; margin: 4px;">⚡ Experimental</span>
  <span style="background: #f3f4f6; color: #6b7280; border-left: 3px solid #9ca3af; padding: 4px 12px; font-size: 13px; font-weight: 500; display: inline-block; margin: 4px; text-decoration: line-through;">Deprecated</span>
</div>

## Environment Badges

<div style="text-align: center; margin: 20px 0;">
  <span style="background: #dbeafe; color: #1e3a8a; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; margin: 6px;">DEV</span>
  <span style="background: #fed7aa; color: #7c2d12; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; margin: 6px;">STAGING</span>
  <span style="background: #bbf7d0; color: #14532d; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; margin: 6px;">PROD</span>
  <span style="background: #e9d5ff; color: #581c87; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; margin: 6px;">LOCAL</span>
</div>

## API Method Badges

<div style="text-align: center; margin: 20px 0;">
  <span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; display: inline-block; margin: 6px;">GET</span>
  <span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; display: inline-block; margin: 6px;">POST</span>
  <span style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; display: inline-block; margin: 6px;">PUT</span>
  <span style="background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; display: inline-block; margin: 6px;">PATCH</span>
  <span style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; display: inline-block; margin: 6px;">DELETE</span>
</div>

## Inline Documentation Tags

Here's a function with inline tags: <span style="background: #fef3c7; color: #78350f; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">TODO</span> implement error handling, and it's marked as <span style="background: #dbeafe; color: #1e3a8a; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">async</span> with a <span style="background: #dcfce7; color: #14532d; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">pure</span> function attribute.

## Complex Badge Combinations

<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <strong>User Status:</strong>
    <span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Online</span>
    <span style="background: #6366f1; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pro Member</span>
    <span style="background: linear-gradient(90deg, #f59e0b, #ef4444); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">Streak: 30 days</span>
    <span style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 3px 10px; border-radius: 12px; font-size: 12px;">Since 2024</span>
  </div>
</div>`,
    slideIdPrefix: 'badges',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
  },
};

export const WithHTMLContent: Story = {
  args: {
    content: `# HTML Support Demo

This slide demonstrates **HTML support** within markdown content.

## Basic HTML Elements

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
  <h3 style="margin: 0 0 10px 0;">🎨 Custom Styled Container</h3>
  <p style="margin: 0;">This is a custom HTML div with inline styles, gradients, and formatting.</p>
</div>

## Interactive Elements

<details style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
  <summary style="cursor: pointer; font-weight: bold; color: #333;">📦 Click to reveal more content</summary>
  <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px;">
    <p>Hidden content is now visible!</p>
    <ul>
      <li>Supports nested HTML</li>
      <li>Maintains styling</li>
      <li>Fully interactive</li>
    </ul>
  </div>
</details>

## Custom Tables

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background: #4a5568; color: white;">
      <th style="padding: 12px; text-align: left;">Feature</th>
      <th style="padding: 12px; text-align: center;">Support</th>
      <th style="padding: 12px; text-align: left;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #f7fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Inline Styles</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">✅</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Full CSS support</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Custom Classes</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">✅</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">With theme styles</td>
    </tr>
    <tr style="background: #f7fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Script Tags</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">❌</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Sanitized for security</td>
    </tr>
  </tbody>
</table>

## Layout Examples

<div style="display: flex; gap: 20px; margin: 20px 0;">
  <div style="flex: 1; background: #fed7d7; padding: 15px; border-radius: 8px;">
    <h4 style="margin: 0 0 8px 0; color: #742a2a;">Column 1</h4>
    <p style="margin: 0; color: #9b2c2c;">Flexbox layouts work!</p>
  </div>
  <div style="flex: 1; background: #d6f5d6; padding: 15px; border-radius: 8px;">
    <h4 style="margin: 0 0 8px 0; color: #22543d;">Column 2</h4>
    <p style="margin: 0; color: #276749;">Side by side content</p>
  </div>
  <div style="flex: 1; background: #bee3f8; padding: 15px; border-radius: 8px;">
    <h4 style="margin: 0 0 8px 0; color: #2c5282;">Column 3</h4>
    <p style="margin: 0; color: #2b6cb6;">Responsive design</p>
  </div>
</div>

## Mixed Markdown and HTML

You can freely mix markdown with HTML:

<blockquote style="background: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0;">
  <p style="margin: 0; font-style: italic; color: #4b5563;">
    "This is a <strong>custom blockquote</strong> with HTML styling mixed with **markdown formatting**!"
  </p>
  <footer style="margin-top: 8px; color: #6b7280; font-size: 14px;">
    — Using both HTML and Markdown
  </footer>
</blockquote>

## Form Elements

<div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
  <label style="display: block; margin-bottom: 8px; font-weight: bold;">
    Sample Input:
    <input type="text" placeholder="Type here..." style="display: block; margin-top: 4px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; width: 100%;" />
  </label>
  
  <label style="display: block; margin: 16px 0;">
    <input type="checkbox" style="margin-right: 8px;" />
    HTML checkbox (different from markdown checkboxes)
  </label>
  
  <button style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
    Styled Button
  </button>
</div>

---

*Note: Event handlers like \`onclick\` are sanitized for security, but the visual styling remains intact.*`,
    slideIdPrefix: 'html-demo',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
  },
};

export const CustomStyling: Story = {
  args: {
    content: `# Custom Styled Editor

This slide demonstrates the editable component with custom styling through the theme.

## Theme Integration

The editor respects the current theme:
- Background colors
- Text colors
- Border styles
- Font families
- Spacing values

## Responsive Design

The editor adapts to different screen sizes and maintains usability across devices.`,
    slideIdPrefix: 'custom',
    slideIndex: 0,
    isVisible: true,
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1500,
    containerWidth: 800,
  },
};
