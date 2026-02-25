import { type OpencodeClient, createOpencodeClient } from '@opencode-ai/sdk/client'
/**
 * Hook for connecting to an OpenCode server and managing sessions.
 * Provides real-time streaming of AI responses via SSE.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// --- Types ---

export interface OpenCodeMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  status?: 'pending' | 'streaming' | 'complete' | 'error'
}

export interface OpenCodeSession {
  id: string
  title?: string
  createdAt: number
}

export interface UseOpenCodeOptions {
  /** OpenCode server URL (default: http://localhost:4096) */
  serverUrl?: string
  /** Auto-connect on mount */
  autoConnect?: boolean
}

export interface UseOpenCodeReturn {
  /** Whether connected to the server */
  isConnected: boolean
  /** Whether currently loading/streaming */
  isLoading: boolean
  /** Current session */
  session: OpenCodeSession | null
  /** Messages in the current session */
  messages: OpenCodeMessage[]
  /** Connection error */
  error: Error | null
  /** Connect to the server */
  connect: () => Promise<void>
  /** Disconnect from the server */
  disconnect: () => void
  /** Send a message/prompt */
  sendMessage: (content: string) => Promise<void>
  /** Create a new session */
  createSession: () => Promise<void>
  /** Clear messages */
  clearMessages: () => void
}

// --- Default config ---

const DEFAULT_SERVER_URL = 'http://localhost:4096'

/**
 * Hook for OpenCode server integration.
 * Manages connection, sessions, and message streaming.
 */
export function useOpenCode(options: UseOpenCodeOptions = {}): UseOpenCodeReturn {
  const { serverUrl = DEFAULT_SERVER_URL, autoConnect = false } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<OpenCodeSession | null>(null)
  const [messages, setMessages] = useState<OpenCodeMessage[]>([])
  const [error, setError] = useState<Error | null>(null)

  const clientRef = useRef<OpencodeClient | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Create client instance
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = createOpencodeClient({
        baseUrl: serverUrl,
      })
    }
    return clientRef.current
  }, [serverUrl])

  // Connect to server and verify connection
  const connect = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Test connection with a simple fetch first
      const testResponse = await fetch(`${serverUrl}/session`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!testResponse.ok) {
        throw new Error(`Server returned ${testResponse.status}`)
      }

      setIsConnected(true)

      // Subscribe to events via SSE
      const eventSource = new EventSource(`${serverUrl}/event`)
      eventSource.onopen = () => {
        console.log('SSE connection opened')
      }
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleServerEvent(data)
        } catch {
          // Ignore parse errors
        }
      }
      eventSource.onerror = (e) => {
        console.error('SSE error:', e)
        // Don't disconnect on SSE error - it might reconnect
      }
      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('Connection error:', err)
      const connectError = err instanceof Error ? err : new Error(String(err))
      setError(connectError)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl])

  // Handle server-sent events
  const handleServerEvent = useCallback((event: Record<string, unknown>) => {
    const type = event.type as string

    if (type === 'message.part.text') {
      // Streaming text content
      const content = event.content as string
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'assistant' && last.status === 'streaming') {
          return [...prev.slice(0, -1), { ...last, content: last.content + content }]
        }
        return prev
      })
    } else if (type === 'message.complete') {
      // Message complete
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, status: 'complete' }]
        }
        return prev
      })
      setIsLoading(false)
    }
  }, [])

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    clientRef.current = null
    setIsConnected(false)
    setSession(null)
    setMessages([])
  }, [])

  // Create a new session
  const createSession = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Not connected to server')
    }

    try {
      const client = getClient()
      const result = await client.session.create()

      if (result.error || !result.data) {
        throw new Error('Failed to create session')
      }

      const newSession: OpenCodeSession = {
        id: result.data.id,
        title: result.data.title,
        createdAt: Date.now(),
      }
      setSession(newSession)
      setMessages([])
    } catch (err) {
      const sessionError = err instanceof Error ? err : new Error(String(err))
      setError(sessionError)
      throw sessionError
    }
  }, [isConnected, getClient])

  // Send a message/prompt
  const sendMessage = useCallback(
    async (content: string) => {
      if (!isConnected || !session) {
        throw new Error('No active session')
      }

      const userMessage: OpenCodeMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'complete',
      }
      setMessages((prev) => [...prev, userMessage])

      // Add placeholder for assistant response
      const assistantMessage: OpenCodeMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'streaming',
      }
      setMessages((prev) => [...prev, assistantMessage])

      setIsLoading(true)
      setError(null)

      try {
        const client = getClient()
        await client.session.prompt({
          path: { id: session.id },
          body: {
            parts: [{ type: 'text', text: content }],
          },
        })
      } catch (err) {
        const sendError = err instanceof Error ? err : new Error(String(err))
        setError(sendError)
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, status: 'error', content: `Error: ${sendError.message}` },
            ]
          }
          return prev
        })
        setIsLoading(false)
      }
    },
    [isConnected, session, getClient]
  )

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    isLoading,
    session,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    createSession,
    clearMessages,
  }
}
