/**
 * Context for managing bead selection state.
 * Provides a way to select beads for viewing in the detail panel.
 */
import { type ReactNode, createContext, useCallback, useContext, useState } from 'react'

interface BeadSelectionContextValue {
  /** Currently selected bead ID, or null if none */
  selectedBeadId: string | null
  /** Select a bead to view in the detail panel */
  selectBead: (beadId: string) => void
  /** Clear the current selection */
  clearSelection: () => void
}

const BeadSelectionContext = createContext<BeadSelectionContextValue | null>(null)

interface BeadSelectionProviderProps {
  children: ReactNode
}

/**
 * Provider component for bead selection state.
 */
export function BeadSelectionProvider({ children }: BeadSelectionProviderProps) {
  const [selectedBeadId, setSelectedBeadId] = useState<string | null>(null)

  const selectBead = useCallback((beadId: string) => {
    setSelectedBeadId(beadId)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedBeadId(null)
  }, [])

  return (
    <BeadSelectionContext.Provider value={{ selectedBeadId, selectBead, clearSelection }}>
      {children}
    </BeadSelectionContext.Provider>
  )
}

/**
 * Hook to access bead selection state.
 * Must be used within a BeadSelectionProvider.
 */
export function useBeadSelection(): BeadSelectionContextValue {
  const context = useContext(BeadSelectionContext)
  if (!context) {
    throw new Error('useBeadSelection must be used within a BeadSelectionProvider')
  }
  return context
}
