import type { TreeNode, TreeResponse } from '@beads-ide/shared'
import { useCallback, useEffect, useState } from 'react'

export interface UseTreeReturn {
  nodes: TreeNode[]
  root: string | null
  totalCount: number
  truncated: boolean
  isLoading: boolean
  error: Error | null
  refresh: () => void
  lastUpdated: Date | null
}

async function fetchTree(): Promise<TreeResponse> {
  const response = await fetch('/api/tree')

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch tree: ${response.status} ${text}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch tree')
  }

  return data as TreeResponse
}

export function useTree(): UseTreeReturn {
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [root, setRoot] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [truncated, setTruncated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const doFetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchTree()
      setNodes(result.nodes)
      setRoot(result.root)
      setTotalCount(result.totalCount)
      setTruncated(result.truncated)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setNodes([])
      setRoot(null)
      setTotalCount(0)
      setTruncated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    doFetch()
  }, [doFetch])

  return {
    nodes,
    root,
    totalCount,
    truncated,
    isLoading,
    error,
    refresh: doFetch,
    lastUpdated,
  }
}
