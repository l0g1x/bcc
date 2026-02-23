/**
 * Full-page error component for critical failures.
 * Shown when the backend is not running or unreachable.
 */
import { type CSSProperties, useCallback, useState } from 'react'

export interface ErrorPageProps {
  title?: string
  message?: string
  details?: string
  onRetry?: () => Promise<void>
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#1e1e1e',
  color: '#cccccc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '24px',
  textAlign: 'center',
}

const iconStyle: CSSProperties = {
  width: '64px',
  height: '64px',
  marginBottom: '24px',
  color: '#f87171',
}

const titleStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#f87171',
  marginBottom: '12px',
}

const messageStyle: CSSProperties = {
  fontSize: '16px',
  color: '#9ca3af',
  marginBottom: '24px',
  maxWidth: '480px',
  lineHeight: 1.5,
}

const detailsStyle: CSSProperties = {
  fontSize: '13px',
  fontFamily: 'monospace',
  color: '#6b7280',
  backgroundColor: '#111827',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
  maxWidth: '600px',
  textAlign: 'left',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const buttonStyle: CSSProperties = {
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#fff',
  backgroundColor: '#3b82f6',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}

const buttonDisabledStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#6b7280',
  cursor: 'not-allowed',
}

const helpTextStyle: CSSProperties = {
  marginTop: '32px',
  fontSize: '13px',
  color: '#6b7280',
  maxWidth: '400px',
  lineHeight: 1.5,
}

const codeStyle: CSSProperties = {
  fontFamily: 'monospace',
  backgroundColor: '#374151',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
}

/**
 * Disconnected icon (wifi-off style)
 */
function DisconnectedIcon() {
  return (
    <svg
      style={iconStyle}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Connection error"
    >
      <title>Connection error</title>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

/**
 * Full-page error display for when the backend is unreachable.
 */
export function ErrorPage({
  title = 'Cannot Connect to Backend',
  message = 'The Beads IDE backend server is not running or cannot be reached.',
  details,
  onRetry,
}: ErrorPageProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, isRetrying])

  return (
    <div style={containerStyle}>
      <DisconnectedIcon />
      <h1 style={titleStyle}>{title}</h1>
      <p style={messageStyle}>{message}</p>

      {details && <pre style={detailsStyle}>{details}</pre>}

      {onRetry && (
        <button
          type="button"
          style={isRetrying ? buttonDisabledStyle : buttonStyle}
          onClick={handleRetry}
          disabled={isRetrying}
          onMouseOver={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }
          }}
          onMouseOut={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }
          }}
          onFocus={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }
          }}
          onBlur={(e) => {
            if (!isRetrying) {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }
          }}
        >
          {isRetrying ? 'Connecting...' : 'Retry Connection'}
        </button>
      )}

      <p style={helpTextStyle}>
        Make sure the backend is running:
        <br />
        <code style={codeStyle}>npm run dev</code> in the <code style={codeStyle}>beads-ide</code>{' '}
        directory
      </p>
    </div>
  )
}

/**
 * Generic error page for React Error Boundaries.
 */
export interface GenericErrorPageProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function GenericErrorPage({ error, resetErrorBoundary }: GenericErrorPageProps) {
  return (
    <ErrorPage
      title="Something Went Wrong"
      message="An unexpected error occurred. Please try again."
      details={error.message}
      onRetry={resetErrorBoundary ? async () => resetErrorBoundary() : undefined}
    />
  )
}
