/**
 * SkillMarkdown component for rendering Agent Skills (SKILL.md files)
 * Parses frontmatter and renders skill metadata with markdown body
 */

import { Theme } from '@principal-ade/industry-theme';
import {
  parseSkillMarkdown,
  type ParsedSkill,
  type SkillMetadata,
  SkillParseError,
  SkillValidationError,
} from '@principal-ade/markdown-utils';
import React from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

export interface SkillMarkdownProps {
  /** Raw SKILL.md content with frontmatter */
  content: string;
  /** Theme object for styling */
  theme: Theme;
  /** Optional class name for styling */
  className?: string;
  /** Optional callback when skill is parsed */
  onParsed?: (skill: ParsedSkill) => void;
  /** Optional callback when parsing fails */
  onError?: (error: Error) => void;
  /** Show raw content on parse error instead of error message */
  showRawOnError?: boolean;
  /** Container width to pass to IndustryMarkdownSlide (skips ResizeObserver if provided) */
  containerWidth?: number;
}

/**
 * Convert date string to relative time (e.g., "2 days ago", "3 months ago")
 */
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch {
    return dateString; // Return original string if parsing fails
  }
};

/**
 * Render skill metadata section
 */
const SkillMetadataSection: React.FC<{ metadata: SkillMetadata; theme: Theme }> = ({
  metadata,
  theme,
}) => {
  return (
    <div style={{
      borderBottom: `2px solid ${theme.colors.border}`,
      paddingBottom: theme.space[3],
      marginBottom: theme.space[2],
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space[2] }}>
          <h1
            style={{
              fontSize: theme.fontSizes[6],
              fontWeight: 700,
              margin: 0,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            {metadata.name}
          </h1>
          {(metadata.metadata?.['last-updated'] || metadata.license) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: theme.space[1], marginLeft: theme.space[3], marginTop: theme.space[1] }}>
              {metadata.metadata?.['last-updated'] && (
                <span
                  style={{
                    fontSize: theme.fontSizes[0],
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fonts.monospace,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatRelativeTime(metadata.metadata['last-updated'])}
                </span>
              )}
              {metadata.license && (
                <span
                  style={{
                    fontSize: theme.fontSizes[1],
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fonts.monospace,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {metadata.license}
                </span>
              )}
            </div>
          )}
        </div>
        <p
          style={{
            fontSize: theme.fontSizes[3],
            color: theme.colors.textSecondary,
            margin: 0,
            lineHeight: 1.5,
            fontFamily: theme.fonts.body,
          }}
        >
          {metadata.description}
        </p>
    </div>
  );
};

/**
 * SkillMarkdown component
 *
 * Renders Agent Skills markdown with frontmatter parsing
 *
 * @example
 * ```tsx
 * <SkillMarkdown
 *   content={skillContent}
 *   onParsed={(skill) => console.log('Parsed:', skill.metadata.name)}
 * />
 * ```
 */
export const SkillMarkdown: React.FC<SkillMarkdownProps> = ({
  content,
  theme,
  className = '',
  onParsed,
  onError,
  showRawOnError = false,
  containerWidth,
}) => {
  const [parsed, setParsed] = React.useState<ParsedSkill | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    try {
      const skill = parseSkillMarkdown(content);
      setParsed(skill);
      setError(null);
      onParsed?.(skill);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setParsed(null);
      onError?.(error);
    }
  }, [content, onParsed, onError]);

  // Safety check for theme
  if (!theme || !theme.space) {
    return (
      <div className={className} style={{ width: '100%', height: '100%' }}>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#856404' }}>
          Error: Theme not available. Wrap component in ThemeProvider.
        </div>
      </div>
    );
  }

  if (error) {
    if (showRawOnError) {
      // Fall back to rendering raw markdown
      return (
        <div
          className={className}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            background: theme.colors.background,
          }}
        >
          <div style={{ padding: theme.space[3] }}>
            <IndustryMarkdownSlide
              content={content}
              theme={theme}
              slideIdPrefix="skill-fallback"
              slideIndex={0}
              isVisible={true}
              containerWidth={containerWidth}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: theme.space[4],
          background: theme.colors.background,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: theme.space[4],
            maxWidth: '600px',
          }}
        >
          <h2 style={{ color: '#856404', marginTop: 0 }}>Failed to parse SKILL.md</h2>
          <p
            style={{
              fontWeight: 600,
              color: '#856404',
              fontSize: theme.fontSizes[0],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {error instanceof SkillParseError && 'Parse Error'}
            {error instanceof SkillValidationError && 'Validation Error'}
            {!(error instanceof SkillParseError) &&
              !(error instanceof SkillValidationError) &&
              'Error'}
          </p>
          <p style={{ color: '#856404', margin: `${theme.space[3]} 0` }}>{error.message}</p>
          {error instanceof SkillValidationError && error.field && (
            <p
              style={{
                fontFamily: theme.fonts.monospace,
                color: '#856404',
                fontSize: theme.fontSizes[0],
              }}
            >
              Field: {error.field}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: theme.space[4],
          color: theme.colors.textSecondary,
          fontStyle: 'italic',
          background: theme.colors.background,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.background,
      }}
    >
      <div style={{ padding: theme.space[3], paddingBottom: 0 }}>
        <SkillMetadataSection metadata={parsed.metadata} theme={theme} />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: theme.space[3], paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: theme.space[4], alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <IndustryMarkdownSlide
              content={parsed.body}
              theme={theme}
              slideIdPrefix="skill-body"
              slideIndex={0}
              isVisible={true}
              containerWidth={containerWidth}
            />
          </div>
          {(parsed.metadata.compatibility ||
            parsed.metadata['allowed-tools'] ||
            parsed.metadata.metadata) && (
            <div
              style={{
                width: '300px',
                flexShrink: 0,
                padding: theme.space[3],
                background: theme.colors.background,
                position: 'sticky',
                top: theme.space[3],
              }}
            >
              {parsed.metadata.compatibility && (
                <div style={{ marginBottom: theme.space[3] }}>
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontWeight: 600,
                      fontSize: theme.fontSizes[0],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.colors.textSecondary,
                      marginBottom: theme.space[1],
                    }}
                  >
                    Compatibility
                  </div>
                  <div style={{ fontSize: theme.fontSizes[1], color: theme.colors.text, fontFamily: theme.fonts.body }}>
                    {parsed.metadata.compatibility}
                  </div>
                </div>
              )}

              {parsed.metadata['allowed-tools'] && parsed.metadata['allowed-tools'].length > 0 && (
                <div style={{ marginBottom: theme.space[3] }}>
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontWeight: 600,
                      fontSize: theme.fontSizes[0],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.colors.textSecondary,
                      marginBottom: theme.space[1],
                    }}
                  >
                    Allowed Tools
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.space[1] }}>
                    {parsed.metadata['allowed-tools'].map((tool, index) => (
                      <span
                        key={index}
                        style={{
                          display: 'inline-block',
                          paddingTop: theme.space[2],
                          paddingBottom: theme.space[2],
                          paddingLeft: theme.space[3],
                          paddingRight: theme.space[3],
                          background: theme.colors.primary,
                          color: theme.colors.background,
                          borderRadius: '4px',
                          fontSize: theme.fontSizes[0],
                          fontWeight: 500,
                          fontFamily: theme.fonts.monospace,
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {parsed.metadata.metadata && Object.keys(parsed.metadata.metadata).length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontWeight: 600,
                      fontSize: theme.fontSizes[0],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: theme.colors.textSecondary,
                      marginBottom: theme.space[1],
                    }}
                  >
                    Metadata
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
                    {Object.entries(parsed.metadata.metadata)
                      .filter(([key]) => key !== 'last-updated')
                      .map(([key, value]) => (
                        <div key={key}>
                          <div
                            style={{
                              fontSize: theme.fontSizes[0],
                              fontWeight: 600,
                              color: theme.colors.textSecondary,
                              fontFamily: theme.fonts.body,
                            }}
                          >
                            {key}:
                          </div>
                          <div
                            style={{
                              fontSize: theme.fontSizes[1],
                              color: theme.colors.text,
                              fontFamily: theme.fonts.monospace,
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillMarkdown;
