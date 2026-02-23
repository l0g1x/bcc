/**
 * OpenCode terminal emulator component.
 * Embeds xterm.js and connects to OpenCode via PTY/WebSocket.
 */
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import './opencode-terminal.css'

// --- Types ---

interface PtySession {
  id: string
  ws: WebSocket
}

// --- Styles ---

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1, // Fill parent flex container
  minHeight: 0, // Critical for flex to allow shrinking
  backgroundColor: '#0f172a',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid #334155',
  backgroundColor: '#1e293b',
  flexShrink: 0,
}

const headerTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const statusDotStyle = (connected: boolean): CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: connected ? '#22c55e' : '#ef4444',
})

const closeButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '16px',
  padding: '4px 8px',
  borderRadius: '4px',
  lineHeight: 1,
}

const terminalContainerStyle: CSSProperties = {
  flex: 1,
  minHeight: 0, // Critical for flex to allow shrinking
  position: 'relative',
  overflow: 'hidden',
}

const connectPromptStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  padding: '24px',
  color: '#9ca3af',
}

const connectButtonStyle: CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
}

const errorStyle: CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid #ef4444',
  borderRadius: '6px',
  color: '#fca5a5',
  fontSize: '12px',
  margin: '8px 12px',
}

// --- Props ---

export interface OpenCodeTerminalProps {
  /** OpenCode server URL */
  serverUrl?: string
  /** Callback when terminal is closed */
  onClose?: () => void
}

// --- Component ---

