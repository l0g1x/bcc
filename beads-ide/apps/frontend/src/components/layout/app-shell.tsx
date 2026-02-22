import { useState, useCallback, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { PanelResizer } from './panel-resizer'
import { Sidebar } from './sidebar'

const STORAGE_KEY = 'beads-ide-panel-sizes'
const DEFAULT_SIDEBAR_SIZE = 20 // percentage
const COLLAPSED_SIDEBAR_SIZE = 4 // percentage for icon rail
const MIN_SIDEBAR_SIZE = 10
const MIN_MAIN_SIZE = 30
const MIN_DETAIL_SIZE = 15

interface AppShellProps {
  sidebarContent?: ReactNode
  mainContent?: ReactNode
  detailContent?: ReactNode
}

interface PanelSizes {
  sidebar: number
  main: number
  detail: number
}

const shellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#1e1e1e',
  color: '#cccccc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '13px',
  overflow: 'hidden',
}

const panelGroupStyle: CSSProperties = {
  flex: 1,
}

const mainPanelStyle: CSSProperties = {
  height: '100%',
  backgroundColor: '#1e1e1e',
  overflow: 'auto',
}

const detailPanelStyle: CSSProperties = {
  height: '100%',
  backgroundColor: '#252526',
  borderLeft: '1px solid #3c3c3c',
  overflow: 'auto',
}

function loadSavedSizes(): PanelSizes | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as PanelSizes
    }
  } catch {
    // Ignore localStorage errors
  }
  return null
}

function saveSizes(sizes: PanelSizes): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
  } catch {
    // Ignore localStorage errors
  }
}

export function AppShell({ sidebarContent, mainContent, detailContent }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [sizes, setSizes] = useState<PanelSizes>(() => {
    const saved = loadSavedSizes()
    if (saved) return saved
    return {
      sidebar: DEFAULT_SIDEBAR_SIZE,
      main: 55,
      detail: 25,
    }
  })

  // Track current sizes in a ref to avoid stale closure in useEffect
  const sizesRef = useRef(sizes)
  sizesRef.current = sizes

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const handleLayout = useCallback((newLayout: number[]) => {
    const [sidebar, main, detail] = newLayout
    const newSizes = { sidebar, main, detail }
    setSizes(newSizes)
    saveSizes(newSizes)
  }, [])

  // Recalculate sizes when collapsed state changes
  useEffect(() => {
    if (collapsed) {
      const currentSizes = sizesRef.current
      const remaining = 100 - COLLAPSED_SIDEBAR_SIZE
      const mainRatio = currentSizes.main / (currentSizes.main + currentSizes.detail)
      setSizes({
        sidebar: COLLAPSED_SIDEBAR_SIZE,
        main: remaining * mainRatio,
        detail: remaining * (1 - mainRatio),
      })
    } else {
      const saved = loadSavedSizes()
      if (saved && saved.sidebar > COLLAPSED_SIDEBAR_SIZE) {
        setSizes(saved)
      } else {
        setSizes({
          sidebar: DEFAULT_SIDEBAR_SIZE,
          main: 55,
          detail: 25,
        })
      }
    }
  }, [collapsed])

  return (
    <div style={shellStyle}>
      <PanelGroup
        direction="horizontal"
        style={panelGroupStyle}
        onLayout={handleLayout}
      >
        <Panel
          defaultSize={sizes.sidebar}
          minSize={collapsed ? COLLAPSED_SIDEBAR_SIZE : MIN_SIDEBAR_SIZE}
          maxSize={collapsed ? COLLAPSED_SIDEBAR_SIZE : 40}
        >
          <nav aria-label="Formula explorer">
            <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse}>
              {sidebarContent}
            </Sidebar>
          </nav>
        </Panel>

        <PanelResizer orientation="horizontal" />

        <Panel defaultSize={sizes.main} minSize={MIN_MAIN_SIZE}>
          <main style={mainPanelStyle} aria-label="Main content">
            {mainContent}
          </main>
        </Panel>

        <PanelResizer orientation="horizontal" />

        <Panel defaultSize={sizes.detail} minSize={MIN_DETAIL_SIZE}>
          <aside style={detailPanelStyle} aria-label="Details panel">
            {detailContent}
          </aside>
        </Panel>
      </PanelGroup>
    </div>
  )
}
