import { useEffect } from 'react'
import { toast } from 'sonner'
import { formatHotkey } from './use-hotkeys'

const STORAGE_KEY = 'beads-ide-keyboard-tip-shown'

/**
 * Shows a one-time toast tip about the command palette shortcut.
 * Uses localStorage to ensure it only shows once per browser.
 */
export function useKeyboardTip(): void {
  useEffect(() => {
    try {
      const shown = localStorage.getItem(STORAGE_KEY)
      if (shown) return

      // Small delay to let the app render first
      const timer = setTimeout(() => {
        toast(`Press ${formatHotkey('Mod+K')} to open the command palette`, {
          duration: 5000,
          id: 'keyboard-tip',
        })
        localStorage.setItem(STORAGE_KEY, 'true')
      }, 1500)

      return () => clearTimeout(timer)
    } catch {
      // Ignore localStorage errors (e.g., private browsing)
    }
  }, [])
}
