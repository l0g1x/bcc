import { useEffect, useCallback, useRef } from 'react'

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta'

interface HotkeyOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  enableOnFormTags?: boolean
}

interface ParsedHotkey {
  modifiers: Set<ModifierKey>
  key: string
}

/**
 * Parse a hotkey string like "Mod+K" or "Ctrl+Shift+P"
 * Mod is cross-platform: Cmd on macOS, Ctrl elsewhere
 */
function parseHotkey(hotkey: string): ParsedHotkey {
  const parts = hotkey.toLowerCase().split('+')
  const key = parts.pop() || ''
  const modifiers = new Set<ModifierKey>()

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  for (const part of parts) {
    switch (part) {
      case 'mod':
        modifiers.add(isMac ? 'meta' : 'ctrl')
        break
      case 'ctrl':
      case 'control':
        modifiers.add('ctrl')
        break
      case 'alt':
      case 'option':
        modifiers.add('alt')
        break
      case 'shift':
        modifiers.add('shift')
        break
      case 'meta':
      case 'cmd':
      case 'command':
        modifiers.add('meta')
        break
    }
  }

  return { modifiers, key }
}

/**
 * Check if an event matches the parsed hotkey
 */
function matchesHotkey(event: KeyboardEvent, parsed: ParsedHotkey): boolean {
  const eventKey = event.key.toLowerCase()

  if (eventKey !== parsed.key) return false

  const hasCtrl = event.ctrlKey === parsed.modifiers.has('ctrl')
  const hasAlt = event.altKey === parsed.modifiers.has('alt')
  const hasShift = event.shiftKey === parsed.modifiers.has('shift')
  const hasMeta = event.metaKey === parsed.modifiers.has('meta')

  return hasCtrl && hasAlt && hasShift && hasMeta
}

/**
 * Check if focus is on a form element
 */
function isFormElement(element: Element | null): boolean {
  if (!element) return false
  const tagName = element.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || (element as HTMLElement).isContentEditable
}

/**
 * Hook to register a keyboard shortcut
 * Uses cross-platform Mod key (Cmd on macOS, Ctrl elsewhere)
 *
 * @example
 * useHotkey('Mod+K', () => setOpen(true))
 * useHotkey('Escape', () => setOpen(false), { enabled: isOpen })
 */
export function useHotkey(
  hotkey: string,
  callback: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {}
): void {
  const { enabled = true, preventDefault = true, stopPropagation = false, enableOnFormTags = false } = options

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const parsedRef = useRef<ParsedHotkey | null>(null)
  if (!parsedRef.current || parsedRef.current.key !== parseHotkey(hotkey).key) {
    parsedRef.current = parseHotkey(hotkey)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return
      if (!enableOnFormTags && isFormElement(document.activeElement)) return

      const parsed = parsedRef.current
      if (!parsed) return

      if (matchesHotkey(event, parsed)) {
        if (preventDefault) event.preventDefault()
        if (stopPropagation) event.stopPropagation()
        callbackRef.current(event)
      }
    },
    [enabled, preventDefault, stopPropagation, enableOnFormTags]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook to track if a specific key is currently pressed
 */
export function useKeyState(key: string): boolean {
  const keyLower = key.toLowerCase()
  const pressedRef = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === keyLower) {
        pressedRef.current = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === keyLower) {
        pressedRef.current = false
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [keyLower])

  return pressedRef.current
}

/**
 * Format a hotkey for display (cross-platform aware)
 */
export function formatHotkey(hotkey: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  return hotkey
    .split('+')
    .map((part) => {
      const lower = part.toLowerCase()
      switch (lower) {
        case 'mod':
          return isMac ? '⌘' : 'Ctrl'
        case 'ctrl':
        case 'control':
          return isMac ? '⌃' : 'Ctrl'
        case 'alt':
        case 'option':
          return isMac ? '⌥' : 'Alt'
        case 'shift':
          return isMac ? '⇧' : 'Shift'
        case 'meta':
        case 'cmd':
        case 'command':
          return isMac ? '⌘' : 'Win'
        case 'enter':
        case 'return':
          return isMac ? '↵' : 'Enter'
        case 'escape':
        case 'esc':
          return 'Esc'
        case 'arrowup':
          return '↑'
        case 'arrowdown':
          return '↓'
        case 'arrowleft':
          return '←'
        case 'arrowright':
          return '→'
        default:
          return part.toUpperCase()
      }
    })
    .join(isMac ? '' : '+')
}
