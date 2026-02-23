/**
 * Hook for loading formula file content from the backend.
 */
import { useCallback, useEffect, useState } from 'react'

const API_BASE = '' // Use relative URLs for Vite proxy

/** Response from the formula read endpoint */
interface FormulaReadResponse {
  ok: boolean
  name?: string
  path?: string
  content?: string
  error?: string
  parsed?: {
    name: string
    version?: number
    type?: string
    phase?: string
    vars?: Record<string, unknown>
    steps?: unknown[]
  }
}

/** Return value of the hook */
export interface UseFormulaContentReturn {
  /** Raw TOML content */
  content: string
  /** File path on disk */
  path: string | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Reload content from disk */
  reload: () => void
}

/**
 * Hook to load formula content from the backend.
 *
 * @param formulaName - Formula name (without extension)
 * @returns Content, loading state, and error
 */
export function useFormulaContent(formulaName: string | null): UseFormulaContentReturn {
  const [content, setContent] = useState('')
  const [path, setPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadContent = useCallback(async () => {
    if (!formulaName) {
      setContent('')
      setPath(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/formulas/${encodeURIComponent(formulaName)}`)

      if (!response.ok) {
        throw new Error(`Failed to load formula: ${response.status}`)
      }

      const data: FormulaReadResponse = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Unknown error')
      }

      setContent(data.content || '')
      setPath(data.path || null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setContent('')
      setPath(null)
    } finally {
      setIsLoading(false)
    }
  }, [formulaName])

  // Load on mount and when formula name changes
  useEffect(() => {
    loadContent()
  }, [loadContent])

  return {
    content,
    path,
    isLoading,
    error,
    reload: loadContent,
  }
}
