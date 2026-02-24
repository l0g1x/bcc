/**
 * Context for formula save functionality.
 * Allows the sidebar to trigger save on the currently open formula.
 */
import { type ReactNode, createContext, useCallback, useContext, useRef } from 'react'

type SaveHandler = () => Promise<void>

interface FormulaSaveContextValue {
  /** Register a save handler for the current formula */
  registerSaveHandler: (handler: SaveHandler | null) => void
  /** Call the registered save handler */
  save: () => Promise<void>
  /** Check if a save handler is registered */
  canSave: () => boolean
}

const FormulaSaveContext = createContext<FormulaSaveContextValue | null>(null)

interface FormulaSaveProviderProps {
  children: ReactNode
}

/**
 * Provider component for formula save functionality.
 */
export function FormulaSaveProvider({ children }: FormulaSaveProviderProps) {
  const saveHandlerRef = useRef<SaveHandler | null>(null)

  const registerSaveHandler = useCallback((handler: SaveHandler | null) => {
    saveHandlerRef.current = handler
  }, [])

  const save = useCallback(async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current()
    }
  }, [])

  const canSave = useCallback(() => {
    return saveHandlerRef.current !== null
  }, [])

  return (
    <FormulaSaveContext.Provider value={{ registerSaveHandler, save, canSave }}>
      {children}
    </FormulaSaveContext.Provider>
  )
}

/**
 * Hook to access formula save functionality.
 * Must be used within a FormulaSaveProvider.
 */
export function useFormulaSave(): FormulaSaveContextValue {
  const context = useContext(FormulaSaveContext)
  if (!context) {
    throw new Error('useFormulaSave must be used within a FormulaSaveProvider')
  }
  return context
}
