/**
 * OpenCode AI assistant panel.
 * Embeds the OpenCode client for AI-assisted formula editing.
 */
import './opencode-panel.css'
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { type OpenCodeMessage, useOpenCode } from '../../hooks/use-opencode'

// --- Styles ---

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0f172a',
  borderLeft: '1px solid #334155',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #334155',
  backgroundColor: '#1e293b',
  flexShrink: 0,
}

const headerTitleStyle: CSSProperties = {
  fontSize: '14px',
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
  fontSize: '18px',
  padding: '4px 8px',
  borderRadius: '4px',
  lineHeight: 1,
}

const messagesContainerStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const messageStyle = (role: 'user' | 'assistant'): CSSProperties => ({
  padding: '12px 14px',
  borderRadius: '8px',
  backgroundColor: role === 'user' ? '#1e40af' : '#1e293b',
  border: role === 'user' ? 'none' : '1px solid #334155',
  maxWidth: '90%',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
})

const messageContentStyle: CSSProperties = {
  fontSize: '13px',
  color: '#e2e8f0',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const inputContainerStyle: CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid #334155',
  backgroundColor: '#1e293b',
  flexShrink: 0,
}

const inputWrapperStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
}

const inputStyle: CSSProperties = {
  flex: 1,
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#e2e8f0',
  fontSize: '13px',
  outline: 'none',
  resize: 'none',
  minHeight: '40px',
  maxHeight: '120px',
}

const sendButtonStyle = (disabled: boolean): CSSProperties => ({
  padding: '10px 16px',
  backgroundColor: disabled ? '#475569' : '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
})

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
  margin: '0 16px',
}

const emptyStateStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  fontSize: '13px',
  padding: '24px',
  textAlign: 'center',
}

// --- Props ---

export interface OpenCodePanelProps {
  /** Server URL (default: http://localhost:4096) */
  serverUrl?: string
  /** Initial prompt context (e.g., step details) */
  context?: string
  /** Callback when panel is closed */
  onClose?: () => void
}

// --- Component ---

export function OpenCodePanel({
  serverUrl = 'http://localhost:4096',
  context,
  onClose,
}: OpenCodePanelProps) {
  const { isConnected, isLoading, session, messages, error, connect, sendMessage, createSession } =
    useOpenCode({ serverUrl })

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger scroll when message count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Focus input on session create
  useEffect(() => {
    if (session) {
      inputRef.current?.focus()
    }
  }, [session])

  const handleConnect = useCallback(async () => {
    try {
      await connect()
    } catch (err) {
      console.error('Connect failed:', err)
    }
  }, [connect])

  const handleStartSession = useCallback(async () => {
    try {
      await createSession()
    } catch (err) {
      console.error('Create session failed:', err)
    }
  }, [createSession])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const message = input.trim()
      setInput('')
      await sendMessage(message)
    },
    [input, isLoading, sendMessage]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as FormEvent)
      }
    },
    [handleSubmit]
  )

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerTitleStyle}>
          <div style={statusDotStyle(isConnected)} />
          <span>OpenCode Assistant</span>
        </div>
        {onClose && (
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="Close assistant"
          >
            ×
          </button>
        )}
      </div>

      {/* Error display */}
      {error && <div style={errorStyle}>{error.message}</div>}

      {/* Connection prompt */}
      {!isConnected && (
        <div style={connectPromptStyle}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Connect to OpenCode for AI assistance
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
            Make sure <code>opencode serve --cors http://localhost:5173</code> is running
          </div>
          <button
            type="button"
            style={connectButtonStyle}
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect to OpenCode'}
          </button>
        </div>
      )}

      {/* Messages */}
      {isConnected && session && (
        <>
          {messages.length === 0 ? (
            <div style={emptyStateStyle}>
              <div>Ask me anything about this formula or step.</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                I can help with implementation, debugging, or optimization.
              </div>
            </div>
          ) : (
            <div style={messagesContainerStyle}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} style={inputContainerStyle}>
            <div style={inputWrapperStyle}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                style={inputStyle}
                disabled={isLoading}
                rows={1}
              />
              <button
                type="submit"
                style={sendButtonStyle(isLoading || !input.trim())}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Session prompt (connected but no session) */}
      {isConnected && !session && (
        <div style={connectPromptStyle}>
          <div style={{ fontSize: '14px', color: '#22c55e' }}>Connected to OpenCode</div>
          <button type="button" style={connectButtonStyle} onClick={handleStartSession}>
            Start New Session
          </button>
        </div>
      )}
    </div>
  )
}

// --- Message Bubble Component ---

function MessageBubble({ message }: { message: OpenCodeMessage }) {
  return (
    <div style={messageStyle(message.role)}>
      <div style={messageContentStyle}>
        {message.content}
        {message.status === 'streaming' && (
          <span style={{ marginLeft: '8px' }}>
            <span className="opencode-streaming-indicator" />
          </span>
        )}
      </div>
    </div>
  )
}
