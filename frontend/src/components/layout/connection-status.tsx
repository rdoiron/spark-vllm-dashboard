"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting"

interface ConnectionStatusContextType {
  state: ConnectionState
  isConnected: boolean
  reconnect: () => void
  lastConnected: Date | null
}

const ConnectionStatusContext = createContext<ConnectionStatusContextType | null>(null)

export function useConnectionStatus() {
  const context = useContext(ConnectionStatusContext)
  if (!context) {
    return {
      state: "disconnected" as ConnectionState,
      isConnected: false,
      reconnect: () => {},
      lastConnected: null,
    }
  }
  return context
}

interface ConnectionStatusProviderProps {
  children: ReactNode
  url?: string
}

export function ConnectionStatusProvider({ children, url }: ConnectionStatusProviderProps) {
  const [state, setState] = useState<ConnectionState>("connecting")
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const stateRef = useRef<ConnectionState>("connecting")

  const reconnect = useCallback(() => {
    setState("reconnecting")
    setReconnectAttempts((prev) => prev + 1)
  }, [])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || "ws://192.168.5.157:8080/api/metrics/stream"

      try {
        ws = new WebSocket(wsUrl)
        setState("connecting")

        ws.onopen = () => {
          setState("connected")
          setLastConnected(new Date())
          setReconnectAttempts(0)
        }

        ws.onclose = () => {
          if (stateRef.current === "connected") {
            setState("disconnected")
            reconnectTimeout = setTimeout(() => {
              setState("reconnecting")
              reconnect()
            }, 3000)
          }
        }

        ws.onerror = () => {
          setState("disconnected")
        }

        ws.onmessage = (event) => {
          console.log("WebSocket message received:", event.data)
        }
      } catch (error) {
        setState("disconnected")
        reconnectTimeout = setTimeout(() => {
          setState("reconnecting")
          reconnect()
        }, 5000)
      }
    }

    connect()

    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [url, reconnect])

  return (
    <ConnectionStatusContext.Provider
      value={{
        state,
        isConnected: state === "connected",
        reconnect,
        lastConnected,
      }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  )
}

interface ConnectionStatusProps {
  className?: string
  showLabel?: boolean
}

export function ConnectionStatus({ className, showLabel = false }: ConnectionStatusProps) {
  const { state, isConnected, reconnect } = useConnectionStatus()

  const getIcon = () => {
    switch (state) {
      case "connecting":
        return <LoadingSpinner className="h-4 w-4" />
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "reconnecting":
        return <LoadingSpinner className="h-4 w-4 animate-spin" />
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-red-400" />
    }
  }

  const getLabel = () => {
    switch (state) {
      case "connecting":
        return "Connecting..."
      case "connected":
        return "Connected"
      case "reconnecting":
        return "Reconnecting..."
      case "disconnected":
        return "Disconnected"
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {getIcon()}
      {showLabel && <span className="text-sm text-muted-foreground">{getLabel()}</span>}
      {state === "disconnected" && (
        <button
          onClick={reconnect}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  )
}

interface ConnectionBadgeProps {
  className?: string
}

export function ConnectionBadge({ className }: ConnectionBadgeProps) {
  const { state, isConnected } = useConnectionStatus()

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
        isConnected
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400",
        className
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          state === "connecting" || state === "reconnecting"
            ? "animate-pulse bg-yellow-400"
            : isConnected
              ? "bg-green-400"
              : "bg-red-400"
        )}
      />
      {state === "connected" ? "Online" : state === "connecting" ? "Connecting..." : state === "reconnecting" ? "Reconnecting..." : "Offline"}
    </div>
  )
}