import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'workspaceConfig'
const CURRENT_VERSION = 1
const MAX_RECENT_ROOTS = 5

export interface WorkspaceConfig {
  version: number
  rootPath: string | null
  recentRoots: string[]
  treeExpanded: Record<string, Record<string, boolean>>
}

export interface UseWorkspaceConfigReturn {
  config: WorkspaceConfig
  setRootPath: (path: string | null) => void
  addRecentRoot: (path: string) => void
  setTreeExpanded: (rootPath: string, expanded: Record<string, boolean>) => void
  clearConfig: () => void
}

const defaultConfig: WorkspaceConfig = {
  version: CURRENT_VERSION,
  rootPath: null,
  recentRoots: [],
  treeExpanded: {},
}

function readConfig(): WorkspaceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    const parsed = JSON.parse(raw) as WorkspaceConfig
    if (parsed.version !== CURRENT_VERSION) return defaultConfig
    return parsed
  } catch {
    return defaultConfig
  }
}

function writeConfig(config: WorkspaceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore localStorage errors (e.g., private browsing, quota exceeded)
  }
}

// External store subscribers for useSyncExternalStore
let listeners: Array<() => void> = []
let snapshot = readConfig()

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): WorkspaceConfig {
  return snapshot
}

function emitChange(next: WorkspaceConfig): void {
  snapshot = next
  writeConfig(next)
  for (const listener of listeners) {
    listener()
  }
}

export function useWorkspaceConfig(): UseWorkspaceConfigReturn {
  const config = useSyncExternalStore(subscribe, getSnapshot)

  const setRootPath = useCallback((path: string | null) => {
    const current = readConfig()
    emitChange({ ...current, rootPath: path })
  }, [])

  const addRecentRoot = useCallback((path: string) => {
    const current = readConfig()
    const filtered = current.recentRoots.filter((r) => r !== path)
    const recentRoots = [path, ...filtered].slice(0, MAX_RECENT_ROOTS)
    emitChange({ ...current, recentRoots })
  }, [])

  const setTreeExpanded = useCallback((rootPath: string, expanded: Record<string, boolean>) => {
    const current = readConfig()
    emitChange({
      ...current,
      treeExpanded: { ...current.treeExpanded, [rootPath]: expanded },
    })
  }, [])

  const clearConfig = useCallback(() => {
    emitChange({ ...defaultConfig })
  }, [])

  return { config, setRootPath, addRecentRoot, setTreeExpanded, clearConfig }
}
