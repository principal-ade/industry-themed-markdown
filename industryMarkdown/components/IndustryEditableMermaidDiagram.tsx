import { Theme } from '@principal-ade/industry-theme';
import { Pencil, Save, X } from 'lucide-react';

import { IndustryMermaidDiagram } from './IndustryMermaidDiagram';

export interface IndustryEditableMermaidDiagramProps {
  code: string;
  id: string;
  theme: Theme;
  onCodeChange?: (newCode: string) => void;
  onSave?: (code: string) => Promise<void>;
  autoSaveDelay?: number;
  editable?: boolean;
  showEditButton?: boolean;
  onCopyError?: (mermaidCode: string, errorMessage: string) => void;
  onError?: (hasError: boolean) => void;
  rootMargin?: string;
  isModalMode?: boolean;
}

export const IndustryEditableMermaidDiagram: React.FC<IndustryEditableMermaidDiagramProps> = ({
  code,
  id,
  theme,
  onCodeChange,
  onSave,
  autoSaveDelay = 1000,
  editable = true,
  showEditButton = true,
  onCopyError,
  onError,
  rootMargin,
  isModalMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Update edit code when prop changes
  useEffect(() => {
    setEditCode(code);
  }, [code]);

  // Auto-save functionality
  useEffect(() => {
    if (isEditing && autoSaveDelay && onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleSave(false); // Auto-save shouldn't exit edit mode
      }, autoSaveDelay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editCode, isEditing, autoSaveDelay]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(0, 0);
    }, 100);
  }, []);

  const handleCancel = useCallback(() => {
    setEditCode(code);
    setIsEditing(false);
  }, [code]);

  const handleSave = useCallback(
    async (exitEditMode = true) => {
      if (onCodeChange) {
        onCodeChange(editCode);
      }

      if (onSave) {
        setIsSaving(true);
        try {
          await onSave(editCode);
        } catch (error) {
          console.error('Failed to save:', error);
        } finally {
          setIsSaving(false);
        }
      }

      if (exitEditMode) {
        setIsEditing(false);
      }
    },
    [editCode, onCodeChange, onSave],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave],
  );

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setEditCode(textarea.value);

    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  if (isEditing) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
        }}
      >
        {/* Edit Mode Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: theme.space[3],
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.muted,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.space[2],
              fontSize: theme.fontSizes[1],
              color: theme.colors.textSecondary,
            }}
          >
            <Pencil size={16} />
            <span>Editing Mermaid Diagram</span>
            {autoSaveDelay && <span>(Auto-save enabled)</span>}
          </div>
          <div
            style={{
              display: 'flex',
              gap: theme.space[2],
            }}
          >
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.space[1],
                padding: `${theme.space[1]}px ${theme.space[3]}px`,
                backgroundColor: theme.colors.primary,
                color: theme.colors.background,
                border: 'none',
                borderRadius: theme.radii[1],
                fontSize: theme.fontSizes[1],
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.space[1],
                padding: `${theme.space[1]}px ${theme.space[3]}px`,
                backgroundColor: theme.colors.secondary,
                color: theme.colors.text,
                border: 'none',
                borderRadius: theme.radii[1],
                fontSize: theme.fontSizes[1],
                cursor: 'pointer',
              }}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>

        {/* Edit Mode Content */}
        <div
          style={{
            flex: 1,
            padding: theme.space[4],
            overflow: 'auto',
            display: 'flex',
            gap: theme.space[4],
          }}
        >
          {/* Code Editor */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: theme.space[2],
                fontSize: theme.fontSizes[2],
                fontWeight: theme.fontWeights.semibold,
                color: theme.colors.text,
              }}
            >
              Mermaid Code
            </h3>
            <textarea
              ref={textareaRef}
              value={editCode}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                minHeight: '300px',
                padding: theme.space[3],
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii[2],
                fontFamily: theme.fonts.monospace,
                fontSize: theme.fontSizes[1],
                lineHeight: theme.lineHeights.relaxed,
                resize: 'none',
                outline: 'none',
              }}
              placeholder="Enter your Mermaid diagram code here..."
            />
          </div>

          {/* Live Preview */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: theme.space[2],
                fontSize: theme.fontSizes[2],
                fontWeight: theme.fontWeights.semibold,
                color: theme.colors.text,
              }}
            >
              Live Preview
            </h3>
            <div
              style={{
                flex: 1,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii[2],
                overflow: 'auto',
                backgroundColor: theme.colors.backgroundSecondary,
              }}
            >
              <IndustryMermaidDiagram
                code={editCode}
                id={`${id}-preview`}
                theme={theme}
                onCopyError={onCopyError}
                onError={onError}
                rootMargin={rootMargin}
                isModalMode={isModalMode}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Edit Button */}
      {editable && showEditButton && (
        <button
          onClick={handleEdit}
          style={{
            position: 'absolute',
            top: theme.space[2],
            left: theme.space[2],
            display: 'flex',
            alignItems: 'center',
            gap: theme.space[1],
            padding: `${theme.space[2]}px ${theme.space[3]}px`,
            backgroundColor: theme.colors.primary,
            color: theme.colors.background,
            border: 'none',
            borderRadius: theme.radii[2],
            fontSize: theme.fontSizes[1],
            fontWeight: theme.fontWeights.medium,
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          }}
        >
          <Pencil size={16} />
          Edit Diagram
        </button>
      )}

      {/* Mermaid Diagram */}
      <IndustryMermaidDiagram
        code={code}
        id={id}
        theme={theme}
        onCopyError={onCopyError}
        onError={onError}
        rootMargin={rootMargin}
        isModalMode={isModalMode}
      />
    </div>
  );
};