export function OpenCodeTerminal({
  serverUrl = 'http://localhost:4096',
  onClose,
}: OpenCodeTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const ptyRef = useRef<PtySession | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const term = new Terminal({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        cursorAccent: '#0f172a',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Handle resize - both window and container
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    // Use ResizeObserver for container size changes - debounced to prevent feedback loop
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null
    let lastWidth = 0
    let lastHeight = 0
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      // Only resize if the container size actually changed significantly
      const { width, height } = entry.contentRect
      if (Math.abs(width - lastWidth) < 5 && Math.abs(height - lastHeight) < 5) {
        return
      }
      lastWidth = width
      lastHeight = height

      // Debounce the fit call
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        fitAddon.fit()
        // Also trigger resize event for connected PTY
        if (ptyRef.current && term.cols && term.rows) {
          fetch(`http://localhost:4096/pty/${ptyRef.current.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cols: term.cols, rows: term.rows }),
          }).catch(() => {})
        }
      }, 100)
    })
    resizeObserver.observe(terminalRef.current)

    // Initial fit - wait for layout with multiple attempts
    const fitTimeouts = [0, 50, 100, 200, 500, 1000].map(delay =>
      setTimeout(() => fitAddon.fit(), delay)
    )

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      if (resizeTimeout) clearTimeout(resizeTimeout)
      fitTimeouts.forEach(clearTimeout)
      term.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // Fit terminal when connected - multiple times to ensure correct sizing
  useEffect(() => {
    if (fitAddonRef.current && isConnected) {
      // Fit multiple times as layout settles
      const timeouts = [0, 50, 150, 300, 500, 1000].map(delay =>
        setTimeout(() => {
          fitAddonRef.current?.fit()
          // Also notify PTY of the new size
          if (ptyRef.current && xtermRef.current) {
            const { cols, rows } = xtermRef.current
            fetch(`http://localhost:4096/pty/${ptyRef.current.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cols, rows }),
            }).catch(() => {})
          }
        }, delay)
      )
      return () => timeouts.forEach(clearTimeout)
    }
  }, [isConnected])

  // Connect to OpenCode PTY
  const connect = useCallback(async () => {
    if (!xtermRef.current) return

    setIsConnecting(true)
    setError(null)

    const term = xtermRef.current

    try {
      
      // Create PTY session - use login shell to run opencode attach
      const createResponse = await fetch(`${serverUrl}/pty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: '/bin/bash',
          args: ['-l', '-c', `opencode attach ${serverUrl}`],
          env: {
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
          },
        }),
      })

      if (!createResponse.ok) {
        const text = await createResponse.text()
        throw new Error(`Failed to create PTY: ${createResponse.status} ${text}`)
      }

      const ptyData = await createResponse.json()
      console.log('PTY create response:', ptyData)
      const ptyId = ptyData.id

      if (!ptyId) {
        throw new Error('No PTY ID returned: ' + JSON.stringify(ptyData))
      }

      
      // Connect via WebSocket
      const wsUrl = serverUrl.replace(/^http/, 'ws') + `/pty/${ptyId}/connect`
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        ptyRef.current = { id: ptyId, ws }

        // Fit terminal and send size to PTY
        setTimeout(() => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit()
            const { cols, rows } = term
            console.log('Terminal size:', cols, rows)
            // Send resize to PTY
            fetch(`${serverUrl}/pty/${ptyId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cols, rows }),
            }).catch(console.error)
          }
        }, 100)
      }

      ws.onmessage = (event) => {
        // Handle incoming data - could be raw text or JSON
        if (typeof event.data === 'string') {
          let data = event.data
          // Strip cursor position JSON that may appear in output
          // Pattern: {"cursor":N} anywhere in the message
          data = data.replace(/\{"cursor":\d+\}/g, '')
          if (!data.trim()) return // Message was only cursor data

          try {
            const msg = JSON.parse(data)
            // Skip cursor position messages and other control messages without data
            if (msg.cursor !== undefined && !msg.data) {
              return
            }
            if (msg.type === 'data' && msg.data) {
              term.write(msg.data)
            } else if (msg.data) {
              term.write(msg.data)
            }
          } catch {
            // Plain text data - write directly
            term.write(data)
          }
        } else if (event.data instanceof Blob) {
          // Binary data
          event.data.text().then((text) => {
            // Strip cursor position JSON from blob data too
            const cleaned = text.replace(/\{"cursor":\d+\}/g, '')
            if (cleaned.trim()) term.write(cleaned)
          })
        }
      }

      ws.onerror = (e) => {
        console.error('WebSocket error:', e)
        term.writeln('\x1b[31mWebSocket error\x1b[0m')
      }

      ws.onclose = () => {
        term.writeln('\x1b[31mConnection closed\x1b[0m')
        setIsConnected(false)
        ptyRef.current = null
      }

      // Send terminal input to PTY - try raw data first
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log('Sending:', data)
          // Try sending raw data - OpenCode might not use JSON
          ws.send(data)
        }
      })

      // Handle terminal resize via the REST API
      term.onResize(({ cols, rows }) => {
        console.log('Terminal resized to:', cols, 'x', rows)
        if (ptyRef.current) {
          fetch(`${serverUrl}/pty/${ptyRef.current.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cols, rows }),
          }).catch(console.error)
        }
      })

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setError(errMsg)
      term.writeln(`\x1b[31mError: ${errMsg}\x1b[0m`)
      term.writeln('')
      term.writeln('\x1b[33mMake sure opencode serve is running with:\x1b[0m')
      term.writeln('\x1b[37m  opencode serve --cors http://localhost:5173\x1b[0m')
      setIsConnecting(false)
    }
  }, [serverUrl])

  // Disconnect
  const disconnect = useCallback(() => {
    if (ptyRef.current) {
      ptyRef.current.ws.close()
      ptyRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerTitleStyle}>
          <div style={statusDotStyle(isConnected)} />
          <span>OpenCode Terminal</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isConnected && (
            <button
              type="button"
              style={{
                ...connectButtonStyle,
                padding: '4px 12px',
                fontSize: '12px',
              }}
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          {isConnected && (
            <button
              type="button"
              style={{
                ...connectButtonStyle,
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: '#ef4444',
              }}
              onClick={disconnect}
            >
              Disconnect
            </button>
          )}
          {onClose && (
            <button
              type="button"
              style={closeButtonStyle}
              onClick={onClose}
              aria-label="Close terminal"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Terminal */}
      <div style={terminalContainerStyle}>
        <div
          className="opencode-terminal-container"
          ref={terminalRef}
        />
      </div>
    </div>
  )
}
