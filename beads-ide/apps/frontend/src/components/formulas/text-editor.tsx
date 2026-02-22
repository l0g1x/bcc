/**
 * CodeMirror 6 TOML editor for .formula.toml files.
 * Provides syntax validation, undo/redo, and inline error display.
 */
import { useCallback, useEffect, useRef } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import type { FormulaParseError } from '../../lib/formula-parser'

export interface TextEditorProps {
  /** Initial TOML content */
  value: string
  /** Called when content changes */
  onChange: (value: string) => void
  /** Parse errors to display inline */
  errors?: FormulaParseError[]
  /** Whether the editor is read-only */
  readOnly?: boolean
  /** Additional class name for the container */
  className?: string
}

/** Dark theme colors matching the app shell */
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#60a5fa',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '16px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#60a5fa',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#334155 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#334155 !important',
  },
  '.cm-gutters': {
    backgroundColor: '#0f172a',
    color: '#64748b',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-gutter': {
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
    textAlign: 'right',
  },
  '.cm-activeLine': {
    backgroundColor: '#1e293b',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#334155',
    color: '#fbbf24',
  },
  '.cm-line': {
    padding: '0 16px',
  },
  // Error line styling
  '.cm-error-line': {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeft: '3px solid #ef4444',
  },
  // Scrollbar styling
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#1e293b',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#475569',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#64748b',
  },
})

/** TOML-like syntax highlighting (basic token coloring) */
const tomlHighlight = syntaxHighlighting(defaultHighlightStyle)

/** Create base extensions for the editor */
function createExtensions(onChange: (value: string) => void, readOnly: boolean): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    bracketMatching(),
    highlightSelectionMatches(),
    history(),
    tomlHighlight,
    darkTheme,
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    }),
    EditorState.readOnly.of(readOnly),
    EditorView.lineWrapping,
  ]
}

/**
 * CodeMirror 6 editor component for TOML formula files.
 */
export function TextEditor({
  value,
  onChange,
  errors = [],
  readOnly = false,
  className = '',
}: TextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const valueRef = useRef(value)

  // Track current value to avoid unnecessary updates
  valueRef.current = value

  // Initialize editor - only runs on mount to avoid recreation
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only runs on mount
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(onChange, readOnly),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Update content when value prop changes (external update)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentContent = view.state.doc.toString()
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      })
    }
  }, [value])


  // Handle undo via ref (for external buttons)
  const handleUndo = useCallback(() => {
    if (viewRef.current) {
      undo(viewRef.current)
    }
  }, [])

  // Handle redo via ref (for external buttons)
  const handleRedo = useCallback(() => {
    if (viewRef.current) {
      redo(viewRef.current)
    }
  }, [])

  // Expose undo/redo handlers via data attributes for parent access
  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  return (
    <div className={className} style={containerStyle}>
      {/* Error display */}
      {errors.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '12px',
            fontFamily: 'ui-monospace, monospace',
            color: '#fca5a5',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
        >
          {errors.map((error, i) => (
            <div key={`${error.line ?? 0}-${error.message.slice(0, 20)}`} style={{ marginBottom: i < errors.length - 1 ? '4px' : 0 }}>
              {error.line ? (
                <span>
                  <strong>Line {error.line}</strong>
                  {error.column ? `:${error.column}` : ''}: {error.message}
                </span>
              ) : (
                <span>{error.message}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Editor container */}
      <div
        ref={containerRef}
        data-undo={handleUndo.toString()}
        data-redo={handleRedo.toString()}
        style={{ flex: 1, overflow: 'auto' }}
      />
    </div>
  )
}

export type { FormulaParseError }
