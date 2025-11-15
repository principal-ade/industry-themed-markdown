import { Theme } from '@principal-ade/industry-theme';
import { Search, X } from 'lucide-react';
import React, { useRef, useEffect } from 'react';

export interface SearchResult {
  slideIndex: number;
  count: number;
}

export interface SlideSearchBarProps {
  showSearch: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  currentSearchResult: number;
  searchStartSlide: number; // Where search was initiated from
  slideTitles: string[];
  theme: Theme;
  onResultClick: (index: number, slideIndex: number) => void;
  onClose: () => void;
  onClear?: () => void; // Optional clear callback
}

export const SlideSearchBar: React.FC<SlideSearchBarProps> = ({
  showSearch,
  searchQuery,
  setSearchQuery,
  searchResults,
  currentSearchResult,
  searchStartSlide,
  slideTitles,
  theme,
  onResultClick,
  onClose,
  onClear,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: theme.colors.backgroundSecondary,
        borderTop: `1px solid ${theme.colors.border}`,
        transform: showSearch ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.2s ease-out',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${theme.space[3]}px`,
        gap: theme.space[3],
      }}
    >
      {/* Search Icon */}
      <Search size={20} style={{ color: theme.colors.textSecondary, flexShrink: 0 }} />

      {/* Search Input */}
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search slides..."
        style={{
          flex: '0 0 auto',
          width: '240px',
          padding: `${theme.space[1]}px ${theme.space[2]}px`,
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii[1],
          color: theme.colors.text,
          fontSize: theme.fontSizes[1],
          fontFamily: theme.fonts.body,
          outline: 'none',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = theme.colors.primary;
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = theme.colors.border;
        }}
      />

      {/* Results Summary */}
      {searchQuery && (
        <div
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.fontSizes[0],
            fontFamily: theme.fonts.body,
            flexShrink: 0,
          }}
        >
          {searchResults.length > 0 ? (
            <>
              {searchResults.reduce((sum, r) => sum + r.count, 0)} matches in {searchResults.length}{' '}
              slide
              {searchResults.length !== 1 ? 's' : ''}
            </>
          ) : (
            'No results'
          )}
        </div>
      )}

      {/* Result Pills */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: theme.space[1],
          overflowX: 'auto',
          overflowY: 'hidden',
          alignItems: 'center',
          minHeight: '32px',
          padding: `0 ${theme.space[1]}px`,
        }}
      >
        {/* Always show search start slide if not in results and we have a query */}
        {searchQuery && !searchResults.some(r => r.slideIndex === searchStartSlide) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.space[1],
              padding: `${theme.space[1]}px ${theme.space[2]}px`,
              backgroundColor: theme.colors.backgroundSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii[2],
              color: theme.colors.textSecondary,
              fontSize: theme.fontSizes[0],
              fontFamily: theme.fonts.monospace,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: 0.7,
            }}
          >
            <span style={{ fontWeight: 600 }}>#{searchStartSlide + 1} (start)</span>
            <span style={{ opacity: 0.8 }}>(no matches)</span>
          </div>
        )}
        {searchResults.map((result, index) => (
          <button
            key={result.slideIndex}
            onClick={() => onResultClick(index, result.slideIndex)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: theme.space[1],
              padding: `${theme.space[1]}px ${theme.space[2]}px`,
              backgroundColor:
                currentSearchResult === index ? theme.colors.primary : theme.colors.background,
              border: `1px solid ${
                currentSearchResult === index ? theme.colors.primary : theme.colors.border
              }`,
              borderRadius: theme.radii[2],
              color: currentSearchResult === index ? theme.colors.background : theme.colors.text,
              fontSize: theme.fontSizes[0],
              fontFamily: theme.fonts.monospace,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseOver={e => {
              if (currentSearchResult !== index) {
                e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
              }
            }}
            onMouseOut={e => {
              if (currentSearchResult !== index) {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }
            }}
            title={`Slide ${result.slideIndex + 1}: ${slideTitles[result.slideIndex]}`}
          >
            <span style={{ fontWeight: 600 }}>#{result.slideIndex + 1}</span>
            <span style={{ opacity: 0.8 }}>
              ({result.count} match{result.count !== 1 ? 'es' : ''})
            </span>
          </button>
        ))}
      </div>

      {/* Clear Button (when there's a query) */}
      {searchQuery && onClear && (
        <button
          onClick={() => {
            onClear();
            searchInputRef.current?.focus();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `${theme.space[1]}px ${theme.space[2]}px`,
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii[1],
            color: theme.colors.textSecondary,
            fontSize: theme.fontSizes[0],
            fontFamily: theme.fonts.body,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Clear search"
        >
          Clear
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          backgroundColor: 'transparent',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii[1],
          color: theme.colors.textSecondary,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseOver={e => {
          e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Close search (Esc)"
      >
        <X size={16} />
      </button>
    </div>
  );
};
