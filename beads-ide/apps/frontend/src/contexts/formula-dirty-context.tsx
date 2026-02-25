/**
 * Context for tracking unsaved changes in formulas.
 * Allows the sidebar to show a dirty indicator for formulas with pending edits.
 */
import { type ReactNode, createContext, useCallback, useContext, useState } from 'react'

interface FormulaDirtyContextValue {
  /** Check if a formula has unsaved changes */
  isDirty: (name: string) => boolean
  /** Mark a formula as dirty or clean */
  setDirty: (name: string, dirty: boolean) => void
  /** Whether any formula has unsaved changes */
  hasAnyDirty: boolean
}

const FormulaDirtyContext = createContext<FormulaDirtyContextValue | null>(null)

interface FormulaDirtyProviderProps {
  children: ReactNode
}

/**
 * Provider component for formula dirty state tracking.
 */
export function FormulaDirtyProvider({ children }: FormulaDirtyProviderProps) {
  const [dirtyFormulas, setDirtyFormulas] = useState<Set<string>>(new Set())

  const isDirty = useCallback((name: string) => dirtyFormulas.has(name), [dirtyFormulas])

  const setDirty = useCallback((name: string, dirty: boolean) => {
    setDirtyFormulas((prev) => {
      const next = new Set(prev)
      if (dirty) {
        next.add(name)
      } else {
        next.delete(name)
      }
      return next
    })
  }, [])

  const hasAnyDirty = dirtyFormulas.size > 0

  return (
    <FormulaDirtyContext.Provider value={{ isDirty, setDirty, hasAnyDirty }}>
      {children}
    </FormulaDirtyContext.Provider>
  )
}

/**
 * Hook to check if a formula has unsaved changes.
 * Must be used within a FormulaDirtyProvider.
 */
export function useFormulaDirty(): FormulaDirtyContextValue {
  const context = useContext(FormulaDirtyContext)
  if (!context) {
    throw new Error('useFormulaDirty must be used within a FormulaDirtyProvider')
  }
  return context
}
