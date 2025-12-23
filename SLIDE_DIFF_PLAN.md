# Slide Diff Component - Implementation Plan

## Overview

Create a new component that displays side-by-side git diffs for markdown presentations, treating each slide as a distinct unit for comparison. The component will follow the book presentation mode layout, allowing users to focus on slides that have changed.

## Implementation Strategy

**Two-Phase Approach:**

1. **Phase 1: Core Diffing Logic in `@a24z/markdown-utils`**
   - Implement pure TypeScript diffing functions
   - No React dependencies
   - Fully unit tested
   - Framework-agnostic for reusability

2. **Phase 2: React UI Components in `themed-markdown`**
   - Build presentation components using diffing utilities
   - Integrate with existing book layout
   - Add interactive features and navigation

**Why This Separation?**

- `@a24z/markdown-utils` already handles core markdown parsing/presentation logic
- Diffing is a pure data operation that belongs with other utilities
- Better testability: pure functions are easier to test than React components
- Reusability: CLI tools, VS Code extensions, or server-side tools can use the same logic
- Consistent API: follows the pattern of `parseMarkdownIntoPresentation()`

## Goals

- Enable visual comparison of two versions of a markdown presentation
- Treat each slide as an independent unit for diffing
- Provide a familiar book-style layout for side-by-side comparison
- Allow users to filter and navigate only changed slides
- Integrate seamlessly with existing presentation infrastructure

## Component Architecture

### Main Component: `SlidePresentationDiff`

A React component that accepts two presentation versions and displays them in a side-by-side comparison view.

**Props Interface:**

```typescript
interface SlidePresentationDiffProps {
  // The two versions to compare
  beforePresentation: MarkdownPresentation;
  afterPresentation: MarkdownPresentation;

  // Optional configuration
  showOnlyChanged?: boolean; // Filter to show only slides with changes
  initialSlideIndex?: number; // Starting slide pair
  theme?: Theme; // Industry theme

  // Callbacks
  onSlideChange?: (beforeIndex: number, afterIndex: number) => void;
}
```

### Supporting Types

**New Type Definitions (`types/diff.ts`):**

```typescript
type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

interface SlideDiff {
  status: DiffStatus;
  beforeSlide?: MarkdownSlide; // undefined if added
  afterSlide?: MarkdownSlide; // undefined if removed
  beforeIndex?: number;
  afterIndex?: number;
  contentChanges?: TextDiff[]; // Line-by-line changes
  titleChanged?: boolean;
}

interface TextDiff {
  type: 'add' | 'remove' | 'unchanged';
  value: string;
  lineNumber?: number;
}

interface DiffSummary {
  totalSlides: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  moved: number;
}
```

## Features

### 1. Slide-Level Diffing

**Matching Algorithm:**

- Primary: Match slides by title (using `extractSlideTitle` utility)
- Secondary: Match by position if titles don't align
- Detect reordering by tracking index changes
- Handle edge cases: duplicate titles, untitled slides

**Detection Logic:**

- **Added**: Slide exists in after but not before
- **Removed**: Slide exists in before but not after
- **Modified**: Slide exists in both with different content
- **Unchanged**: Slide exists in both with identical content
- **Moved**: Slide exists in both but at different indices

### 2. Book-Style Layout

