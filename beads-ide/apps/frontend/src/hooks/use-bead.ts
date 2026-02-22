/**
 * Hook for fetching a single bead by ID.
 */
import type { BeadFull, BeadShowResponse } from '@beads-ide/shared'
import { useCallback, useEffect, useState } from 'react'

/** Return value of the useBead hook */
export interface UseBeadReturn {
  /** The fetched bead, or null if not loaded */
  bead: BeadFull | null
  /** Whether the bead is currently loading */
  isLoading: boolean
  /** Error from the last fetch attempt */
  error: Error | null
  /** Manually refresh the bead */
  refresh: () => void
}

const API_BASE = 'http://127.0.0.1:3001'

/**
 * Fetch a single bead from the backend API.
 */
async function fetchBead(beadId: string): Promise<BeadFull> {
  const response = await fetch(`${API_BASE}/api/beads/${encodeURIComponent(beadId)}`)

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 404) {
      throw new Error(`Bead '${beadId}' not found`)
    }
    throw new Error(`Failed to fetch bead: ${response.status} ${text}`)
  }

  const data = (await response.json()) as BeadShowResponse

  return data.bead
}

/**
 * Hook for fetching a single bead by ID.
 * Automatically fetches when beadId changes.
 *
 * @param beadId - The ID of the bead to fetch, or null to clear
 * @returns Bead data, loading state, error, and refresh function
 */
export function useBead(beadId: string | null): UseBeadReturn {
  const [bead, setBead] = useState<BeadFull | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const doFetch = useCallback(async () => {
    if (!beadId) {
      setBead(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchBead(beadId)
      setBead(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setBead(null)
    } finally {
      setIsLoading(false)
    }
  }, [beadId])

  // Fetch when beadId changes
  useEffect(() => {
    doFetch()
  }, [doFetch])

  return {
    bead,
    isLoading,
    error,
    refresh: doFetch,
  }
}
