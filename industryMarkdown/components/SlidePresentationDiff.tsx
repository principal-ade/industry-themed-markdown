import { Theme } from '@principal-ade/industry-theme';
import { diffPresentations, PresentationDiff, SlideDiff , MarkdownPresentation } from '@principal-ade/markdown-utils';
import { AnimatedResizableLayout } from '@principal-ade/panels';
import React, { useMemo, useState } from 'react';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

export interface SlidePresentationDiffProps {
  /** The before version of the presentation */
  beforePresentation: MarkdownPresentation;
  /** The after version of the presentation */
  afterPresentation: MarkdownPresentation;
  /** Theme to apply */
  theme?: Theme;
  /** Control whether visible slides automatically capture focus */
  autoFocusOnVisible?: boolean;
  /** Show only slides with changes */
  showOnlyChanged?: boolean;
  /** Initial slide index to display */
  initialSlideIndex?: number;
  /** Callback when slide changes */
  onSlideChange?: (beforeIndex?: number, afterIndex?: number) => void;
}

/**
 * SlidePresentationDiff - Display side-by-side comparison of two presentation versions
 *
 * Shows markdown presentations in a book-style layout with before/after versions,
 * allowing users to see changes at the slide level.
 */
export function SlidePresentationDiff({
  beforePresentation,
  afterPresentation,
  theme,
  autoFocusOnVisible = true,
  showOnlyChanged: initialShowOnlyChanged = false,
  initialSlideIndex = 0,
  onSlideChange,
}: SlidePresentationDiffProps) {
  // State
  const [currentPairIndex, setCurrentPairIndex] = useState(initialSlideIndex);
  const [showOnlyChanged, setShowOnlyChanged] = useState(initialShowOnlyChanged);

  // Compute diffs using markdown-utils
  const presentationDiff: PresentationDiff = useMemo(
    () => diffPresentations(beforePresentation, afterPresentation),
    [beforePresentation, afterPresentation]
  );

  // Filter diffs if needed
  const visibleDiffs: SlideDiff[] = useMemo(
    () => showOnlyChanged
      ? presentationDiff.slideDiffs.filter(d => d.status !== 'unchanged')
      : presentationDiff.slideDiffs,
    [presentationDiff.slideDiffs, showOnlyChanged]
  );

  // Get current diff
  const currentDiff = visibleDiffs[currentPairIndex] || visibleDiffs[0];

  // Navigation handlers
  const goToNext = () => {
    const nextIndex = Math.min(currentPairIndex + 1, visibleDiffs.length - 1);
    setCurrentPairIndex(nextIndex);
    const diff = visibleDiffs[nextIndex];
    onSlideChange?.(diff?.beforeIndex, diff?.afterIndex);
  };

  const goToPrev = () => {
    const prevIndex = Math.max(currentPairIndex - 1, 0);
    setCurrentPairIndex(prevIndex);
    const diff = visibleDiffs[prevIndex];
    onSlideChange?.(diff?.beforeIndex, diff?.afterIndex);
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setShowOnlyChanged(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPairIndex, visibleDiffs.length]);

  if (!currentDiff) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: theme?.colors?.text || '#333'
      }}>
        No slides to display
      </div>
    );
  }

  const getStatusColor = (status: SlideDiff['status']) => {
    switch (status) {
      case 'added': return '#22c55e'; // green
      case 'removed': return '#ef4444'; // red
      case 'modified': return '#f59e0b'; // yellow/orange
      case 'moved': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: SlideDiff['status']) => {
    switch (status) {
      case 'added': return 'Added';
      case 'removed': return 'Removed';
      case 'modified': return 'Modified';
      case 'moved': return 'Moved';
      default: return 'Unchanged';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      backgroundColor: theme?.colors?.background || '#ffffff',
      color: theme?.colors?.text || '#1f2937',
    }}>
      {/* Header with summary */}
      <div style={{
        padding: '1rem 2rem',
        borderBottom: `1px solid ${theme?.colors?.border || '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Presentation Diff
          </h2>
          <div style={{
            fontSize: '0.875rem',
            color: theme?.colors?.textSecondary || '#6b7280',
          }}>
            {presentationDiff.summary.added > 0 && (
              <span style={{ marginRight: '1rem' }}>
                <strong style={{ color: '#22c55e' }}>+{presentationDiff.summary.added}</strong> added
              </span>
            )}
            {presentationDiff.summary.removed > 0 && (
              <span style={{ marginRight: '1rem' }}>
                <strong style={{ color: '#ef4444' }}>-{presentationDiff.summary.removed}</strong> removed
              </span>
            )}
            {presentationDiff.summary.modified > 0 && (
              <span style={{ marginRight: '1rem' }}>
                <strong style={{ color: '#f59e0b' }}>~{presentationDiff.summary.modified}</strong> modified
              </span>
            )}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOnlyChanged}
            onChange={(e) => {
              setShowOnlyChanged(e.target.checked);
              setCurrentPairIndex(0);
            }}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem' }}>Show only changed slides</span>
        </label>
      </div>

      {/* Current slide status indicator */}
      <div style={{
        padding: '0.75rem 2rem',
        backgroundColor: theme?.colors?.surface || '#f9fafb',
        borderBottom: `1px solid ${theme?.colors?.border || '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(currentDiff.status),
          }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {getStatusLabel(currentDiff.status)}
          </span>
          {currentDiff.titleChanged && (
            <span style={{
              fontSize: '0.75rem',
              color: theme?.colors?.textSecondary || '#6b7280',
              marginLeft: '0.5rem'
            }}>
              (title changed)
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.875rem', color: theme?.colors?.textSecondary || '#6b7280' }}>
          Slide {currentPairIndex + 1} of {visibleDiffs.length}
          {showOnlyChanged && ` (${presentationDiff.slideDiffs.length} total)`}
        </div>
      </div>

      {/* Book-style dual pane layout */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatedResizableLayout
          defaultSize={50}
          leftPanel={
            <div style={{
              height: '100%',
              overflow: 'auto',
              padding: '2rem',
              backgroundColor: currentDiff.status === 'removed'
                ? 'rgba(239, 68, 68, 0.05)'
                : theme?.colors?.background || '#ffffff',
            }}>
              {currentDiff.beforeSlide ? (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: theme?.colors?.textSecondary || '#6b7280',
                    marginBottom: '1rem',
                    letterSpacing: '0.05em',
                  }}>
                    Before
                  </div>
                  <IndustryMarkdownSlide
                    content={currentDiff.beforeSlide.location.content}
                    slideIdPrefix={`diff-before-${currentDiff.beforeIndex || 0}`}
                    slideIndex={currentDiff.beforeIndex || 0}
                    theme={theme}
                    autoFocusOnVisible={autoFocusOnVisible}
                  />
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme?.colors?.textSecondary || '#9ca3af',
                  fontSize: '0.875rem',
                }}>
                  Slide added in new version
                </div>
              )}
            </div>
          }
          rightPanel={
            <div style={{
              height: '100%',
              overflow: 'auto',
              padding: '2rem',
              backgroundColor: currentDiff.status === 'added'
                ? 'rgba(34, 197, 94, 0.05)'
                : theme?.colors?.background || '#ffffff',
            }}>
              {currentDiff.afterSlide ? (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: theme?.colors?.textSecondary || '#6b7280',
                    marginBottom: '1rem',
                    letterSpacing: '0.05em',
                  }}>
                    After
                  </div>
                  <IndustryMarkdownSlide
                    content={currentDiff.afterSlide.location.content}
                    slideIdPrefix={`diff-after-${currentDiff.afterIndex || 0}`}
                    slideIndex={currentDiff.afterIndex || 0}
                    theme={theme}
                    autoFocusOnVisible={autoFocusOnVisible}
                  />
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: theme?.colors?.textSecondary || '#9ca3af',
                  fontSize: '0.875rem',
                }}>
                  Slide removed from new version
                </div>
              )}
            </div>
          }
        />
      </div>

      {/* Navigation controls */}
      <div style={{
        padding: '1rem 2rem',
        borderTop: `1px solid ${theme?.colors?.border || '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        backgroundColor: theme?.colors?.surface || '#f9fafb',
      }}>
        <button
          onClick={goToPrev}
          disabled={currentPairIndex === 0}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: '0.375rem',
            border: `1px solid ${theme?.colors?.border || '#d1d5db'}`,
            backgroundColor: theme?.colors?.background || '#ffffff',
            color: theme?.colors?.text || '#374151',
            cursor: currentPairIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentPairIndex === 0 ? 0.5 : 1,
          }}
        >
          ← Previous
        </button>
        <button
          onClick={goToNext}
          disabled={currentPairIndex >= visibleDiffs.length - 1}
          style={{
            padding: '0.5rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: '0.375rem',
            border: `1px solid ${theme?.colors?.border || '#d1d5db'}`,
            backgroundColor: theme?.colors?.background || '#ffffff',
            color: theme?.colors?.text || '#374151',
            cursor: currentPairIndex >= visibleDiffs.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentPairIndex >= visibleDiffs.length - 1 ? 0.5 : 1,
          }}
        >
          Next →
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div style={{
        padding: '0.5rem 2rem',
        fontSize: '0.75rem',
        color: theme?.colors?.textSecondary || '#9ca3af',
        textAlign: 'center',
        backgroundColor: theme?.colors?.surface || '#f9fafb',
      }}>
        Use ← → arrow keys to navigate | Press F to toggle filter
      </div>
    </div>
  );
}
