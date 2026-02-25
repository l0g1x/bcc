import type { TreeNode } from '@beads-ide/shared'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type CSSProperties, useCallback, useMemo, useRef, useState } from 'react'
import { useFormulaDirty } from '../../contexts'
import { useFormulaSave } from '../../contexts/formula-save-context'
import { useTree, useWorkspaceConfig } from '../../hooks'
import { UnsavedChangesModal } from '../ui/unsaved-changes-modal'

// --- Types ---

interface FlatTreeItem {
  id: string
  path: string
  name: string
  type: 'directory' | 'formula'
  formulaName?: string
  depth: number
  isExpanded?: boolean
  isDirty?: boolean
}

export interface WorkspaceTreeProps {
  filter?: string
}

// --- Styles ---

const containerStyle: CSSProperties = {
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const scrollContainerStyle: CSSProperties = {
  flex: 1,
  overflow: 'auto',
}

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '22px',
  fontSize: '13px',
  color: '#cccccc',
  cursor: 'pointer',
  userSelect: 'none',
  paddingRight: '8px',
  whiteSpace: 'nowrap',
}

const itemHoverStyle: CSSProperties = {
  backgroundColor: '#2a2d2e',
}

const itemActiveStyle: CSSProperties = {
  backgroundColor: '#094771',
}

const itemFocusStyle: CSSProperties = {
  outline: '1px solid #007acc',
  outlineOffset: '-1px',
}

const dirtyDotStyle: CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#fbbf24',
  marginLeft: '6px',
  flexShrink: 0,
}

const nodeNameStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const emptyStateStyle: CSSProperties = {
  padding: '20px 16px',
  textAlign: 'center',
  color: '#888',
  fontSize: '12px',
  lineHeight: 1.6,
}

const bannerStyle: CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'rgba(251, 191, 36, 0.1)',
  borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
  fontSize: '11px',
  color: '#fbbf24',
}

const skeletonContainerStyle: CSSProperties = {
  padding: '8px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const skeletonRowStyle: CSSProperties = {
  height: '14px',
  borderRadius: '3px',
  backgroundColor: '#2a2d2e',
  animation: 'pulse 1.5s ease-in-out infinite',
}

const errorStyle: CSSProperties = {
  padding: '20px 16px',
  textAlign: 'center',
  color: '#f87171',
  fontSize: '12px',
}

const retryBtnStyle: CSSProperties = {
  marginTop: '8px',
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid #f87171',
  backgroundColor: 'transparent',
  color: '#f87171',
  fontSize: '12px',
  cursor: 'pointer',
}

// --- Icons ---

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="#cccccc"
      aria-hidden="true"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.1s',
        flexShrink: 0,
      }}
    >
      <path
        d="M6 4l4 4-4 4"
        fill="none"
        stroke="#cccccc"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FolderIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="#e2a52e"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M1.5 2A1.5 1.5 0 000 3.5V5h16v-.5A1.5 1.5 0 0014.5 3H7.71l-1.5-1.2A1.5 1.5 0 005.26 2H1.5zM0 6v6.5A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V6H0z" />
      </svg>
    )
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="#e2a52e"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5a1.5 1.5 0 00-1.5-1.5H7.71l-1.5-1.2A1.5 1.5 0 005.26 2H1.5z" />
    </svg>
  )
}

function FileCodeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="#519aba"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M3 1.5A1.5 1.5 0 014.5 0h4.379a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0113.5 4.622V14.5a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 14.5v-13zM6.5 9L5 10.5 6.5 12l-.7.7L3.5 10.5l2.3-2.2.7.7zm3 0L11 10.5 9.5 12l.7.7 2.3-2.2-2.3-2.2-.7.7z" />
    </svg>
  )
}

// --- Tree flattening ---

