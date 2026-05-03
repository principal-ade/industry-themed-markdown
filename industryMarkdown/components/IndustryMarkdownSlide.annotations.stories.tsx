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
