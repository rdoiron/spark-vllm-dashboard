"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Download,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Search,
  Filter,
  Terminal,
} from "lucide-react"
import { useLogStream, LogEntry } from "@/hooks/useLogs"

type LogLevel = "all" | "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  } catch {
    return timestamp
  }
}

function getLevelColor(level: LogLevel): string {
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

function LogEntryItem({
  entry,
  isLatest,
}: {
  entry: LogEntry
  isLatest: boolean
}) {
  return (
    <div
      className={`flex gap-3 p-2 rounded-md transition-colors ${
        isLatest ? "bg-muted/50" : "hover:bg-muted/30"
      }`}
    >
      <span className="text-xs text-muted-foreground shrink-0 w-24">
        {formatTimestamp(entry.timestamp)}
      </span>
      <Badge
        variant="outline"
        className={`shrink-0 w-20 justify-center text-xs ${getLevelColor(
          entry.level as LogLevel
        )}`}
      >
        {entry.level}
      </Badge>
      <span className="font-mono text-sm">{entry.message}</span>
    </div>
  )
}

export default function LogsPage() {
  const [filterLevel, setFilterLevel] = useState<LogLevel>("all")
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const {
    current,
    history,
    isConnected,
    connectionError,
    reconnect,
    disconnect,
  } = useLogStream({
    maxBufferSize: 500,
  })

  const filteredLogs = history.filter((entry) => {
    if (filterLevel === "all") return true
    return entry.level === filterLevel
  })

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://192.168.5.157:8080"}/api/logs/download?lines=1000`
      )
      if (!response.ok) {
        throw new Error("Failed to download logs")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      a.download = `vllm_logs_${timestamp}.log`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download logs:", error)
    }
  }, [])

  const handleClear = useCallback(() => {
    disconnect()
    setTimeout(() => reconnect(), 100)
  }, [disconnect, reconnect])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length, autoScroll])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Logs
          </h1>
          <p className="text-muted-foreground">
            System and application logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button variant="outline" size="sm" onClick={reconnect}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconnect
          </Button>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Log Stream</CardTitle>
              <CardDescription>
                Real-time logs from the vLLM server
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as LogLevel)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={autoScroll ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
              >
                {autoScroll ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Auto-scroll
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Manual scroll
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>

              <Button variant="default" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{filteredLogs.length} logs</span>
                {current && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Search className="h-3 w-3" />
                Showing: {filterLevel === "all" ? "All levels" : filterLevel}
              </div>
            </div>
            <ScrollArea
              ref={scrollRef}
              className="h-[500px] font-mono text-xs"
            >
              <div className="p-4 space-y-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isConnected
                      ? "Waiting for logs..."
                      : "Not connected. Click Reconnect to start streaming."}
                  </div>
                ) : (
                  filteredLogs.map((entry, index) => (
                    <LogEntryItem
                      key={`${entry.timestamp}-${index}`}
                      entry={entry}
                      isLatest={index === filteredLogs.length - 1}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          {connectionError && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <strong>Error:</strong> {connectionError}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}