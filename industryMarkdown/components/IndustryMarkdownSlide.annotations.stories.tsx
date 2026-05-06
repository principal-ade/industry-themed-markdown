import { ThemeProvider } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useCallback, useMemo, useState } from 'react';

import type { Annotation, AnnotationSelection, TextQuoteAnchor } from '../types/annotations';

import { IndustryMarkdownSlide } from './IndustryMarkdownSlide';

const SAMPLE_CONTENT = `# Inline annotations demo

This story exercises the annotation API. The phrase "silently swallowed" below
is anchored with a text-quote selector and gets a clickable indicator next to
it. Clicking the pill toggles an "active" state — that's the consumer's hook
to open a side panel.

Previously the API silently swallowed non-2xx responses, which made
debugging painful. After the rewrite, every error is surfaced with a
structured payload.

## Why

We want span-level granularity so reviewers can pin notes to specific phrases
inside a paragraph, not just whole headings.

Try selecting any text in this slide — an "Add note" pill appears at the end
of the selection. Pretend-clicking it would normally open the consumer's
composer.
`;

const ANNOTATIONS: Annotation<{ author: string }>[] = [
  {
    id: 'note-1',
    anchor: {
      exact: 'silently swallowed',
      prefix: 'Previously the API ',
      suffix: ' non-2xx responses',
    },
    count: 2,
    metadata: { author: 'Fernando' },
  },
  {
    id: 'note-2',
    anchor: {
      exact: 'span-level granularity',
      prefix: 'We want ',
      suffix: ' so reviewers',
    },
    count: 1,
    metadata: { author: 'Sam' },
  },
];

interface SelectionPillProps {
  selection: AnnotationSelection;
  onAdd: () => void;
}

