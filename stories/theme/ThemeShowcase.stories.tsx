import {
  Theme,
  ThemeProvider,
  ThemeShowcase,
  glassmorphismTheme,
  matrixMinimalTheme,
  matrixTheme,
  regalTheme,
  slateTheme,
  terminalTheme,
} from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

// Interactive theme editor demo
const InteractiveThemeEditor = () => {
  const [selectedTheme, setSelectedTheme] = useState<
    'terminal' | 'regal' | 'glassmorphism' | 'slate' | 'matrix' | 'matrixMinimal'
  >('slate');
  const [showValues, setShowValues] = useState(true);
  const [sections, setSections] = useState<
    ('colors' | 'typography' | 'spacing' | 'shadows' | 'radii')[]
  >(['colors', 'typography', 'spacing', 'shadows', 'radii']);

  const themes = {
    terminal: terminalTheme,
    regal: regalTheme,
    glassmorphism: glassmorphismTheme,
    slate: slateTheme,
    matrix: matrixTheme,
    matrixMinimal: matrixMinimalTheme,
  };

  const currentTheme = themes[selectedTheme];

  return (
    <div>
      {/* Control Panel */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Theme Selector */}
          <div>
            <label style={{ color: '#fff', marginRight: '10px', fontSize: '14px' }}>Theme:</label>
            <select
              value={selectedTheme}
              onChange={e =>
                setSelectedTheme(
                  e.target.value as
                    | 'terminal'
                    | 'regal'
                    | 'glassmorphism'
                    | 'slate'
                    | 'matrix'
                    | 'matrixMinimal',
                )
              }
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="slate">Slate (New)</option>
              <option value="terminal">Terminal</option>
              <option value="regal">Regal</option>
              <option value="glassmorphism">Glassmorphism</option>
              <option value="matrix">Matrix</option>
              <option value="matrixMinimal">Matrix Minimal</option>
            </select>
          </div>

          {/* Show Values Toggle */}
          <div>
            <label style={{ color: '#fff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showValues}
                onChange={e => setShowValues(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Show Values
            </label>
          </div>

          {/* Section Toggles */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {(['colors', 'typography', 'spacing', 'shadows', 'radii'] as const).map(section => (
              <label key={section} style={{ color: '#fff', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={sections.includes(section)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSections([...sections, section]);
                    } else {
                      setSections(sections.filter(s => s !== section));
                    }
                  }}
                  style={{ marginRight: '4px' }}
                />
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Showcase */}
      <ThemeShowcase
        theme={currentTheme}
        title={`${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)} Theme`}
        showValues={showValues}
        sections={sections}
      />
    </div>
  );
};

// Wrapped in ThemeProvider for proper context
const ThemedShowcase: React.FC<{ theme: Theme; title: string }> = ({ theme, title }) => (
  <ThemeProvider theme={theme}>
    <ThemeShowcase theme={theme} title={title} />
  </ThemeProvider>
);

// Storybook meta
const meta: Meta = {
  title: 'IndustryTheme/ThemeShowcase Component',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <InteractiveThemeEditor />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive theme editor with controls to explore different themes and toggle sections.',
      },
    },
  },
};

export const Terminal: Story = {
  render: () => <ThemedShowcase theme={terminalTheme} title="Terminal Theme Showcase" />,
};

export const Regal: Story = {
  render: () => <ThemedShowcase theme={regalTheme} title="Regal Theme Showcase" />,
};

export const Glassmorphism: Story = {
  render: () => <ThemedShowcase theme={glassmorphismTheme} title="Glassmorphism Theme Showcase" />,
};

export const Slate: Story = {
  render: () => <ThemedShowcase theme={slateTheme} title="Slate Theme Showcase" />,
};

export const Matrix: Story = {
  render: () => <ThemedShowcase theme={matrixTheme} title="Matrix Theme Showcase" />,
};

export const MatrixMinimal: Story = {
  render: () => <ThemedShowcase theme={matrixMinimalTheme} title="Matrix Minimal Theme Showcase" />,
};

export const CompactView: Story = {
  render: () => (
    <ThemeShowcase
      theme={terminalTheme}
      title="Compact View (Values Hidden)"
      showValues={false}
      sections={['colors', 'typography']}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing only colors and typography without raw values.',
      },
    },
  },
};

export const ColorsOnly: Story = {
  render: () => <ThemeShowcase theme={regalTheme} title="Colors Only View" sections={['colors']} />,
  parameters: {
    docs: {
      description: {
        story: 'Focused view showing only the color palette.',
      },
    },
  },
};
