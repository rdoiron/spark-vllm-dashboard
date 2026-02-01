"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LogEntry, useLogStream } from "@/hooks/useLogs"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Filter,
  Terminal,
} from "lucide-react"

interface LogViewerProps {
  className?: string
}

export function LogViewer({ className }: LogViewerProps) {
  const {
    current,
    history,
    isConnected,
    connectionError,
    reconnect,
    disconnect,
  } = useLogStream({ maxDataPoints: 1000 })

  const [isPaused, setIsPaused] = useState(false)
  const [filterLevel, setFilterLevel] = useState<string>("ALL")
  const [autoScroll, setAutoScroll] = useState(true)
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set())

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, autoScroll])

  const filteredLogs = history.filter((log) => {
    if (filterLevel === "ALL") return true
    return log.level === filterLevel
  })

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

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case "DEBUG":
        return "bg-blue-400/10"
      case "INFO":
        return "bg-green-400/10"
      case "WARNING":
        return "bg-yellow-400/10"
      case "ERROR":
        return "bg-red-400/10"
      case "CRITICAL":
        return "bg-red-600/20"
      default:
        return "bg-muted"
    }
  }

  const handleSelectLog = (timestamp: string) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(timestamp)) {
      newSelected.delete(timestamp)
    } else {
      newSelected.add(timestamp)
    }
    setSelectedLogs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedLogs.size === filteredLogs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(filteredLogs.map((l) => l.timestamp)))
    }
  }

  const handleClearLogs = () => {
    setSelectedLogs(new Set())
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    } catch {
      return timestamp
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Log Stream
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                )}
              />
              {isConnected ? "Live" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={isConnected ? disconnect : reconnect}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            {isConnected ? "Disconnect" : "Reconnect"}
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Label htmlFor="auto-scroll" className="text-xs">
              Auto-scroll
            </Label>
            <Checkbox
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
            />
          </div>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={scrollRef}
          className="h-[500px] overflow-y-auto font-mono text-xs bg-muted/20 rounded-lg border"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isConnected ? "Waiting for logs..." : "Not connected"}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.timestamp}
                  className={cn(
                    "flex items-start gap-2 p-1 rounded",
                    getLevelBgColor(log.level),
                    selectedLogs.has(log.timestamp) && "ring-2 ring-primary"
                  )}
                >
                  <Checkbox
                    checked={selectedLogs.has(log.timestamp)}
                    onCheckedChange={() => handleSelectLog(log.timestamp)}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground min-w-24 shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("min-w-16 justify-center", getLevelColor(log.level))}
                  >
                    {log.level}
                  </Badge>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted-foreground">
            {filteredLogs.length} logs
            {selectedLogs.size > 0 && ` (${selectedLogs.size} selected)`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedLogs.size === filteredLogs.length && filteredLogs.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              disabled={selectedLogs.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const content = selectedLogs.size > 0
                  ? filteredLogs
                      .filter((l) => selectedLogs.has(l.timestamp))
                      .map((l) => l.raw_line)
                      .join("\n")
                  : filteredLogs.map((l) => l.raw_line).join("\n")
                const blob = new Blob([content], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `vllm_logs_${new Date().toISOString()}.log`
                document.body.appendChild(a)
                a.click()
                URL.revokeObjectURL(url)
                document.body.removeChild(a)
              }}
              disabled={filteredLogs.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface LogStatsProps {
  logs: LogEntry[]
  className?: string
}

export function LogStats({ logs, className }: LogStatsProps) {
  const stats = {
    total: logs.length,
    debug: logs.filter((l) => l.level === "DEBUG").length,
    info: logs.filter((l) => l.level === "INFO").length,
    warning: logs.filter((l) => l.level === "WARNING").length,
    error: logs.filter((l) => l.level === "ERROR" || l.level === "CRITICAL").length,
  }

  return (
    <div className={cn("flex gap-4 text-sm", className)}>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-medium">{stats.total}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-blue-400">DEBUG:</span>
        <span className="font-medium">{stats.debug}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-green-400">INFO:</span>
        <span className="font-medium">{stats.info}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-yellow-400">WARN:</span>
        <span className="font-medium">{stats.warning}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-red-400">ERROR:</span>
        <span className="font-medium">{stats.error}</span>
      </div>
    </div>
  )
}