function SelectionPill({ selection, onAdd }: SelectionPillProps) {
  const { rect } = selection;
  return (
    <div
      style={{
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.right - 60,
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={onAdd}
        style={{
          padding: '4px 10px',
          fontSize: 12,
          borderRadius: 12,
          border: '1px solid rgba(80, 140, 240, 0.7)',
          background: 'rgba(80, 140, 240, 0.95)',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        + Add note
      </button>
    </div>
  );
}

interface SavedNote {
  id: string;
  anchor: TextQuoteAnchor;
  body: string;
}

const DRAFT_ID = 'draft-annotation';

function AnnotationDemo() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<AnnotationSelection | null>(null);
  const [draftAnchor, setDraftAnchor] = useState<TextQuoteAnchor | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [notes, setNotes] = useState<SavedNote[]>([]);

  // Composed annotations list = baseline samples + saved notes + draft.
  // The draft is pushed in only while the composer is open so the same
  // highlight machinery keeps the about-to-be-anchored span visibly marked
  // even after the browser selection clears (e.g. when the textarea takes
  // focus). It uses `activeAnnotationId = DRAFT_ID` to get the bold style.
  const annotations = useMemo<Annotation<{ draft?: boolean; author?: string }>[]>(() => {
    const list: Annotation<{ draft?: boolean; author?: string }>[] = [
      ...ANNOTATIONS,
      ...notes.map(n => ({
        id: n.id,
        anchor: n.anchor,
        count: 1,
      })),
    ];
    if (draftAnchor) {
      list.push({
        id: DRAFT_ID,
        anchor: draftAnchor,
        metadata: { draft: true },
      });
    }
    return list;
  }, [notes, draftAnchor]);

  const handleSelectionChange = useCallback((s: AnnotationSelection | null) => {
    setPendingSelection(s);
  }, []);
  const handleAnnotationClick = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  }, []);

  const startDraft = () => {
    if (!pendingSelection) return;
    setDraftAnchor(pendingSelection.anchor);
    setActiveId(DRAFT_ID);
    setDraftBody('');
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };
  const cancelDraft = () => {
    setDraftAnchor(null);
    setDraftBody('');
    setActiveId(null);
  };
  const saveDraft = () => {
    if (!draftAnchor) return;
    const note: SavedNote = {
      id: `note-${Date.now()}`,
      anchor: draftAnchor,
      body: draftBody.trim() || '(empty note)',
    };
    setNotes(prev => [...prev, note]);
    setDraftAnchor(null);
    setDraftBody('');
    setActiveId(note.id);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <IndustryMarkdownSlide
        content={SAMPLE_CONTENT}
        slideIdPrefix="annotations-demo"
        slideIndex={0}
        isVisible
        annotations={annotations}
        activeAnnotationId={activeId}
        onSelectionChange={handleSelectionChange}
        onAnnotationClick={handleAnnotationClick}
      />

      {pendingSelection && !draftAnchor && (
        <SelectionPill selection={pendingSelection} onAdd={startDraft} />
      )}

      {draftAnchor && (
        <DraftComposer
          anchor={draftAnchor}
          body={draftBody}
          onChange={setDraftBody}
          onSave={saveDraft}
          onCancel={cancelDraft}
        />
      )}

      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          width: 260,
          padding: 12,
          background: 'rgba(20, 20, 28, 0.92)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 12,
          borderRadius: 6,
          zIndex: 999,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Annotation state</div>
        <div>activeId: {activeId ?? '—'}</div>
        <div>draft: {draftAnchor ? `"${draftAnchor.exact}"` : '—'}</div>
        <div style={{ marginTop: 6 }}>saved notes:</div>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          {notes.length === 0 ? (
            <li style={{ opacity: 0.5 }}>(none yet)</li>
          ) : (
            notes.map(n => (
              <li key={n.id} style={{ wordBreak: 'break-word', marginBottom: 4 }}>
                <div>"{n.anchor.exact}"</div>
                <div style={{ opacity: 0.7 }}>→ {n.body}</div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

interface DraftComposerProps {
  anchor: TextQuoteAnchor;
  body: string;
  onChange: (body: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function DraftComposer({ anchor, body, onChange, onSave, onCancel }: DraftComposerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 320,
        padding: 12,
        background: '#1f2233',
        color: 'white',
        border: '1px solid rgba(255,193,7,0.6)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 1001,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>New note</div>
      <div
        style={{
          fontSize: 12,
          opacity: 0.85,
          marginBottom: 8,
          padding: '4px 6px',
          background: 'rgba(255,193,7,0.15)',
          borderLeft: '3px solid rgba(255,193,7,0.8)',
        }}
      >
        anchored to: "{anchor.exact}"
      </div>
      <textarea
        value={body}
        onChange={e => onChange(e.target.value)}
        autoFocus
        placeholder="Write your note…"
        style={{
          width: '100%',
          minHeight: 60,
          padding: 6,
          fontSize: 13,
          background: '#11131c',
          color: 'white',
          border: '1px solid #333',
          borderRadius: 4,
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '4px 10px',
            background: 'transparent',
            color: 'white',
            border: '1px solid #555',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: '4px 10px',
            background: 'rgba(80,140,240,0.95)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof AnnotationDemo> = {
  title: 'IndustryMarkdown/IndustryMarkdownSlide/Annotations',
  component: AnnotationDemo,
  decorators: [
    Story => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OrphanedAnchor: Story = {
  render: () => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const orphanAnnotations = useMemo<Annotation[]>(
      () => [
        {
          id: 'orphan-1',
          anchor: { exact: 'this phrase does not exist in the body' },
          count: 5,
        },
        ...ANNOTATIONS,
      ],
      [],
    );
    const handleClick = useCallback((id: string) => {
      setActiveId(prev => (prev === id ? null : id));
    }, []);
    return (
      <div style={{ height: '100vh', width: '100%' }}>
        <IndustryMarkdownSlide
          content={SAMPLE_CONTENT}
          slideIdPrefix="annotations-orphan"
          slideIndex={0}
          isVisible
          annotations={orphanAnnotations}
          activeAnnotationId={activeId}
          onAnnotationClick={handleClick}
        />
      </div>
    );
  },
};

// --- Regression repros for tasks 3 + 4 -----------------------------------
//
// These stories reproduce the bugs documented in
//   backlog/tasks/3 - Inline annotations skip selector — inline code.md
//   backlog/tasks/4 - Inline annotations crash on cross-block ranges.md
// They are expected to FAIL on 0.1.88 and pass after the fixes land.

// Tiny, hand-verifiable cross-block fixture. Concatenated text-node content
// (per `buildTextIndex`) is exactly:
//   "Heading One\nFirst paragraph.\nSecond paragraph.\nHeading Two\nThird paragraph."
// react-markdown emits whitespace text nodes containing `\n` between
// adjacent block elements, so the resolver's `index.text` has one `\n`
// between blocks.
const CROSS_BLOCK_CONTENT = `# Heading One

First paragraph.

Second paragraph.

## Heading Two

Third paragraph.
`;

// Spans `<p>First paragraph.</p>` → `<p>Second paragraph.</p>` → `<h2>Heading Two</h2>`.
// Resolver finds `prefix + exact + suffix` =
//   "One\nFirst paragraph.\nSecond paragraph.\nHeading Two\nThird"
// in `index.text` (which contains `\n` text nodes between block siblings).
const CROSS_BLOCK_ANNOTATION: Annotation = {
  id: 'cross-block-1',
  anchor: {
    exact: 'First paragraph.\nSecond paragraph.\nHeading Two',
    prefix: 'One\n',
    suffix: '\nThird',
  },
};

const INLINE_CODE_CONTENT = `# Inline code anchor

Posts \`{ email, password }\` to /api/login when the user submits the form.
The handler validates the payload and returns either a session token or a
structured error.
`;

const INLINE_CODE_ANNOTATION: Annotation = {
  id: 'inline-code-1',
  anchor: {
    exact: 'Posts { email, password } to /api/login',
    prefix: 'code anchor\n',
    suffix: ' when the user submits',
  },
  count: 1,
};

interface CrashBoundaryProps {
  label: string;
  children: React.ReactNode;
}
interface CrashBoundaryState {
  error: Error | null;
}

class CrashBoundary extends React.Component<CrashBoundaryProps, CrashBoundaryState> {
  state: CrashBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): CrashBoundaryState {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.label}] render crashed:`, error);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 16,
            margin: 16,
            background: 'rgba(220, 60, 60, 0.12)',
            border: '1px solid rgba(220, 60, 60, 0.6)',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#a11',
            whiteSpace: 'pre-wrap',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
            {this.props.label}: render crashed
          </div>
          {String(this.state.error?.message ?? this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Task 4 repro. The annotation's `exact` spans three block parents
 * (paragraph → paragraph → heading). `wrapRange` reparents text nodes that
 * React still has fiber references to; the next time React commits a
 * mutation against the surrounding subtree, it throws
 *   NotFoundError: Failed to execute 'insertBefore' on 'Node'…
 *
 * The static initial mount alone is not enough to trip the bug — React
 * doesn't touch the mutated nodes again until something forces it to. The
 * "Force re-render" button below toggles `searchQuery`, which invalidates
 * `renderedChunks`'s memo and makes ReactMarkdown re-execute against the
 * already-mutated DOM. That's when the crash fires. The CrashBoundary
 * catches it so the rest of the page stays usable.
 *
 * After the fix: clicking the button repeatedly should never crash, and
 * the highlight should remain visible across all three blocks.
 */
export const CrossBlockRange: Story = {
  render: () => <CrossBlockRangeDemo />,
};

function CrossBlockRangeDemo() {
  const slideContainerRef = React.useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renderCount, setRenderCount] = useState(0);
  const [debug, setDebug] = useState<{
    text: string;
    matchAt: number;
    markerCount: number;
    foundSlide: boolean;
  } | null>(null);
  const forceReRender = () => {
    setSearchQuery(prev => (prev === '' ? '__noop__' : ''));
    setRenderCount(c => c + 1);
  };
  const inspect = React.useCallback(() => {
    const root = slideContainerRef.current?.querySelector('.markdown-slide') as HTMLElement | null;
    if (!root) {
      setDebug({ text: '', matchAt: -1, markerCount: 0, foundSlide: false });
      return;
    }
    const SKIP = 'script, style, code, pre';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        if (parent.hasAttribute('data-annotation-marker')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let text = '';
    let n = walker.nextNode();
    while (n) {
      text += n.nodeValue ?? '';
      n = walker.nextNode();
    }
    const needle =
      (CROSS_BLOCK_ANNOTATION.anchor.prefix ?? '') +
      CROSS_BLOCK_ANNOTATION.anchor.exact +
      (CROSS_BLOCK_ANNOTATION.anchor.suffix ?? '');
    const markerCount = root.querySelectorAll('.industry-md-annotation').length;
    setDebug({ text, matchAt: text.indexOf(needle), markerCount, foundSlide: true });
  }, []);

  // Auto-inspect after mount + after any forced re-render.
  React.useEffect(() => {
    const t = window.setTimeout(inspect, 50);
    return () => window.clearTimeout(t);
  }, [inspect, renderCount]);
  return (
    <CrashBoundary label="CrossBlockRange">
      <div ref={slideContainerRef} style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <IndustryMarkdownSlide
          content={CROSS_BLOCK_CONTENT}
          slideIdPrefix="annotations-cross-block"
          slideIndex={0}
          isVisible
          annotations={[CROSS_BLOCK_ANNOTATION]}
          searchQuery={searchQuery}
        />
        <div
          style={{
            position: 'fixed',
            right: 16,
            top: 16,
            width: 360,
            padding: 12,
            background: 'rgba(20, 20, 28, 0.92)',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: 11,
            borderRadius: 6,
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div>re-renders: {renderCount}</div>
          <button
            type="button"
            onClick={forceReRender}
            style={{
              padding: '6px 10px',
              background: 'rgba(220,60,60,0.95)',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Force re-render (toggles searchQuery)
          </button>
          <button
            type="button"
            onClick={inspect}
            style={{
              padding: '6px 10px',
              background: 'rgba(80,140,240,0.95)',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Inspect index.text
          </button>
          {debug && (
            <div style={{ wordBreak: 'break-all' }}>
              <div>found .markdown-slide: {String(debug.foundSlide)}</div>
              <div>match at: {debug.matchAt}</div>
              <div>marker spans in DOM: {debug.markerCount}</div>
              <div style={{ marginTop: 4, opacity: 0.85 }}>
                index.text: {JSON.stringify(debug.text)}
              </div>
            </div>
          )}
        </div>
      </div>
    </CrashBoundary>
  );
}

/**
 * Task 4 round-trip repro. Starts with no annotations — the user drags a
 * selection across the heading + paragraphs, clicks "Add note", saves. The
 * library both produced the anchor and is asked to render it. Catches the
 * `range.toString()` (with `\n`) vs. `index.text` (without `\n`) asymmetry
 * in `selectionToAnchor`/`resolveTextQuote` that makes round-tripped
 * cross-block anchors orphan. After the fix, the saved highlight should
 * appear across the dragged blocks.
 */
export const CrossBlockRangeViaSelection: Story = {
  render: () => (
    <CrashBoundary label="CrossBlockRangeViaSelection">
      <CrossBlockSelectionDemo />
    </CrashBoundary>
  ),
};

function CrossBlockSelectionDemo() {
  const [pendingSelection, setPendingSelection] = useState<AnnotationSelection | null>(null);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const annotations = useMemo<Annotation[]>(
    () => notes.map(n => ({ id: n.id, anchor: n.anchor, count: 1 })),
    [notes],
  );

  const onSelectionChange = useCallback((s: AnnotationSelection | null) => {
    setPendingSelection(s);
  }, []);
  const onAnnotationClick = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  }, []);

  const addNote = () => {
    if (!pendingSelection) return;
    const note: SavedNote = {
      id: `note-${Date.now()}`,
      anchor: pendingSelection.anchor,
      body: '(round-tripped)',
    };
    setNotes(prev => [...prev, note]);
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <IndustryMarkdownSlide
        content={CROSS_BLOCK_CONTENT}
        slideIdPrefix="annotations-cross-block-roundtrip"
        slideIndex={0}
        isVisible
        annotations={annotations}
        activeAnnotationId={activeId}
        onSelectionChange={onSelectionChange}
        onAnnotationClick={onAnnotationClick}
      />
      {pendingSelection && <SelectionPill selection={pendingSelection} onAdd={addNote} />}
      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          width: 320,
          padding: 12,
          background: 'rgba(20, 20, 28, 0.92)',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 11,
          borderRadius: 6,
          zIndex: 999,
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
          Drag across heading + paragraphs, click Add note
        </div>
        <div style={{ marginTop: 6 }}>saved:</div>
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          {notes.length === 0 ? (
            <li style={{ opacity: 0.5 }}>(none yet)</li>
          ) : (
            notes.map(n => (
              <li key={n.id} style={{ wordBreak: 'break-word', marginBottom: 4 }}>
                <div>exact: {JSON.stringify(n.anchor.exact)}</div>
                <div style={{ opacity: 0.7 }}>
                  prefix: {JSON.stringify(n.anchor.prefix ?? '')}
                </div>
                <div style={{ opacity: 0.7 }}>
                  suffix: {JSON.stringify(n.anchor.suffix ?? '')}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * Task 3 repro. The selection straddles an inline `<code>` span. On 0.1.88
 * the resolver's SKIP_SELECTOR includes `code`, so inline code text is
 * absent from the indexed string and `prefix + exact + suffix` cannot be
 * found. The annotation is silently orphaned. After the fix, the highlight
 * should cover the full phrase including the code text.
 */
export const InlineCodeAnchor: Story = {
  render: () => (
    <CrashBoundary label="InlineCodeAnchor">
      <div style={{ height: '100vh', width: '100%' }}>
        <IndustryMarkdownSlide
          content={INLINE_CODE_CONTENT}
          slideIdPrefix="annotations-inline-code"
          slideIndex={0}
          isVisible
          annotations={[INLINE_CODE_ANNOTATION]}
        />
      </div>
    </CrashBoundary>
  ),
};

/**
 * Mixes a known-bad cross-block anchor with a valid single-block anchor in
 * the same `annotations` array. Today the bad one tears down the slide and
 * the good one never renders. After the graceful-failure fix, the bad
 * anchor should be marked unresolved and the good one should still render.
 */
export const MixedAnnotationsDoNotCrash: Story = {
  render: () => {
    const mixed = useMemo<Annotation[]>(
      () => [
        CROSS_BLOCK_ANNOTATION,
        {
          id: 'single-block-ok',
          anchor: {
            exact: 'Third paragraph.',
            prefix: 'Two',
            suffix: '',
          },
          count: 1,
        },
      ],
      [],
    );
    return (
      <CrashBoundary label="MixedAnnotationsDoNotCrash">
        <div style={{ height: '100vh', width: '100%' }}>
          <IndustryMarkdownSlide
            content={CROSS_BLOCK_CONTENT}
            slideIdPrefix="annotations-mixed"
            slideIndex={0}
            isVisible
            annotations={mixed}
          />
        </div>
      </CrashBoundary>
    );
  },
};

// --- Marker placement showcase --------------------------------------------
//
// One annotation per scenario, each with a unique `count` so the badge
// itself labels which scenario it belongs to. Use this story to eyeball
// where the indicator host lands when the highlight ends in different DOM
// contexts (mid-paragraph, end-of-block, heading, list item, blockquote,
// inline code, wrapped lines, end-of-document, etc.).

const SHOWCASE_CONTENT = `# Marker placement showcase

## 1. Mid-paragraph short selection

Short note on a single phrase mid-paragraph here, the rest of the line continues afterward.

## 2. Mid-paragraph long selection

A longer multi-word phrase that spans across several words inline within one paragraph and ends here, with text continuing past it on the same line.

## 3. End of paragraph

Selection runs to the very end of this paragraph stops here.

## 4. Cross-block: paragraph to paragraph

This selection starts in this paragraph and continues into the next.

It ends somewhere in the middle of this second paragraph.

## 5. Cross-block ending in a heading

This paragraph leads into a heading.

### Sixth heading target

Then a paragraph follows.

## 6. Heading-only

### Selectable heading text only

Some prose after.

## 7. Single list item

- Selection lives entirely inside one list item here
- Adjacent untouched list item
- Another untouched list item

## 8. Cross list-item selection

- Starts inside this first list item and runs to
- the second list item, ending inside it.
- Final list item untouched.

## 9. Inside a blockquote

> Selection inside a blockquote that wraps onto multiple visual lines because the text is long enough to force the rendered slide to wrap it across line breaks.

## 10. Inline code crossing

Posts \`{ email, password }\` to /api/login when the user submits the form.

## 11. Wrapping multi-line selection

This is a long paragraph chosen so the selected phrase is forced to wrap across multiple visual lines so we can see how the badge sits relative to the wrapped highlight when the end of the range lands at the end of a wrapped line.

## 12. End of document

The very last sentence of this document ends here.
`;

const SHOWCASE_ANNOTATIONS: Annotation[] = [
  {
    id: 's1',
    count: 1,
    anchor: { exact: 'a single phrase mid-paragraph', prefix: 'Short note on ', suffix: ' here' },
  },
  {
    id: 's2',
    count: 2,
    anchor: {
      exact: 'longer multi-word phrase that spans across several words inline',
      prefix: 'A ',
      suffix: ' within one paragraph',
    },
  },
  {
    id: 's3',
    count: 3,
    anchor: {
      exact: 'runs to the very end of this paragraph stops here.',
      prefix: 'Selection ',
      suffix: '\n',
    },
  },
  {
    id: 's4',
    count: 4,
    anchor: {
      exact:
        'starts in this paragraph and continues into the next.\nIt ends somewhere in the middle of this second paragraph.',
      prefix: 'This selection ',
      suffix: '\n',
    },
  },
  {
    id: 's5',
    count: 5,
    anchor: {
      exact: 'leads into a heading.\nSixth heading target',
      prefix: 'This paragraph ',
      suffix: '\nThen',
    },
  },
  {
    id: 's6',
    count: 6,
    anchor: { exact: 'Selectable heading text only', prefix: '\n', suffix: '\n' },
  },
  {
    id: 's7',
    count: 7,
    anchor: {
      exact: 'lives entirely inside one list item here',
      prefix: 'Selection ',
      suffix: '\n',
    },
  },
  {
    id: 's8',
    count: 8,
    anchor: {
      exact: 'inside this first list item and runs to\nthe second list item, ending inside it.',
      prefix: 'Starts ',
      suffix: '\n',
    },
  },
  {
    id: 's9',
    count: 9,
    anchor: {
      exact:
        'inside a blockquote that wraps onto multiple visual lines because the text is long enough',
      prefix: 'Selection ',
      suffix: ' to force',
    },
  },
  {
    id: 's10',
    count: 10,
    anchor: {
      exact: 'Posts { email, password } to /api/login',
      prefix: '\n',
      suffix: ' when the user',
    },
  },
  {
    id: 's11',
    count: 11,
    anchor: {
      exact:
        'forced to wrap across multiple visual lines so we can see how the badge sits relative to the wrapped highlight',
      prefix: 'is ',
      suffix: ' when the end',
    },
  },
  {
    id: 's12',
    count: 12,
    anchor: { exact: 'last sentence of this document ends here.', prefix: 'The very ', suffix: '\n' },
  },
];

/**
 * One annotation per scenario, badge text = scenario number. Use the
 * legend below to map badges back to the structural context they're
 * anchored in. Resolution failures show up as missing badges; click an
 * annotation to confirm hit-testing works through the highlight.
 */
export const MarkerPlacementShowcase: Story = {
  render: () => <MarkerPlacementShowcaseDemo />,
};

function MarkerPlacementShowcaseDemo() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unresolvedIds, setUnresolvedIds] = useState<string[]>([]);
  const onAnnotationClick = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  }, []);

  // After mount, ask the DOM which hosts actually got inserted so we can
  // call out scenarios whose anchor strings didn't match.
  const slideContainerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const root = slideContainerRef.current?.querySelector('.markdown-slide');
      if (!root) return;
      const present = new Set<string>();
      root
        .querySelectorAll<HTMLElement>('.industry-md-annotation-indicator')
        .forEach(el => {
          const id = el.getAttribute('data-annotation-id');
          if (id) present.add(id);
        });
      setUnresolvedIds(SHOWCASE_ANNOTATIONS.filter(a => !present.has(a.id)).map(a => a.id));
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div ref={slideContainerRef} style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <IndustryMarkdownSlide
        content={SHOWCASE_CONTENT}
        slideIdPrefix="annotations-showcase"
        slideIndex={0}
        isVisible
        annotations={SHOWCASE_ANNOTATIONS}
        activeAnnotationId={activeId}
        onAnnotationClick={onAnnotationClick}
      />
      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          width: 280,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 12,
          background: 'rgba(20, 20, 28, 0.92)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          borderRadius: 6,
          zIndex: 999,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Marker placement legend</div>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.4 }}>
          <li>mid-paragraph, short</li>
          <li>mid-paragraph, long phrase</li>
          <li>end of paragraph</li>
          <li>cross-block (p → p)</li>
          <li>cross-block ending in heading</li>
          <li>heading only</li>
          <li>single list item</li>
          <li>cross-list-item</li>
          <li>blockquote (wrapped)</li>
          <li>across inline code</li>
          <li>multi-line wrapped selection</li>
          <li>end of document</li>
        </ol>
        <div style={{ marginTop: 8, opacity: 0.8 }}>
          active: {activeId ?? '—'}
        </div>
        {unresolvedIds.length > 0 && (
          <div style={{ marginTop: 8, color: '#ff9b9b' }}>
            unresolved: {unresolvedIds.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