**Visual Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  Diff Summary Header: "5 of 12 slides changed" [Filter: ☑ ] │
├──────────────────────────┬──────────────────────────────────┤
│   BEFORE (Left Page)     │      AFTER (Right Page)          │
│   ┌──────────────────┐   │   ┌──────────────────┐           │
│   │ Slide Title      │   │   │ Slide Title      │           │
│   │ ─────────────    │   │   │ ─────────────    │           │
│   │ Content with     │   │   │ Content with     │           │
│   │ - deletions      │   │   │ + additions      │           │
│   │ highlighted red  │   │   │ highlighted green│           │
│   └──────────────────┘   │   └──────────────────┘           │
│   Page: Slide 3/12       │   Page: Slide 3/12               │
├──────────────────────────┴──────────────────────────────────┤
│              [← Prev Changed] [Next Changed →]               │
└──────────────────────────────────────────────────────────────┘
```

**Layout Implementation:**

- Reuse `AnimatedResizableLayout` from `SlidePresentationBook`
- Resizable divider with 50/50 default split
- Collapse/expand functionality for focusing on one side
- Synchronized scrolling (optional)

### 3. Diff Visualization

**Color Coding:**

- 🟢 Green: Added slides/content
- 🔴 Red: Removed slides/content
- 🟡 Yellow: Modified slides
- ⚪ Gray: Unchanged slides
- 🔵 Blue: Moved slides (optional indicator)

**Content-Level Highlighting:**

- Use `diff` library (or similar) for text-level comparison
- Inline highlighting within slide content
- Line-by-line diff display option
- Preserve markdown rendering while showing changes

**Empty Page Placeholders:**

- When slide is added: show empty/placeholder on left side
- When slide is removed: show empty/placeholder on right side
- Visual indicator: "Slide Added" / "Slide Removed" message

### 4. Diff-Only Filter Mode

**Filter Toggle:**

- Checkbox/switch in header: "Show only changed slides"
- When enabled, navigation skips unchanged slides
- Update page counter: "Changed slide 2 of 5" vs "Slide 3 of 12"

**Navigation Behavior:**

- "Next/Prev Changed" buttons
- Keyboard shortcuts (arrow keys)
- TOC highlighting shows only changed slides when filtered
- Remember filter state in session/local storage

### 5. Table of Contents Integration

**Enhanced TOC:**

- Show all slides with diff status indicators
- Color-coded entries matching diff status
- Filter TOC items when "show only changed" is active
- Clicking TOC item navigates to that slide pair
- Highlight both current slides (before/after indices)

### 6. Diff Summary Panel

**Header Information:**

```
Summary: 5 slides changed (2 added, 1 removed, 2 modified)
Showing: Slides 3-4 of 12 total
```

**Optional Detailed View:**

- Expandable summary showing all changes
- List of modified slide titles
- Quick jump to specific changes

## Implementation Details

### File Structure

**Phase 1: `@a24z/markdown-utils` Package**

```
packages/markdown-utils/
└── src/
    ├── diff/
    │   ├── index.ts                     # Public exports
    │   ├── diffPresentations.ts         # Main diff algorithm
    │   ├── matchSlides.ts               # Slide matching logic
    │   ├── textDiff.ts                  # Text-level diffing
    │   └── diffSummary.ts               # Summary calculations
    ├── types/
    │   └── diff.ts                      # Diff type definitions
    └── index.ts                         # Export diff functions
```

**Phase 2: `themed-markdown` Package**

```
industryMarkdown/
├── components/
│   ├── SlidePresentationDiff.tsx        # Main React component
│   ├── SlidePresentationDiff.stories.tsx # Storybook stories
│   ├── DiffSummaryHeader.tsx            # Summary header component
│   └── DiffSlideRenderer.tsx            # Renders slide with diff highlighting
├── hooks/
│   └── useSlideDiff.ts                  # React hook wrapper for diff utils
└── utils/
    └── diffRenderUtils.ts               # UI-specific diff rendering helpers
```

### Dependencies

**Phase 1 - `@a24z/markdown-utils`:**

- No new dependencies (uses existing presentation types)
- Optional: `diff` library for text comparison (https://www.npmjs.com/package/diff)
  - Or implement simple text diff algorithm inline
  - Or `fast-diff` for better performance

**Phase 2 - `themed-markdown`:**

- `@a24z/markdown-utils@^0.1.3` - Updated with diff utilities
- `@a24z/industry-theme` - Theming
- `@a24z/panels` - Layout components
- `react-markdown` - Markdown rendering
- Existing slide utilities

### Core Utilities (Phase 1: `@a24z/markdown-utils`)

**Public API Functions:**

```typescript
// packages/markdown-utils/src/diff/diffPresentations.ts
export function diffPresentations(
  before: MarkdownPresentation,
  after: MarkdownPresentation,
): PresentationDiff;

// packages/markdown-utils/src/diff/diffSummary.ts
export function calculateDiffSummary(diff: PresentationDiff): DiffSummary;

// packages/markdown-utils/src/diff/textDiff.ts
export function diffText(beforeContent: string, afterContent: string): TextDiff[];
```

**Internal Helper Functions:**

```typescript
// packages/markdown-utils/src/diff/matchSlides.ts
function matchSlides(beforeSlides: MarkdownSlide[], afterSlides: MarkdownSlide[]): SlideMatch[];

function slidesAreEqual(slide1: MarkdownSlide, slide2: MarkdownSlide): boolean;

function normalizeSlideContent(slide: MarkdownSlide): string;
```

**Type Definitions:**

```typescript
// packages/markdown-utils/src/types/diff.ts
export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

export interface SlideDiff {
  status: DiffStatus;
  beforeSlide?: MarkdownSlide;
  afterSlide?: MarkdownSlide;
  beforeIndex?: number;
  afterIndex?: number;
  contentChanges?: TextDiff[];
  titleChanged?: boolean;
}

export interface PresentationDiff {
  before: MarkdownPresentation;
  after: MarkdownPresentation;
  slideDiffs: SlideDiff[];
  summary: DiffSummary;
}

export interface TextDiff {
  type: 'add' | 'remove' | 'unchanged';
  value: string;
  lineNumber?: number;
}

