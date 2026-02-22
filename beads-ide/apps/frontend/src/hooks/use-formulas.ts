import type { Formula, FormulaListResponse } from '@beads-ide/shared'
/**
 * Hook for fetching formula list from the backend API.
 */
import { useCallback, useEffect, useState } from 'react'

/** Return value of the useFormulas hook */
export interface UseFormulasReturn {
  /** List of discovered formulas */
  formulas: Formula[]
  /** Whether formulas are currently loading */
  isLoading: boolean
  /** Error from the last fetch attempt */
  error: Error | null
  /** Search paths that were checked */
  searchPaths: string[]
  /** Manually refresh the formula list */
  refresh: () => void
}

const API_BASE = 'http://127.0.0.1:3001'

/**
 * Fetch formulas from the backend API.
 */
async function fetchFormulas(): Promise<FormulaListResponse> {
  const response = await fetch(`${API_BASE}/api/formulas`)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch formulas: ${response.status} ${text}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch formulas')
  }

  return data as FormulaListResponse
}

/**
 * Hook for fetching and managing the formula list.
 * Automatically fetches on mount and provides a refresh function.
 *
 * @returns Formula list, loading state, error, and refresh function
 */
export function useFormulas(): UseFormulasReturn {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [searchPaths, setSearchPaths] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const doFetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFormulas()
      setFormulas(result.formulas)
      setSearchPaths(result.searchPaths)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setFormulas([])
      setSearchPaths([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    doFetch()
  }, [doFetch])

  return {
    formulas,
    isLoading,
    error,
    searchPaths,
    refresh: doFetch,
  }
}
