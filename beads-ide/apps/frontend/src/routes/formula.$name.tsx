import type { SlingRequest } from '@beads-ide/shared'
/**
 * Formula editor route with text/visual view toggle and sling workflow.
 * Displays formula TOML in text mode or as a DAG in visual mode.
 * Visual view updates automatically when TOML changes (one-way sync).
 * Includes Cook preview and Sling dispatch functionality.
 */
import { createFileRoute } from '@tanstack/react-router'
import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { SlingDialog, TextEditor, VarsPanel, VisualBuilder } from '../components/formulas'
import { useCook, useFormulaContent, useSling } from '../hooks'
import { type FormulaParseError, parseAndValidateFormula } from '../lib/formula-parser'

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

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
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

const buttonBaseStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'background 0.15s ease',
}

const cookButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: '#374151',
  color: '#e5e7eb',
}

const slingButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  background: '#3b82f6',
  color: '#fff',
}

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
  const [parseErrors, setParseErrors] = useState<FormulaParseError[]>([])
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [slingDialogOpen, setSlingDialogOpen] = useState(false)

  // Load formula content from disk
  const {
    content: loadedContent,
    isLoading: contentLoading,
    error: contentError,
  } = useFormulaContent(name ?? null)

  // Set content when loaded from disk
  useEffect(() => {
    if (loadedContent && !tomlContent) {
      setTomlContent(loadedContent)
      // Parse initial content
      const result = parseAndValidateFormula(loadedContent)
      if (!result.ok) {
        setParseErrors(result.errors)
      }
    }
  }, [loadedContent, tomlContent])

  // Build formula path from route param
  const formulaPath = name ? `formulas/${name}.toml` : null

  // Cook the formula to get steps and vars
  const { result, isLoading, error, cook } = useCook(formulaPath, {
    mode: 'compile',
    vars: varValues,
    debounceMs: 300,
  })

  // Sling hook
  const { result: slingResult, isLoading: isSlinging, sling, reset: resetSling } = useSling()

  const handleToggleMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  const handleVarChange = useCallback((key: string, value: string) => {
    setVarValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleTomlChange = useCallback((content: string) => {
    setTomlContent(content)
    // Parse and validate on change
    const result = parseAndValidateFormula(content)
    if (!result.ok) {
      setParseErrors(result.errors)
    } else {
      setParseErrors([])
    }
  }, [])

  const handleCook = useCallback(() => {
    cook()
  }, [cook])

  const handleOpenSling = useCallback(() => {
    resetSling()
    setSlingDialogOpen(true)
  }, [resetSling])

  const handleSlingClose = useCallback(() => {
    setSlingDialogOpen(false)
  }, [])

  const handleSlingExecute = useCallback(
    async (target: string) => {
      const request: SlingRequest = {
        formula_path: formulaPath ?? '',
        target,
        vars: Object.keys(varValues).length > 0 ? varValues : undefined,
      }
      return sling(request)
    },
    [formulaPath, varValues, sling]
  )

  const handleNavigateToResults = useCallback((moleculeId: string) => {
    console.log('Navigate to molecule:', moleculeId)
    setSlingDialogOpen(false)
    // TODO: Navigate to molecule view
  }, [])

  return (
    <div style={containerStyle}>
      {/* Header with title, view toggle, and action buttons */}
      <div style={headerStyle}>
        <div style={titleStyle}>{name}.toml</div>
        <div style={actionsStyle}>
          <button type="button" onClick={handleCook} style={cookButtonStyle} disabled={isLoading}>
            {isLoading ? 'Cooking...' : 'Cook Preview'}
          </button>
          <button
            type="button"
            onClick={handleOpenSling}
            style={slingButtonStyle}
            title="Dispatch to agent (Cmd+Shift+S)"
          >
            Sling
          </button>
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
      </div>

      {/* Main content area */}
      <div style={contentStyle}>
        <div style={mainPanelStyle}>
          {(isLoading || contentLoading) && (
            <div style={loadingStyle}>
              {contentLoading ? 'Loading formula...' : 'Cooking formula...'}
            </div>
          )}

          {(error || contentError) && (
            <div style={errorStyle}>Error: {(error || contentError)?.message}</div>
          )}

          {!isLoading && !contentLoading && !error && !contentError && viewMode === 'text' && (
            <TextEditor value={tomlContent} onChange={handleTomlChange} errors={parseErrors} />
          )}

          {!isLoading && !contentLoading && !error && !contentError && viewMode === 'visual' && (
            <div style={visualContainerStyle}>
              {result?.steps ? (
                <VisualBuilder steps={result.steps} vars={result.vars} />
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

      <SlingDialog
        isOpen={slingDialogOpen}
        onClose={handleSlingClose}
        formulaPath={formulaPath ?? ''}
        vars={varValues}
        onSling={handleSlingExecute}
        isLoading={isSlinging}
        result={slingResult}
        onNavigateToResults={handleNavigateToResults}
      />
    </div>
  )
}
