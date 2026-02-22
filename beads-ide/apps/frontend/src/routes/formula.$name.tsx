/**
 * Formula editor route with text/visual view toggle.
 * Displays formula TOML in text mode or as a DAG in visual mode.
 * Visual view updates automatically when TOML changes (one-way sync).
 */
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, type CSSProperties } from 'react'
import { useCook } from '../hooks/use-cook'
import { VarsPanel, VisualBuilder } from '../components/formulas'

// --- Types ---

type ViewMode = 'text' | 'visual'

// --- Styles ---

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0f172a',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #334155',
  backgroundColor: '#1e293b',
}

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#e2e8f0',
  fontFamily: 'monospace',
}

const toggleContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  padding: '4px',
}

const toggleButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 500,
  color: isActive ? '#ffffff' : '#94a3b8',
  backgroundColor: isActive ? '#3b82f6' : 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
})

const contentStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
}

const mainPanelStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const sidePanelStyle: CSSProperties = {
  width: '280px',
  borderLeft: '1px solid #334155',
  backgroundColor: '#1e293b',
  overflowY: 'auto',
  padding: '16px',
}

const textEditorStyle: CSSProperties = {
  flex: 1,
  padding: '16px',
  fontFamily: 'monospace',
  fontSize: '13px',
  color: '#e2e8f0',
  backgroundColor: '#0f172a',
  border: 'none',
  resize: 'none',
  outline: 'none',
  lineHeight: 1.6,
}

const visualContainerStyle: CSSProperties = {
  flex: 1,
  position: 'relative',
}

const loadingStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#94a3b8',
  fontSize: '14px',
}

const errorStyle: CSSProperties = {
  padding: '16px',
  backgroundColor: '#7f1d1d',
  color: '#fca5a5',
  borderRadius: '6px',
  margin: '16px',
  fontFamily: 'monospace',
  fontSize: '12px',
}

const statusBarStyle: CSSProperties = {
  padding: '8px 16px',
  borderTop: '1px solid #334155',
  backgroundColor: '#1e293b',
  fontSize: '11px',
  color: '#94a3b8',
  display: 'flex',
  justifyContent: 'space-between',
}

// --- Route Definition ---

export const Route = createFileRoute('/formula/$name')({
  component: FormulaPage,
})

// --- Main Component ---

function FormulaPage() {
  const { name } = Route.useParams()
  const [viewMode, setViewMode] = useState<ViewMode>('text')
  const [tomlContent, setTomlContent] = useState('')
  const [varValues, setVarValues] = useState<Record<string, string>>({})

  // Build formula path from route param
  // In a real app, this would map to actual file paths
  const formulaPath = name ? `formulas/${name}.toml` : null

  // Cook the formula to get steps and vars
  const { result, isLoading, error } = useCook(formulaPath, {
    mode: 'compile',
    vars: varValues,
    debounceMs: 300,
  })

  const handleToggleMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  const handleVarChange = useCallback((key: string, value: string) => {
    setVarValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleTomlChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTomlContent(e.target.value)
  }, [])

  return (
    <div style={containerStyle}>
      {/* Header with title and view toggle */}
      <div style={headerStyle}>
        <div style={titleStyle}>{name}.toml</div>
        <div style={toggleContainerStyle}>
          <button
            type="button"
            style={toggleButtonStyle(viewMode === 'text')}
            onClick={() => handleToggleMode('text')}
            aria-pressed={viewMode === 'text'}
          >
            Text
          </button>
          <button
            type="button"
            style={toggleButtonStyle(viewMode === 'visual')}
            onClick={() => handleToggleMode('visual')}
            aria-pressed={viewMode === 'visual'}
          >
            Visual
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={contentStyle}>
        <div style={mainPanelStyle}>
          {isLoading && (
            <div style={loadingStyle}>Cooking formula...</div>
          )}

          {error && (
            <div style={errorStyle}>
              Error: {error.message}
            </div>
          )}

          {!isLoading && !error && viewMode === 'text' && (
            <textarea
              style={textEditorStyle}
              value={tomlContent}
              onChange={handleTomlChange}
              placeholder="# Formula TOML content will appear here..."
              spellCheck={false}
            />
          )}

          {!isLoading && !error && viewMode === 'visual' && (
            <div style={visualContainerStyle}>
              {result?.steps ? (
                <VisualBuilder
                  steps={result.steps}
                  vars={result.vars}
                />
              ) : (
                <div style={loadingStyle}>No steps to visualize</div>
              )}
            </div>
          )}
        </div>

        {/* Side panel with variables */}
        {result?.vars && Object.keys(result.vars).length > 0 && (
          <div style={sidePanelStyle}>
            <VarsPanel
              vars={result.vars}
              values={varValues}
              onValueChange={handleVarChange}
              unboundVars={result.unbound_vars}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={statusBarStyle}>
        <span>
          {result?.formula ? `Formula: ${result.formula}` : 'No formula loaded'}
          {result?.version && ` v${result.version}`}
        </span>
        <span>
          {result?.steps?.length ?? 0} steps
          {result?.vars && ` · ${Object.keys(result.vars).length} variables`}
        </span>
      </div>
    </div>
  )
}
