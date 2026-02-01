import { useState, useEffect, useCallback, useRef } from "react"

export interface LogEntry {
  timestamp: string
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"
  message: string
  raw_line: string
}

export interface LogHistoryResponse {
  logs: LogEntry[]
  count: number
  timestamp: string
}

interface UseLogStreamOptions {
  maxBufferSize?: number
  onError?: (error: string) => void
}

interface UseLogStreamReturn {
  current: LogEntry | null
  history: LogEntry[]
  isConnected: boolean
  connectionError: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useLogStream(
  options: UseLogStreamOptions = {}
): UseLogStreamReturn {
  const { maxBufferSize = 1000, onError } = options

  const [current, setCurrent] = useState<LogEntry | null>(null)
  const [history, setHistory] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const connectRef = useRef<(() => void) | null>(null)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
    const ws = new WebSocket(`${wsUrl}/api/logs/stream`)

    ws.onopen = () => {
      setIsConnected(true)
      setConnectionError(null)
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data)
        setCurrent(data)

        setHistory((prev) => {
          const newHistory = [...prev, data]
          if (newHistory.length > maxBufferSize) {
            return newHistory.slice(-maxBufferSize)
          }
          return newHistory
        })
      } catch (e) {
        console.error("Failed to parse log message:", e)
      }
    }

    ws.onerror = () => {
      setConnectionError("WebSocket connection error")
      if (onError) {
        onError("WebSocket connection error")
      }
    }

    ws.onclose = () => {
      setIsConnected(false)

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectRef.current) {
            connectRef.current()
          }
        }, delay)
      } else {
        setConnectionError("Max reconnection attempts reached")
      }
    }

    wsRef.current = ws
  }, [maxBufferSize, onError])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    reconnectAttemptsRef.current = 0

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setConnectionError(null)
    connect()
  }, [disconnect, connect])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    current,
    history,
    isConnected,
    connectionError,
    reconnect,
    disconnect,
  }
}

export async function fetchLogHistory(
  lines: number = 100,
  level?: string
): Promise<LogHistoryResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  const params = new URLSearchParams({ lines: lines.toString() })
  if (level) {
    params.append("level", level)
  }

  const response = await fetch(`${baseUrl}/api/logs/history?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(error.message || `HTTP error ${response.status}`)
  }

  return response.json()
}

export async function downloadLogs(
  lines: number = 1000,
  filter?: (log: LogEntry) => boolean
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  const params = new URLSearchParams({ lines: lines.toString() })

  const response = await fetch(`${baseUrl}/api/logs/download?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(error.message || `HTTP error ${response.status}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const contentDisposition = response.headers.get("Content-Disposition")
  const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || "vllm_logs.log"
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export function useLogFilter(logs: LogEntry[]) {
  const [filterLevel, setFilterLevel] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const toggleLevel = useCallback((level: string) => {
    setFilterLevel((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(level)) {
        newSet.delete(level)
      } else {
        newSet.add(level)
      }
      return newSet
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilterLevel(new Set())
    setSearchQuery("")
  }, [])

  const filteredLogs = useCallback(() => {
    let result = logs

    if (filterLevel.size > 0) {
      result = result.filter((log) => filterLevel.has(log.level))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.timestamp.toLowerCase().includes(query)
      )
    }

    return result
  }, [logs, filterLevel, searchQuery])

  return {
    filterLevel,
    searchQuery,
    toggleLevel,
    setSearchQuery,
    clearFilters,
    filteredLogs: filteredLogs(),
    hasActiveFilters: filterLevel.size > 0 || searchQuery.trim().length > 0,
  }
}