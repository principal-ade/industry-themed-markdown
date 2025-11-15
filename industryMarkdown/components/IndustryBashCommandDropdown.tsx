import { Theme, theme as defaultTheme } from '@principal-ade/industry-theme';
import { BashCommand, getCommandDisplayName } from '@principal-ade/markdown-utils';
import { Play, ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface IndustryBashCommandDropdownProps {
  commands: BashCommand[];
  allCommands: string;
  onRunCommand: (command: string) => Promise<void>;
  darkMode?: boolean; // Keep for backward compatibility but not used
  slideIdPrefix: string;
  theme?: Theme; // Optional theme override
}

export const IndustryBashCommandDropdown: React.FC<IndustryBashCommandDropdownProps> = ({
  commands,
  allCommands,
  onRunCommand,
  darkMode: _darkMode, // Kept for backward compatibility
  slideIdPrefix: _slideIdPrefix,
  theme: themeOverride,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get theme from context or use override
  const theme = themeOverride ?? defaultTheme;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRunCommand = async (command: string) => {
    setIsRunning(true);
    setIsOpen(false);
    try {
      await onRunCommand(command);
    } finally {
      setIsRunning(false);
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: `${theme.space[1]}px ${theme.space[2]}px`,
    backgroundColor: isRunning ? theme.colors.muted : theme.colors.primary,
    color: theme.colors.background,
    border: 'none',
    borderRadius: theme.radii[1],
    fontSize: theme.fontSizes[1],
    cursor: isRunning ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.space[2],
    opacity: isRunning ? 0.6 : 1,
    minWidth: '70px',
    justifyContent: 'center',
    fontFamily: theme.fonts.body,
    fontWeight: theme.fontWeights.medium,
    transition: 'all 0.2s ease',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
    backgroundColor: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii[2],
    boxShadow: theme.shadows[2],
    zIndex: 10,
    minWidth: '200px',
    maxWidth: '350px',
    maxHeight: '300px',
    overflow: 'auto',
    marginTop: theme.space[1],
  };

  const dropdownItemStyle = (isHovered: boolean): React.CSSProperties => ({
    padding: `${theme.space[2]}px ${theme.space[3]}px`,
    cursor: 'pointer',
    backgroundColor: isHovered ? theme.colors.backgroundSecondary : 'transparent',
    fontSize: theme.fontSizes[1],
    color: theme.colors.text,
    fontFamily: theme.fonts.monospace,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    transition: 'background-color 0.2s ease',
  });

  const hasMultipleCommands = commands.length > 1;
  const singleCommand = commands.length === 1 ? commands[0].command : allCommands;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {hasMultipleCommands ? (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isRunning}
            style={buttonStyle}
            onMouseEnter={e => {
              if (!isRunning) {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }
            }}
            onMouseLeave={e => {
              if (!isRunning) {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }
            }}
          >
            {isRunning ? (
              <span style={{ fontSize: theme.fontSizes[1] }}>...</span>
            ) : (
              <>
                <Play size={14} />
                Run
                <ChevronDown size={14} />
              </>
            )}
          </button>
          {isOpen && (
            <div style={dropdownStyle}>
              <div
                style={{
                  padding: `${theme.space[2]}px ${theme.space[3]}px`,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  fontWeight: theme.fontWeights.semibold,
                  fontSize: theme.fontSizes[1],
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.body,
                }}
              >
                Select command to run
              </div>
              <div
                style={{
                  padding: `${theme.space[2]}px ${theme.space[3]}px`,
                  backgroundColor: theme.colors.muted,
                  cursor: 'pointer',
                  fontSize: theme.fontSizes[1],
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  transition: 'background-color 0.2s ease',
                }}
                onClick={() => handleRunCommand(allCommands)}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = theme.colors.muted;
                }}
              >
                🚀 Run all ({commands.length} commands)
              </div>
              {commands.map((cmd, index) => {
                const [isHovered, setIsHovered] = useState(false);
                return (
                  <div
                    key={index}
                    style={dropdownItemStyle(isHovered)}
                    onClick={() => handleRunCommand(cmd.command)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    title={cmd.command}
                  >
                    {getCommandDisplayName(cmd)}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => handleRunCommand(singleCommand)}
          disabled={isRunning}
          style={buttonStyle}
          onMouseEnter={e => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }
          }}
          onMouseLeave={e => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
            }
          }}
        >
          {isRunning ? (
            <span style={{ fontSize: theme.fontSizes[1] }}>...</span>
          ) : (
            <>
              <Play size={14} />
              Run
            </>
          )}
        </button>
      )}
    </div>
  );
};