function flattenTree(
  nodes: TreeNode[],
  expandedState: Record<string, boolean>,
  dirtySet: Set<string>,
  depth: number,
  filter?: string
): FlatTreeItem[] {
  const items: FlatTreeItem[] = []

  for (const node of nodes) {
    if (node.type === 'directory') {
      const isExpanded = expandedState[node.path] !== false // default expanded
      const children = node.children || []

      if (filter) {
        // When filtering, only show dirs that have matching formula descendants
        const filteredChildren = flattenTree(children, expandedState, dirtySet, depth + 1, filter)
        if (filteredChildren.length > 0) {
          const dirIsDirty = hasDirtyDescendant(node, dirtySet)
          items.push({
            id: node.path,
            path: node.path,
            name: node.name,
            type: 'directory',
            depth,
            isExpanded: true, // force expanded when filtering
            isDirty: dirIsDirty,
          })
          items.push(...filteredChildren)
        }
      } else {
        const dirIsDirty = hasDirtyDescendant(node, dirtySet)
        items.push({
          id: node.path,
          path: node.path,
          name: node.name,
          type: 'directory',
          depth,
          isExpanded,
          isDirty: dirIsDirty,
        })
        if (isExpanded) {
          items.push(...flattenTree(children, expandedState, dirtySet, depth + 1))
        }
      }
    } else if (node.type === 'formula') {
      const formulaName = node.formulaName || node.name.replace(/\.formula\.(toml|json)$/, '')
      if (filter && !formulaName.toLowerCase().includes(filter.toLowerCase())) {
        continue
      }
      items.push({
        id: node.path,
        path: node.path,
        name: formulaName,
        type: 'formula',
        formulaName,
        depth,
        isDirty: dirtySet.has(formulaName),
      })
    }
  }

  return items
}

function hasDirtyDescendant(node: TreeNode, dirtySet: Set<string>): boolean {
  if (!node.children) return false
  for (const child of node.children) {
    if (child.type === 'formula') {
      const name = child.formulaName || child.name.replace(/\.formula\.(toml|json)$/, '')
      if (dirtySet.has(name)) return true
    } else if (child.type === 'directory' && hasDirtyDescendant(child, dirtySet)) {
      return true
    }
  }
  return false
}

function collectDirtyNames(isDirtyFn: (name: string) => boolean, nodes: TreeNode[]): Set<string> {
  const dirty = new Set<string>()
  function walk(items: TreeNode[]) {
    for (const item of items) {
      if (item.type === 'formula') {
        const name = item.formulaName || item.name.replace(/\.formula\.(toml|json)$/, '')
        if (isDirtyFn(name)) dirty.add(name)
      } else if (item.children) {
        walk(item.children)
      }
    }
  }
  walk(nodes)
  return dirty
}

// --- Components ---

function LoadingSkeleton() {
  return (
    <div style={skeletonContainerStyle}>
      <div style={{ ...skeletonRowStyle, width: '60%' }} />
      <div style={{ ...skeletonRowStyle, width: '80%' }} />
      <div style={{ ...skeletonRowStyle, width: '45%' }} />
    </div>
  )
}

function EmptyState({ root }: { root: string | null }) {
  return (
    <div style={emptyStateStyle}>
      <p>No formulas found{root ? ` in ${root}` : ''}.</p>
      <p style={{ marginTop: '8px', color: '#666' }}>
        Add <code>.formula.toml</code> files to <code>formulas/</code> or{' '}
        <code>.beads/formulas/</code> to see them here.
      </p>
    </div>
  )
}

function NodeLimitBanner({ totalCount }: { totalCount: number }) {
  return (
    <div style={bannerStyle}>
      Showing 500 of {totalCount} files. Use the filter to narrow results.
    </div>
  )
}

function TreeErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div style={errorStyle}>
      <p>{error.message}</p>
      <button type="button" style={retryBtnStyle} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

