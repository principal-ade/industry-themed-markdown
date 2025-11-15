import { ThemeProvider, theme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { IndustryEditableMermaidDiagram } from './IndustryEditableMermaidDiagram';

const meta: Meta<typeof IndustryEditableMermaidDiagram> = {
  title: 'IndustryMarkdown/IndustryEditableMermaidDiagram',
  component: IndustryEditableMermaidDiagram,
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

const flowchartCode = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Fix it]
    D --> B
    C --> E[End]`;

const sequenceDiagramCode = `sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hello Alice!
    Alice->>Charlie: Hello Charlie!
    Charlie-->>Alice: Hello Alice!
    Bob->>Charlie: Hello Charlie!
    Charlie-->>Bob: Hello Bob!`;

const classDigramCode = `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    
    class Dog {
        +String breed
        +bark()
        +wagTail()
    }
    
    class Cat {
        +String color
        +meow()
        +purr()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`;

const ganttChartCode = `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :done, req, 2024-01-01, 2024-01-15
    Design         :done, design, after req, 15d
    section Development
    Frontend       :active, frontend, 2024-02-01, 30d
    Backend        :backend, after frontend, 20d
    section Testing
    Unit Tests     :testing, after backend, 10d
    Integration    :integration, after testing, 5d`;

export const Default: Story = {
  args: {
    code: flowchartCode,
    id: 'default-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1000,
    onCodeChange: newCode => {
      console.log('Code changed:', newCode);
    },
  },
};

export const WithAutoSave: Story = {
  args: {
    code: `graph LR
    A[Auto-Save Demo] --> B[Make Changes]
    B --> C{Wait 2 seconds}
    C --> D[Auto-saves!]
    D --> E[Stay in edit mode]
    E --> B`,
    id: 'autosave-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
    onSave: async code => {
      console.log('Auto-saving Mermaid code...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Mermaid code saved:', code);
    },
  },
};

export const DarkTheme: Story = {
  args: {
    code: sequenceDiagramCode,
    id: 'dark-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1000,
  },
};

export const ReadOnly: Story = {
  args: {
    code: `graph TD
    A[Read-Only Diagram] --> B[Cannot Edit]
    B --> C[View Only Mode]
    C --> D[No Edit Button]`,
    id: 'readonly-mermaid',
    theme: theme,
    editable: false,
    showEditButton: false,
  },
};

export const NoAutoSave: Story = {
  args: {
    code: `graph LR
    A[Manual Save Only] --> B[Make Changes]
    B --> C[Click Save Button]
    C --> D[Or Press Ctrl+S]`,
    id: 'manual-save-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 0,
    onCodeChange: newCode => {
      console.log('Code changed (not auto-saved):', newCode);
    },
  },
};

// Interactive example with state management
const InteractiveExample = () => {
  const [code, setCode] = useState(`graph TD
    A[Interactive Example] --> B[Edit Count: 0]
    B --> C[Save Count: 0]
    C --> D[Last Saved: Never]`);

  const [saveCount, setSaveCount] = useState(0);
  const [editCount, setEditCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<string>('Never');

  const handleCodeChange = (newCode: string) => {
    setEditCount(prev => prev + 1);
    // Update the code with current stats
    const updatedCode = newCode
      .replace(/Edit Count: \d+/, `Edit Count: ${editCount + 1}`)
      .replace(/Save Count: \d+/, `Save Count: ${saveCount}`)
      .replace(/Last Saved: .*/, `Last Saved: ${lastSaved}`);

    setCode(updatedCode);
  };

  const handleSave = async (newCode: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const count = saveCount + 1;
    const time = new Date().toLocaleTimeString();

    setSaveCount(count);
    setLastSaved(time);

    // Update the code with new metadata
    const updatedCode = newCode
      .replace(/Save Count: \d+/, `Save Count: ${count}`)
      .replace(/Last Saved: .*/, `Last Saved: ${time}`);

    setCode(updatedCode);
    console.log(`Save #${count} at ${time}`);
  };

  return (
    <IndustryEditableMermaidDiagram
      code={code}
      id="interactive-mermaid"
      theme={theme}
      editable={true}
      showEditButton={true}
      autoSaveDelay={3000}
      onCodeChange={handleCodeChange}
      onSave={handleSave}
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveExample />,
};

export const SequenceDiagram: Story = {
  args: {
    code: sequenceDiagramCode,
    id: 'sequence-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1500,
  },
};

export const ClassDiagram: Story = {
  args: {
    code: classDigramCode,
    id: 'class-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1500,
  },
};

export const GanttChart: Story = {
  args: {
    code: ganttChartCode,
    id: 'gantt-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1500,
  },
};

export const ComplexFlowchart: Story = {
  args: {
    code: `graph TD
    Start([Start Process]) --> Input[/User Input/]
    Input --> Validate{Valid Data?}
    Validate -->|No| Error[Show Error Message]
    Error --> Input
    Validate -->|Yes| Process[Process Data]
    Process --> Database[(Save to Database)]
    Database --> Success{Success?}
    Success -->|No| Retry[Retry Logic]
    Retry --> Database
    Success -->|Yes| Notify[Send Notification]
    Notify --> Log[/Log Activity/]
    Log --> End([End Process])
    
    style Start fill:#90EE90
    style End fill:#FFB6C1
    style Error fill:#FFB6C1
    style Database fill:#87CEEB`,
    id: 'complex-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 2000,
  },
};

export const ErrorHandling: Story = {
  args: {
    code: `graph TD
    A[Error Demo] --> B[Valid Diagram]
    B --> C[Try adding invalid syntax]`,
    id: 'error-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 0, // Manual save only for testing
    onSave: async code => {
      // Simulate alternating success/failure
      const shouldFail = Math.random() > 0.5;

      if (shouldFail) {
        console.error('Save failed (simulated error)');
        throw new Error('Failed to save Mermaid diagram to server');
      }

      console.log('Save successful:', code);
    },
  },
};

export const ModalMode: Story = {
  args: {
    code: flowchartCode,
    id: 'modal-mermaid',
    theme: theme,
    editable: true,
    showEditButton: true,
    autoSaveDelay: 1500,
    isModalMode: true,
  },
};
