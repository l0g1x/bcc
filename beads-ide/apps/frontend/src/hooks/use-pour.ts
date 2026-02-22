import type { BurnRequest, BurnResult, PourRequest, PourResult } from '@beads-ide/shared'
/**
 * Hook for pouring formulas and managing molecule lifecycle.
 * Provides pour (create) and burn (rollback) operations.
 */
import { useCallback, useState } from 'react'

const API_BASE = 'http://127.0.0.1:3001'

/** Return value of the pour hook */
export interface UsePourReturn {
  /** Pour a formula to create real beads */
  pour: (request: Omit<PourRequest, 'dry_run'>) => Promise<PourResult>
  /** Preview what would be created (dry run) */
  preview: (request: Omit<PourRequest, 'dry_run'>) => Promise<PourResult>
  /** Burn (delete) a molecule - rollback operation */
  burn: (moleculeId: string, force?: boolean) => Promise<BurnResult>
  /** Whether an operation is in progress */
  isLoading: boolean
  /** Last operation result */
  result: PourResult | BurnResult | null
  /** Error from the last operation */
  error: Error | null
  /** Clear the last result/error */
  reset: () => void
}

/**
 * Pour a formula via the backend API.
 */
async function pourFormula(request: PourRequest): Promise<PourResult> {
  const response = await fetch(`${API_BASE}/api/pour`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Pour request failed: ${response.status} ${text}`)
  }

  return response.json()
}

/**
 * Burn a molecule via the backend API.
 */
async function burnMolecule(request: BurnRequest): Promise<BurnResult> {
  const response = await fetch(`${API_BASE}/api/burn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Burn request failed: ${response.status} ${text}`)
  }

  return response.json()
}

/**
 * Hook for pouring formulas and managing molecule lifecycle.
 *
 * @returns Pour operations, state, and error handling
 */
export function usePour(): UsePourReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PourResult | BurnResult | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const pour = useCallback(async (request: Omit<PourRequest, 'dry_run'>): Promise<PourResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const pourResult = await pourFormula({ ...request, dry_run: false })
      setResult(pourResult)
      return pourResult
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const preview = useCallback(
    async (request: Omit<PourRequest, 'dry_run'>): Promise<PourResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const pourResult = await pourFormula({ ...request, dry_run: true })
        setResult(pourResult)
        return pourResult
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const burn = useCallback(async (moleculeId: string, force = false): Promise<BurnResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const burnResult = await burnMolecule({
        molecule_id: moleculeId,
        force,
        dry_run: false,
      })
      setResult(burnResult)
      return burnResult
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    pour,
    preview,
    burn,
    isLoading,
    result,
    error,
    reset,
  }
}
