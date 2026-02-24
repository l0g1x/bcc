/**
 * Context for managing ARIA live region announcements.
 * Provides accessible screen reader announcements for key actions.
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

interface AnnouncementContextValue {
  /** Announce a message to screen readers (polite priority) */
  announce: (message: string) => void
}

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null)

interface AnnouncementProviderProps {
  children: ReactNode
}

const liveRegionStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

/**
 * Provider component for ARIA live region announcements.
 * Renders a visually hidden aria-live="polite" region.
 */
export function AnnouncementProvider({ children }: AnnouncementProviderProps) {
  const [message, setMessage] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announce = useCallback((newMessage: string) => {
    // Clear any pending clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Clear first, then set - this ensures screen readers pick up repeated messages
    setMessage('')

    // Use requestAnimationFrame to ensure the clear happens before the new message
    requestAnimationFrame(() => {
      setMessage(newMessage)

      // Clear after a delay to allow screen reader to finish
      timeoutRef.current = setTimeout(() => {
        setMessage('')
      }, 3000)
    })
  }, [])

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
      <output
        aria-live="polite"
        aria-atomic="true"
        style={liveRegionStyle}
      >
        {message}
      </output>
    </AnnouncementContext.Provider>
  )
}

/**
 * Hook to access the announcement function.
 * Must be used within an AnnouncementProvider.
 */
export function useAnnounce(): (message: string) => void {
  const context = useContext(AnnouncementContext)
  if (!context) {
    throw new Error('useAnnounce must be used within an AnnouncementProvider')
  }
  return context.announce
}