export function WorkspaceTree({ filter }: WorkspaceTreeProps) {
  const { nodes, root, totalCount, truncated, isLoading, error, refresh } = useTree()
  const { isDirty } = useFormulaDirty()
  const { save, canSave } = useFormulaSave()
  const { config, setTreeExpanded } = useWorkspaceConfig()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Get current formula from URL
  const currentFormula = useMemo(() => {
    const match = window.location.pathname.match(/^\/formula\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }, [])

  // Get expand state for current root
  const expandedState = useMemo(() => {
    if (!root) return {}
    return config.treeExpanded[root] || {}
  }, [config.treeExpanded, root])

  // Collect dirty formula names
  const dirtySet = useMemo(() => collectDirtyNames(isDirty, nodes), [isDirty, nodes])

  // Flatten tree
  const flatItems = useMemo(
    () => flattenTree(nodes, expandedState, dirtySet, 0, filter),
    [nodes, expandedState, dirtySet, filter]
  )

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 22,
    overscan: 10,
  })

  // Toggle directory expand/collapse
  const toggleExpand = useCallback(
    (dirPath: string) => {
      if (!root) return
      const current = expandedState[dirPath] !== false
      const next = { ...expandedState, [dirPath]: !current }
      setTreeExpanded(root, next)
    },
    [root, expandedState, setTreeExpanded]
  )

  // Navigate to formula
  const navigateToFormula = useCallback(
    (formulaName: string) => {
      // Check for unsaved changes
      if (
        currentFormula &&
        currentFormula !== formulaName &&
        isDirty(currentFormula) &&
        canSave()
      ) {
        setPendingNavigation(formulaName)
        setShowUnsavedModal(true)
        return
      }
      window.history.pushState({}, '', `/formula/${encodeURIComponent(formulaName)}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    [currentFormula, isDirty, canSave]
  )

  // Handle item click
  const handleItemClick = useCallback(
    (item: FlatTreeItem) => {
      if (item.type === 'directory') {
        toggleExpand(item.path)
      } else if (item.formulaName) {
        navigateToFormula(item.formulaName)
      }
    },
    [toggleExpand, navigateToFormula]
  )

  // Unsaved changes modal handlers
  const handleModalSave = useCallback(async () => {
    setShowUnsavedModal(false)
    await save()
    if (pendingNavigation) {
      window.history.pushState({}, '', `/formula/${encodeURIComponent(pendingNavigation)}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
      setPendingNavigation(null)
    }
  }, [save, pendingNavigation])

  const handleModalDiscard = useCallback(() => {
    setShowUnsavedModal(false)
    if (pendingNavigation) {
      window.history.pushState({}, '', `/formula/${encodeURIComponent(pendingNavigation)}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  const handleModalCancel = useCallback(() => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flatItems.length === 0) return

      let newIndex = focusedIndex

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          newIndex = Math.min(focusedIndex + 1, flatItems.length - 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          newIndex = Math.max(focusedIndex - 1, 0)
          break
        case 'ArrowRight': {
          e.preventDefault()
          const item = flatItems[focusedIndex]
          if (item?.type === 'directory' && !item.isExpanded) {
            toggleExpand(item.path)
          }
          return
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const item = flatItems[focusedIndex]
          if (item?.type === 'directory' && item.isExpanded) {
            toggleExpand(item.path)
          }
          return
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          const item = flatItems[focusedIndex]
          if (item) handleItemClick(item)
          return
        }
        default:
          return
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex)
        virtualizer.scrollToIndex(newIndex)
      }
    },
    [flatItems, focusedIndex, toggleExpand, handleItemClick, virtualizer]
  )

  if (isLoading) return <LoadingSkeleton />
  if (error) return <TreeErrorState error={error} onRetry={refresh} />
  if (flatItems.length === 0 && !filter) return <EmptyState root={root} />

  return (
    <div style={containerStyle}>
      {truncated && <NodeLimitBanner totalCount={totalCount} />}

      <nav
        ref={scrollRef}
        style={scrollContainerStyle}
        role="tree"
        aria-label="File explorer"
        aria-activedescendant={focusedIndex >= 0 ? `tree-item-${focusedIndex}` : undefined}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (focusedIndex === -1 && flatItems.length > 0) setFocusedIndex(0)
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = flatItems[virtualItem.index]
            const isActive = item.type === 'formula' && item.formulaName === currentFormula
            const isFocused = virtualItem.index === focusedIndex

            return (
              <div
                key={item.id}
                role={item.type === 'directory' ? 'treeitem' : 'treeitem'}
                aria-expanded={item.type === 'directory' ? item.isExpanded : undefined}
                aria-selected={isActive}
                aria-level={item.depth + 1}
                id={`tree-item-${virtualItem.index}`}
                style={{
                  ...itemStyle,
                  ...(isActive ? itemActiveStyle : {}),
                  ...(isFocused ? itemFocusStyle : {}),
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingLeft: `${item.depth * 16 + 4}px`,
                }}
                onClick={() => {
                  setFocusedIndex(virtualItem.index)
                  handleItemClick(item)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleItemClick(item)
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#2a2d2e'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {item.type === 'directory' ? (
                  <>
                    <ChevronIcon expanded={!!item.isExpanded} />
                    <FolderIcon open={!!item.isExpanded} />
                    <span style={{ ...nodeNameStyle, marginLeft: '4px' }}>{item.name}</span>
                    {item.isDirty && <span style={dirtyDotStyle} />}
                  </>
                ) : (
                  <>
                    <span style={{ width: '16px', flexShrink: 0 }} />
                    <FileCodeIcon />
                    <span style={{ ...nodeNameStyle, marginLeft: '4px' }}>{item.name}</span>
                    {item.isDirty && <span style={dirtyDotStyle} />}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {filter && flatItems.length === 0 && (
        <div style={emptyStateStyle}>No formulas match &quot;{filter}&quot;</div>
      )}

      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
      />
    </div>
  )
}
