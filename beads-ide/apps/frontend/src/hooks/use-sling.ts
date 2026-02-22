import type { SlingRequest, SlingResult } from '@beads-ide/shared'
/**
 * Hook for slinging formulas to agents/crews.
 * Provides state management for the sling dialog and API calls.
 */
import { useCallback, useState } from 'react'

/** Return value of the sling hook */
export interface UseSlingReturn {
  /** Current sling result */
  result: SlingResult | null
  /** Whether a sling is in progress */
  isLoading: boolean
  /** Error from the last sling attempt */
  error: Error | null
  /** Execute the sling */
  sling: (request: SlingRequest) => Promise<SlingResult>
  /** Reset state */
  reset: () => void
}

const API_BASE = 'http://127.0.0.1:3001'

/**
 * Sling a formula via the backend API.
 */
async function slingFormula(request: SlingRequest): Promise<SlingResult> {
  const response = await fetch(`${API_BASE}/api/sling`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Sling request failed: ${response.status} ${text}`)
  }

  return response.json()
}

/**
 * Hook for slinging formulas to agents/crews.
 *
 * @returns Sling state and controls
 */
export function useSling(): UseSlingReturn {
  const [result, setResult] = useState<SlingResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sling = useCallback(async (request: SlingRequest): Promise<SlingResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const slingResult = await slingFormula(request)
      setResult(slingResult)

      if (!slingResult.ok) {
        setError(new Error(slingResult.error || 'Sling failed'))
      }

      return slingResult
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      const failedResult: SlingResult = {
        ok: false,
        error: error.message,
      }
      setResult(failedResult)
      return failedResult
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { result, isLoading, error, sling, reset }
}
