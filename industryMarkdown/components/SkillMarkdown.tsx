/**
 * SkillMarkdown component for rendering Agent Skills (SKILL.md files)
 * Parses frontmatter and renders skill metadata with markdown body
 */

import React from 'react';
import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';
import { Theme } from '@principal-ade/industry-theme';
import {
  parseSkillMarkdown,
  type ParsedSkill,
  type SkillMetadata,
  SkillParseError,
  SkillValidationError,
} from '@principal-ade/markdown-utils';

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
}

/**
 * Render skill metadata section
 */
const SkillMetadataSection: React.FC<{ metadata: SkillMetadata; theme: Theme }> = ({
  metadata,
  theme,
}) => {

  return (
    <div
      style={{
        borderBottom: `2px solid ${theme.colors.border}`,
        paddingBottom: theme.space[4],
        marginBottom: theme.space[4],
      }}
    >
      <div style={{ marginBottom: theme.space[3] }}>
        <h1
          style={{
            fontSize: theme.fontSizes[6],
            fontWeight: 700,
            margin: `0 0 ${theme.space[2]} 0`,
            color: theme.colors.text,
          }}
        >
          {metadata.name}
        </h1>
        <p
          style={{
            fontSize: theme.fontSizes[3],
            color: theme.colors.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {metadata.description}
        </p>
      </div>

      {(metadata.license ||
        metadata.compatibility ||
        metadata['allowed-tools'] ||
        metadata.metadata) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.space[3],
            padding: theme.space[3],
            background: theme.colors.background,
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {metadata.license && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: theme.fontSizes[0],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.colors.textSecondary,
                }}
              >
                License:
              </span>
              <span style={{ fontSize: theme.fontSizes[2], color: theme.colors.text }}>
                {metadata.license}
              </span>
            </div>
          )}

          {metadata.compatibility && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: theme.fontSizes[0],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.colors.textSecondary,
                }}
              >
                Compatibility:
              </span>
              <span style={{ fontSize: theme.fontSizes[2], color: theme.colors.text }}>
                {metadata.compatibility}
              </span>
            </div>
          )}

          {metadata['allowed-tools'] && metadata['allowed-tools'].length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: theme.fontSizes[0],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.colors.textSecondary,
                }}
              >
                Allowed Tools:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.space[1] }}>
                {metadata['allowed-tools'].map((tool, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-block',
                      padding: `${theme.space[1]} ${theme.space[2]}`,
                      background: theme.colors.primary,
                      color: theme.colors.background,
                      borderRadius: '4px',
                      fontSize: theme.fontSizes[0],
                      fontWeight: 500,
                      fontFamily: theme.fonts.mono,
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {metadata.metadata && Object.keys(metadata.metadata).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: theme.fontSizes[0],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.colors.textSecondary,
                }}
              >
                Metadata:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space[1] }}>
                {Object.entries(metadata.metadata).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: theme.space[2], fontSize: theme.fontSizes[0] }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: theme.colors.textSecondary,
                        minWidth: '100px',
                      }}
                    >
                      {key}:
                    </span>
                    <span
                      style={{
                        color: theme.colors.text,
                        fontFamily: theme.fonts.mono,
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
      <div className={className}>
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
        <div className={className} style={{ padding: theme.space[3] }}>
          <IndustryMarkdownSlide
            content={content}
            theme={theme}
            slideIdPrefix="skill-fallback"
            slideIndex={0}
            isVisible={true}
          />
        </div>
      );
    }

    return (
      <div className={className} style={{ padding: theme.space[4], textAlign: 'center' }}>
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: theme.space[4],
            maxWidth: '600px',
            margin: '0 auto',
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
                fontFamily: theme.fonts.mono,
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
          padding: theme.space[4],
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontStyle: 'italic',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: theme.space[3] }}>
      <SkillMetadataSection metadata={parsed.metadata} theme={theme} />
      <IndustryMarkdownSlide
        content={parsed.body}
        theme={theme}
        slideIdPrefix="skill-body"
        slideIndex={0}
        isVisible={true}
      />
    </div>
  );
};

export default SkillMarkdown;
