/**
 * Connection gate component that blocks app rendering until backend health is verified.
 * Shows ErrorPage if backend is unreachable on startup.
 * After initial check, shows OfflineBanner for subsequent disconnections.
 */
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { checkHealth, getConnectionState, onConnectionStateChange } from '../../lib/api'
import { ErrorPage } from './error-page'

export interface ConnectionGateProps {
  /** Children to render when connected or after initial check passes */
  children: ReactNode
  /** Polling interval for health checks when disconnected (ms) */
  pollInterval?: number
}

type GateState = 'checking' | 'connected' | 'disconnected'

/**
 * Wraps the app and shows ErrorPage if backend is unreachable on initial load.
 * After the first successful connection, allows the app to render and relies on
 * OfflineBanner for subsequent connection issues.
 */
export function ConnectionGate({ children, pollInterval = 5000 }: ConnectionGateProps) {
  const [gateState, setGateState] = useState<GateState>('checking')
  const [hasEverConnected, setHasEverConnected] = useState(false)

  // Initial health check on mount
  useEffect(() => {
    let isMounted = true

    async function initialCheck() {
      const isHealthy = await checkHealth()
      if (!isMounted) return

      if (isHealthy) {
        setHasEverConnected(true)
        setGateState('connected')
      } else {
        setGateState('disconnected')
      }
    }

    initialCheck()

    return () => {
      isMounted = false
    }
  }, [])

  // Subscribe to connection state changes after initial check
  useEffect(() => {
    if (!hasEverConnected) return

    return onConnectionStateChange((state) => {
      setGateState(state === 'connected' ? 'connected' : 'disconnected')
    })
  }, [hasEverConnected])

  // Poll for reconnection when disconnected
  useEffect(() => {
    if (gateState !== 'disconnected' || hasEverConnected) return

    const intervalId = setInterval(async () => {
      const isHealthy = await checkHealth()
      if (isHealthy) {
        setHasEverConnected(true)
        setGateState('connected')
      }
    }, pollInterval)

    return () => clearInterval(intervalId)
  }, [gateState, hasEverConnected, pollInterval])

  const handleRetry = useCallback(async () => {
    setGateState('checking')
    const isHealthy = await checkHealth()
    if (isHealthy) {
      setHasEverConnected(true)
      setGateState('connected')
    } else {
      setGateState('disconnected')
    }
  }, [])

  // Show loading spinner during initial check
  if (gateState === 'checking') {
    return (
      // biome-ignore lint/a11y/useSemanticElements: intentional ARIA status role for loading indicator
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1e1e1e',
          color: '#9ca3af',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #374151',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div>Connecting to backend...</div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Show error page if disconnected on startup (before first successful connection)
  if (gateState === 'disconnected' && !hasEverConnected) {
    return (
      <ErrorPage
        title="Cannot Connect to Backend"
        message="The Beads IDE backend server is not running or cannot be reached. Please start the backend server and try again."
        onRetry={handleRetry}
      />
    )
  }

  // After first successful connection, render children (OfflineBanner handles subsequent disconnections)
  return <>{children}</>
}
