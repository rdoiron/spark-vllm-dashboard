import { useState, useEffect, useCallback, useRef } from "react"

export interface VLLMMetrics {
  timestamp: string
  gpu_memory_utilization: number
  gpu_memory_used_bytes: number
  gpu_memory_total_bytes: number
  cpu_utilization: number
  ram_used_bytes: number
  ram_total_bytes: number
  request_count_total: number
  request_count_in_progress: number
  request_count_finished: number
  prompt_tokens_total: number
  generation_tokens_total: number
  total_tokens_total: number
  throughput_tokens_per_second: number
  throughput_requests_per_second: number
  avg_prompt_latency_seconds: number
  avg_generation_latency_seconds: number
  avg_total_latency_seconds: number
  queue_size: number
  time_in_queue_seconds: number
  num_active_requests: number
  num_waiting_requests: number
  num_finished_requests: number
  model_loaded: boolean
  model_name: string | null
  port: number
}

export interface MetricsMessage {
  timestamp: string
  metrics: VLLMMetrics | null
  derived?: {
    throughput_rps?: number
    avg_ttft_ms?: number
    requests_per_min?: number
    cache_hit_rate?: number
  }
  error?: string
}

interface UseMetricsStreamOptions {
  maxDataPoints?: number
  intervalMs?: number
  onError?: (error: string) => void
}

interface UseMetricsStreamReturn {
  current: MetricsMessage | null
  history: MetricsMessage[]
  isConnected: boolean
  connectionError: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useMetricsStream(
  options: UseMetricsStreamOptions = {}
): UseMetricsStreamReturn {
  const {
    maxDataPoints = 300,
    intervalMs = 1000,
    onError,
  } = options

  const [current, setCurrent] = useState<MetricsMessage | null>(null)
  const [history, setHistory] = useState<MetricsMessage[]>([])
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
    const ws = new WebSocket(`${wsUrl}/api/metrics/stream`)

    ws.onopen = () => {
      setIsConnected(true)
      setConnectionError(null)
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: MetricsMessage = JSON.parse(event.data)
        setCurrent(data)

        setHistory((prev) => {
          const newHistory = [...prev, data]
          if (newHistory.length > maxDataPoints) {
            return newHistory.slice(-maxDataPoints)
          }
          return newHistory
        })
      } catch (e) {
        console.error("Failed to parse metrics message:", e)
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
  }, [maxDataPoints, onError])

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