export interface DiffSummary {
  totalSlidesBefore: number;
  totalSlidesAfter: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  moved: number;
}
```

### Component Structure (Phase 2: React Components)

**`SlidePresentationDiff.tsx`**:

```typescript
import { diffPresentations, PresentationDiff } from '@a24z/markdown-utils';

export function SlidePresentationDiff(props: SlidePresentationDiffProps) {
  // State
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);

  // Compute diffs using markdown-utils (memoized)
  const presentationDiff = useMemo(
    () => diffPresentations(beforePresentation, afterPresentation),
    [beforePresentation, afterPresentation]
  );

  // Filter diffs if needed
  const visibleDiffs = showOnlyChanged
    ? presentationDiff.slideDiffs.filter(d => d.status !== 'unchanged')
    : presentationDiff.slideDiffs;

  // Navigation handlers
  const goToNext = () => { /* ... */ };
  const goToPrev = () => { /* ... */ };

  // Render
  return (
    <div className="slide-diff-container">
      <DiffSummaryHeader
        summary={presentationDiff.summary}
        showOnlyChanged={showOnlyChanged}
        onToggleFilter={setShowOnlyChanged}
      />

      <AnimatedResizableLayout
        leftPanel={
          <DiffSlideRenderer
            slide={visibleDiffs[currentPairIndex].beforeSlide}
            status={visibleDiffs[currentPairIndex].status}
            side="before"
          />
        }
        rightPanel={
          <DiffSlideRenderer
            slide={visibleDiffs[currentPairIndex].afterSlide}
            status={visibleDiffs[currentPairIndex].status}
            side="after"
          />
        }
        splitRatio={splitRatio}
        onSplitChange={setSplitRatio}
      />

      <NavigationControls
        onNext={goToNext}
        onPrev={goToPrev}
        hasNext={currentPairIndex < visibleDiffs.length - 1}
        hasPrev={currentPairIndex > 0}
      />
    </div>
  );
}
```

**`useSlideDiff.ts` Hook (Optional):**

```typescript
import { diffPresentations, PresentationDiff } from '@a24z/markdown-utils';

