import type { TreeNode, TreeResponse } from '@beads-ide/shared'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

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

    const { data, error: apiError } = await apiFetch<TreeResponse>('/api/tree')

    if (apiError) {
      setError(new Error(apiError.details || apiError.message))
      setNodes([])
      setRoot(null)
      setTotalCount(0)
      setTruncated(false)
    } else if (data) {
      setNodes(data.nodes)
      setRoot(data.root)
      setTotalCount(data.totalCount)
      setTruncated(data.truncated)
      setLastUpdated(new Date())
    }

    setIsLoading(false)
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
