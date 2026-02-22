import { useCallback, useState } from 'react'
import type { Placeholder } from '@beads-ide/shared'
import { CommandPalette, useDefaultActions } from './components/layout/command-palette'

type ViewMode = 'graph' | 'list' | 'wave'

export default function App() {
  const item: Placeholder = { id: 'beads-ide' }
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleOpenFormula = useCallback(() => {
    console.log('Open Formula triggered')
  }, [])

  const handleCookPreview = useCallback(() => {
    console.log('Cook Preview triggered')
  }, [])

  const handleSling = useCallback(() => {
    console.log('Sling triggered')
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
    </div>
  )
}
