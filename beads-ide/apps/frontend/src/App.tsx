import { useCallback, useState } from 'react'
import type { Placeholder, SlingRequest } from '@beads-ide/shared'
import { CommandPalette, useDefaultActions } from './components/layout/command-palette'
import { SlingDialog } from './components/formulas'
import { useSling } from './hooks'

type ViewMode = 'graph' | 'list' | 'wave'

export default function App() {
  const item: Placeholder = { id: 'beads-ide' }
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [slingDialogOpen, setSlingDialogOpen] = useState(false)
  const [currentFormulaPath] = useState('example.formula.toml') // Would come from formula editor
  const [currentVars] = useState<Record<string, string>>({}) // Would come from vars panel

  const { result: slingResult, isLoading: slingLoading, sling, reset: resetSling } = useSling()

  const handleOpenFormula = useCallback(() => {
    console.log('Open Formula triggered')
  }, [])

  const handleCookPreview = useCallback(() => {
    console.log('Cook Preview triggered')
  }, [])

  const handleSling = useCallback(() => {
    resetSling()
    setSlingDialogOpen(true)
  }, [resetSling])

  const handleSlingClose = useCallback(() => {
    setSlingDialogOpen(false)
  }, [])

  const handleSlingExecute = useCallback(
    async (target: string) => {
      const request: SlingRequest = {
        formula_path: currentFormulaPath,
        target,
        vars: Object.keys(currentVars).length > 0 ? currentVars : undefined,
      }
      return sling(request)
    },
    [currentFormulaPath, currentVars, sling]
  )

  const handleNavigateToResults = useCallback((moleculeId: string) => {
    console.log('Navigate to results:', moleculeId)
    // TODO: Implement navigation to results view
    setSlingDialogOpen(false)
  }, [])

  const actions = useDefaultActions({
    onOpenFormula: handleOpenFormula,
    onCookPreview: handleCookPreview,
    onSling: handleSling,
    onSwitchToGraph: () => setViewMode('graph'),
    onSwitchToList: () => setViewMode('list'),
    onSwitchToWave: () => setViewMode('wave'),
  })

  return (
    <div style={{ padding: '20px' }}>
      <h1>Beads IDE: {item.id}</h1>
      <p>Current view: {viewMode}</p>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Press <kbd style={{ padding: '2px 6px', background: '#eee', borderRadius: '3px' }}>Cmd+K</kbd> to open command
        palette
      </p>
      <CommandPalette actions={actions} placeholder="Search actions..." />
      <SlingDialog
        isOpen={slingDialogOpen}
        onClose={handleSlingClose}
        formulaPath={currentFormulaPath}
        vars={currentVars}
        onSling={handleSlingExecute}
        isLoading={slingLoading}
        result={slingResult}
        onNavigateToResults={handleNavigateToResults}
      />
    </div>
  )
}
