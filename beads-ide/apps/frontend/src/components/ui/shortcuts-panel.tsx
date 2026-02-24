import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatHotkey, useHotkey } from '../../hooks/use-hotkeys'

export interface ShortcutItem {
  id: string
  label: string
  shortcut: string
  description?: string
  category?: string
}

interface ShortcutsPanelProps {
  shortcuts: ShortcutItem[]
  /** Hotkey to toggle the panel (default: Mod+/) */
  toggleHotkey?: string
}

/**
 * Non-modal overlay panel for viewing keyboard shortcuts.
 * Features: searchable, pinnable (stays open when pinned).
 */
export function ShortcutsPanel({
  shortcuts,
  toggleHotkey = 'Mod+/',
}: ShortcutsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const filteredShortcuts = useMemo(() => {
    if (!query.trim()) return shortcuts

    const lowerQuery = query.toLowerCase()
    return shortcuts.filter(
      (shortcut) =>
        shortcut.label.toLowerCase().includes(lowerQuery) ||
        shortcut.description?.toLowerCase().includes(lowerQuery) ||
        shortcut.shortcut.toLowerCase().includes(lowerQuery) ||
        shortcut.category?.toLowerCase().includes(lowerQuery)
    )
  }, [shortcuts, query])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  const close = useCallback(() => {
    if (!isPinned) {
      setIsOpen(false)
      setQuery('')
    }
  }, [isPinned])

  // Toggle hotkey
  useHotkey(toggleHotkey, toggle)

  // Escape to close (unless pinned)
  useHotkey('Escape', close, { enabled: isOpen && !isPinned, enableOnFormTags: true })

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on outside click (unless pinned)
  useEffect(() => {
    if (!isOpen || isPinned) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isPinned, close])

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, ShortcutItem[]> = {}
    for (const shortcut of filteredShortcuts) {
      const category = shortcut.category || 'General'
      if (!groups[category]) groups[category] = []
      groups[category].push(shortcut)
    }
    return groups
  }, [filteredShortcuts])

  if (!isOpen) return null

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '60px',
        right: '20px',
        width: '360px',
        maxHeight: 'calc(100vh - 100px)',
        background: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #333',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#e5e5e5' }}>
          Keyboard Shortcuts
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPinned((prev) => !prev)}
            title={isPinned ? 'Unpin panel' : 'Pin panel (keep open)'}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: isPinned ? '#3b82f6' : 'transparent',
              border: '1px solid #444',
              borderRadius: '4px',
              color: isPinned ? '#fff' : '#a3a3a3',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isPinned ? '📌' : '📍'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setIsPinned(false)
              setQuery('')
            }}
            title="Close"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: 'transparent',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#a3a3a3',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shortcuts..."
          aria-label="Search shortcuts"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #444',
            borderRadius: '6px',
            background: '#262626',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Shortcuts list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {filteredShortcuts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#737373' }}>
            No shortcuts found
          </div>
        ) : (
          Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#737373',
                }}
              >
                {category}
              </div>
              {categoryShortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    color: '#e5e5e5',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {shortcut.label}
                    </div>
                    {shortcut.description && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#737373',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {shortcut.description}
                      </div>
                    )}
                  </div>
                  <kbd
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontFamily: 'system-ui, sans-serif',
                      color: '#a3a3a3',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    {formatHotkey(shortcut.shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #333',
          fontSize: '11px',
          color: '#737373',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <kbd
            style={{
              padding: '2px 4px',
              background: '#333',
              borderRadius: '3px',
              marginRight: '4px',
            }}
          >
            {formatHotkey(toggleHotkey)}
          </kbd>
          Toggle
        </span>
        {isPinned && <span style={{ color: '#3b82f6' }}>Pinned</span>}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}

/**
 * Hook to get default IDE shortcuts for display
 */
export function useDefaultShortcuts(): ShortcutItem[] {
  return useMemo(
    () => [
      {
        id: 'command-palette',
        label: 'Command Palette',
        shortcut: 'Mod+K',
        description: 'Open command palette',
        category: 'General',
      },
      {
        id: 'shortcuts-panel',
        label: 'Keyboard Shortcuts',
        shortcut: 'Mod+/',
        description: 'Show this panel',
        category: 'General',
      },
      {
        id: 'save',
        label: 'Save',
        shortcut: 'Mod+S',
        description: 'Save current file',
        category: 'File',
      },
      {
        id: 'open-formula',
        label: 'Open Formula',
        shortcut: 'Mod+O',
        description: 'Open a formula file',
        category: 'File',
      },
      {
        id: 'cook-preview',
        label: 'Cook Preview',
        shortcut: 'Mod+Shift+C',
        description: 'Preview the cooked output',
        category: 'Actions',
      },
      {
        id: 'sling',
        label: 'Sling',
        shortcut: 'Mod+Shift+S',
        description: 'Dispatch work to polecats',
        category: 'Actions',
      },
    ],
    []
  )
}