export function useSlideDiff(before: MarkdownPresentation, after: MarkdownPresentation) {
  const diff = useMemo(() => diffPresentations(before, after), [before, after]);

  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleDiffs = useMemo(
    () =>
      showOnlyChanged ? diff.slideDiffs.filter(d => d.status !== 'unchanged') : diff.slideDiffs,
    [diff.slideDiffs, showOnlyChanged],
  );

  return {
    diff,
    visibleDiffs,
    currentDiff: visibleDiffs[currentIndex],
    currentIndex,
    showOnlyChanged,
    setShowOnlyChanged,
    goNext: () => setCurrentIndex(i => Math.min(i + 1, visibleDiffs.length - 1)),
    goPrev: () => setCurrentIndex(i => Math.max(i - 1, 0)),
    hasNext: currentIndex < visibleDiffs.length - 1,
    hasPrev: currentIndex > 0,
  };
}
```

## User Experience

### Navigation Flow

1. User loads component with before/after presentations
2. Component analyzes and displays first slide pair (or first changed slide if filtered)
3. User can:
   - Navigate forward/back through slides
   - Toggle "show only changed" filter
   - Click TOC to jump to specific slides
   - Resize panels to focus on one side
   - View summary of all changes

### Keyboard Shortcuts

- `Arrow Right` / `Arrow Left`: Navigate between slides
- `Shift + Arrow Right/Left`: Jump to next/prev changed slide
- `F`: Toggle filter (show only changed)
- `T`: Toggle TOC
- `[` / `]`: Adjust panel split

## Testing Strategy

### Phase 1: Unit Tests (`@a24z/markdown-utils`)

**`diffPresentations.test.ts`:**

- Basic diff: simple before/after with modifications
- Edge cases: empty presentations, single slide
- Slide matching with duplicate titles
- Slide matching with missing titles
- Reordering detection
- All slides unchanged
- All slides changed

**`matchSlides.test.ts`:**

- Match by title (exact match)
- Match by position when titles don't align
- Handle duplicate titles
- Handle untitled slides
- Empty slide arrays

**`textDiff.test.ts`:**

- Simple text additions
- Simple text deletions
- Mixed additions and deletions
- No changes
- Multi-line changes

**`diffSummary.test.ts`:**

- Accurate counts for all diff statuses
- Summary with no changes
- Summary with all changes

### Phase 2: Component Tests (`themed-markdown`)

- Renders before/after slides correctly
- Navigation works properly
- Filter toggle shows/hides unchanged slides
- TOC integration functions correctly
- Handles edge cases (no changes, all changes)
- Hook behavior with state management

### Storybook Stories

Create stories for:

1. **Basic diff**: Simple before/after with a few changes
2. **Only additions**: All new slides
3. **Only deletions**: Slides removed
4. **Mixed changes**: Add, remove, modify, move
5. **No changes**: Identical presentations
6. **Large presentation**: Many slides with scattered changes
7. **Edge cases**: Empty slides, duplicate titles

## Future Enhancements

### Phase 2 (Optional)

- Export diff as markdown report
- Syntax-aware diff for code blocks
- Image diff comparison
- Mermaid diagram diff visualization
- Git integration utilities (helper functions to fetch versions)
- Diff comments/annotations
- Three-way merge view (base, theirs, ours)
- Diff statistics graphs
- Batch/bulk review mode

### Phase 3 (Optional)

- Collaborative review features
- Approval workflow
- Change request comments
- Version timeline view
- Semantic diff (meaning-preserving changes)

## Success Criteria

The component will be considered complete when:

1. ✅ Displays two presentation versions side-by-side in book layout
2. ✅ Correctly identifies added, removed, modified, and unchanged slides
3. ✅ Highlights content changes within modified slides
4. ✅ Filter mode successfully shows only changed slides
5. ✅ Navigation works smoothly between slide pairs
6. ✅ TOC integration shows diff status
7. ✅ Summary header displays accurate change counts
8. ✅ Handles edge cases gracefully
9. ✅ Full Storybook documentation with examples
10. ✅ Unit tests pass with good coverage

## Timeline Estimate

### Phase 1: `@a24z/markdown-utils` (Core Logic)

- **Type definitions** (types/diff.ts): 30 mins - 1 hour
- **Text diff utilities** (textDiff.ts): 1-2 hours
- **Slide matching logic** (matchSlides.ts): 2-3 hours
- **Main diff algorithm** (diffPresentations.ts): 2-3 hours
- **Summary calculations** (diffSummary.ts): 1 hour
- **Unit tests**: 2-3 hours
- **Documentation & exports**: 30 mins - 1 hour

**Phase 1 Total**: ~9-14 hours

### Phase 2: `themed-markdown` (React UI)

- **Core Component** (SlidePresentationDiff.tsx): 3-4 hours
- **Diff Rendering** (DiffSlideRenderer.tsx): 2-3 hours
- **Summary Header** (DiffSummaryHeader.tsx): 1-2 hours
- **Navigation Controls**: 1 hour
- **React Hook** (useSlideDiff.ts): 1-2 hours
- **TOC Integration**: 1-2 hours
- **Storybook Stories**: 2-3 hours
- **Component Testing**: 1-2 hours
- **Styling & Polish**: 1-2 hours

**Phase 2 Total**: ~13-21 hours

### Overall Total: ~22-35 hours of focused development

**Recommended Approach:**

- Complete Phase 1 first, publish new version of `@a24z/markdown-utils`
- Then implement Phase 2 using the published utilities
- This allows for independent testing and validation of core logic

## Open Questions

1. Should we support markdown-level diff (comparing raw markdown) vs rendered diff (comparing parsed content)?
2. How should we handle slides that are reordered but not modified?
3. Should we provide export functionality (PDF, HTML report)?
4. Do we need undo/redo for navigation history?
5. Should synchronized scrolling be default or optional?

## Development Workflow

### Step 1: Setup `@a24z/markdown-utils` Development

1. Navigate to the `markdown-utils` package directory
2. Create feature branch for diff implementation
3. Set up local development with `bun link` for testing

### Step 2: Implement Phase 1 (Core Logic)

1. Create type definitions in `src/types/diff.ts`
2. Implement text diffing in `src/diff/textDiff.ts`
3. Implement slide matching in `src/diff/matchSlides.ts`
4. Implement main diff algorithm in `src/diff/diffPresentations.ts`
5. Implement summary calculations in `src/diff/diffSummary.ts`
6. Create public exports in `src/diff/index.ts`
7. Update main `src/index.ts` to export diff utilities
8. Write comprehensive unit tests

### Step 3: Publish New Version

1. Run tests: `bun test`
2. Build package: `bun run build`
3. Update version to `0.1.3` in `package.json`
4. Publish to npm: `npm publish`

### Step 4: Implement Phase 2 (React UI)

1. Update `themed-markdown` to use `@a24z/markdown-utils@^0.1.3`
2. Create React components
3. Build Storybook stories
4. Test integration
5. Document usage

## References

**Existing Code:**

- Book mode layout: `industryMarkdown/components/SlidePresentationBook.tsx`
- Slide utilities: `industryMarkdown/utils/presentationUtils.ts`
- Type definitions: `industryMarkdown/types/presentation.ts`
- Markdown utils package: `packages/markdown-utils/`

**External Libraries:**

- Text diff algorithm: https://www.npmjs.com/package/diff
- Alternative: https://www.npmjs.com/package/fast-diff

**Documentation:**

- `@a24z/markdown-utils` README for API patterns
- Existing Storybook stories for component examples
