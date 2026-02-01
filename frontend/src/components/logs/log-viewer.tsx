"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { LogEntry } from "@/hooks/useLogs"
import { cn } from "@/lib/utils"

interface LogViewerProps {
  logs: LogEntry[]
  isConnected: boolean
  isPaused: boolean
  autoScroll: boolean
  onAutoScrollChange: (value: boolean) => void
  className?: string
}

export function LogViewer({
  logs,
  isConnected,
  isPaused,
  autoScroll,
  onAutoScrollChange,
  className,
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const formatTimestamp = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      const seconds = date.getSeconds().toString().padStart(2, "0")
      const ms = date.getMilliseconds().toString().padStart(3, "0")
      return `${hours}:${minutes}:${seconds}.${ms}`
    } catch {
      return timestamp
    }
  }, [])

  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case "DEBUG":
        return "text-blue-400"
      case "INFO":
        return "text-green-400"
      case "WARNING":
        return "text-yellow-400"
      case "ERROR":
        return "text-red-400"
      case "CRITICAL":
        return "text-red-600 font-bold"
      default:
        return "text-muted-foreground"
    }
  }, [])

  const getLevelBgColor = useCallback((level: string) => {
    switch (level) {
      case "DEBUG":
        return "bg-blue-400/8"
      case "INFO":
        return "bg-green-400/8"
      case "WARNING":
        return "bg-yellow-400/8"
      case "ERROR":
        return "bg-red-400/12"
      case "CRITICAL":
        return "bg-red-600/16"
      default:
        return "bg-transparent"
    }
  }, [])

  useEffect(() => {
    if (!autoScroll || !containerRef.current) return

    const container = containerRef.current
    container.scrollTop = container.scrollHeight
  }, [logs, autoScroll])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 50)
      setShowScrollBottom(
        container.scrollTop < container.scrollHeight - container.clientHeight - 50
      )
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const handleScrollTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleScrollBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
    onAutoScrollChange(true)
  }

  const levelCounts = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [logs])

  return (
    <div className={cn("relative flex flex-col h-full min-h-[400px]", className)}>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed bg-[#0d1117] rounded-lg border scrollbar-thin scrollbar-thumb-scrollbar-thumb scrollbar-track-scrollbar-track"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="mb-2">
                {isConnected ? (
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
                )}
              </div>
              <p>
                {isConnected
                  ? "Waiting for logs..."
                  : "Not connected - click Reconnect to start streaming"}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={`${log.timestamp}-${index}`}
                  className={cn(
                    "hover:bg-muted/20 transition-colors",
                    getLevelBgColor(log.level)
                  )}
                >
                  <td className="px-3 py-0.5 text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-0.5 min-w-[4.5rem] font-medium",
                      getLevelColor(log.level)
                    )}
                  >
                    {log.level}
                  </td>
                  <td className="px-3 py-0.5 break-all whitespace-normal">
                    <span className="text-gray-300">{log.message}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={handleScrollTop}
          className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
          title="Scroll to top"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {showScrollBottom && (
        <button
          onClick={handleScrollBottom}
          className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
          title="Scroll to bottom"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-[#0d1117]/80 px-2 py-1 rounded">
        <span>{logs.length} logs</span>
        {Object.entries(levelCounts).map(([level, count]) => (
          <span key={level} className={cn("ml-2", getLevelColor(level))}>
            {level}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}

interface VirtualLogViewerProps {
  logs: LogEntry[]
  height: number
  itemHeight?: number
  className?: string
}

export function VirtualLogViewer({
  logs,
  height,
  itemHeight = 24,
  className,
}: VirtualLogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(height)

  const totalHeight = logs.length * itemHeight
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    Math.floor((scrollTop + containerHeight) / itemHeight) + 5,
    logs.length - 1
  )
  const visibleLogs = logs.slice(startIndex, endIndex + 1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return `${date.toLocaleTimeString("en-US", {
        hour12: false,
      })}.${date.getMilliseconds().toString().padStart(3, "0")}`
    } catch {
      return timestamp
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "DEBUG":
        return "text-blue-400"
      case "INFO":
        return "text-green-400"
      case "WARNING":
        return "text-yellow-400"
      case "ERROR":
        return "text-red-400"
      case "CRITICAL":
        return "text-red-600 font-bold"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-y-auto font-mono text-xs leading-relaxed bg-[#0d1117] rounded-lg border",
        className
      )}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
          }}
        >
          {visibleLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${startIndex + index}`}
              className="flex items-start hover:bg-muted/20"
              style={{ height: itemHeight }}
            >
              <span className="px-3 py-0.5 text-muted-foreground whitespace-nowrap shrink-0">
                {formatTimestamp(log.timestamp)}
              </span>
              <span
                className={cn(
                  "px-3 py-0.5 min-w-[4.5rem] font-medium shrink-0",
                  getLevelColor(log.level)
                )}
              >
                {log.level}
              </span>
              <span className="px-3 py-0.5 break-all text-gray-300">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}