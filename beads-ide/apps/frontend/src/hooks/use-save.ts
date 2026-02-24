import { saveFormula } from '@/lib/api'
/**
 * Hook for saving formulas to disk.
 * Provides state management for save operations.
 * Shows toast notifications on failure with retry option.
 */
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

/** Return value of the save hook */
export interface UseSaveReturn {
  /** Whether a save is in progress */
  isLoading: boolean
  /** Error from the last save attempt */
  error: Error | null
  /** Save a formula */
  save: (name: string, content: string) => Promise<void>
}

/**
 * Hook for saving formulas to disk.
 *
 * @returns Save state and controls
 */
export function useSave(): UseSaveReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const save = useCallback(async (name: string, content: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await saveFormula(name, content)
    } catch (err) {
      const saveError = err instanceof Error ? err : new Error(String(err))
      setError(saveError)
      // Show toast for errors with retry option
      toast.error('Save failed', {
        description: saveError.message,
        action: {
          label: 'Retry',
          onClick: () => save(name, content),
        },
      })
      throw saveError
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { save, isLoading, error }
}
