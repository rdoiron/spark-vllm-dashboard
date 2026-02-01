"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useLogStream, useLogFilter, LogEntry, downloadLogs } from "@/hooks/useLogs"
import { LogViewer } from "@/components/logs/log-viewer"
import { LogControls, LogStatsDisplay } from "@/components/logs/log-controls"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Activity,
  Server,
  Terminal,
  AlertCircle,
  Download,
} from "lucide-react"

export default function LogsPage() {
  const { history, isConnected, connectionError, reconnect } = useLogStream({
    maxBufferSize: 2000,
  })

  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [lines, setLines] = useState(500)

  const filterState = useLogFilter(history)

  const filteredLogs = useMemo(() => {
    let result = filterState.filteredLogs

    if (!isPaused) {
      result = result
    }

    return result
  }, [filterState.filteredLogs, isPaused])

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev)
    if (isPaused) {
      setAutoScroll(true)
    }
  }, [isPaused])

  const handleAutoScrollChange = useCallback((value: boolean) => {
    setAutoScroll(value)
  }, [])

  const handleClear = useCallback(() => {
    setIsPaused(false)
    setAutoScroll(true)
  }, [])

  const handleDownload = useCallback(async () => {
    try {
      await downloadLogs(lines)
    } catch (error) {
      console.error("Failed to download logs:", error)
    }
  }, [lines])

  const levelCounts = useMemo(() => {
    return {
      DEBUG: history.filter((l) => l.level === "DEBUG").length,
      INFO: history.filter((l) => l.level === "INFO").length,
      WARNING: history.filter((l) => l.level === "WARNING").length,
      ERROR: history.filter((l) => l.level === "ERROR").length,
      CRITICAL: history.filter((l) => l.level === "CRITICAL").length,
    }
  }, [history])

  return (
    <div className="h-full flex flex-col">
      <div className="container mx-auto py-6 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Terminal className="h-7 w-7" />
              Logs
            </h1>
            <p className="text-muted-foreground">
              Real-time vLLM server log streaming
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-2 px-3 py-1"
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

        <Separator />

        <div className="flex flex-col gap-4">
          <LogControls
            isConnected={isConnected}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
            onReconnect={reconnect}
            onDownload={handleDownload}
            onClear={handleClear}
            onLevelToggle={filterState.toggleLevel}
            onSearchChange={filterState.setSearchQuery}
            filterState={{
              levels: filterState.filterLevel,
              searchQuery: filterState.searchQuery,
            }}
            logCount={history.length}
            filteredCount={filterState.filteredLogs.length}
          />

          <LogViewer
            logs={isPaused ? filterState.filteredLogs : filteredLogs}
            isConnected={isConnected}
            isPaused={isPaused}
            autoScroll={autoScroll}
            onAutoScrollChange={handleAutoScrollChange}
            className="h-[calc(100vh-280px)] min-h-[400px]"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <LogStatsDisplay
              logCount={history.length}
              filteredCount={filterState.filteredLogs.length}
              levels={levelCounts}
            />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Buffer:</span>
                <Select value={lines.toString()} onValueChange={(v) => setLines(parseInt(v))}>
                  <SelectTrigger className="h-6 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500 lines</SelectItem>
                    <SelectItem value="1000">1000 lines</SelectItem>
                    <SelectItem value="2000">2000 lines</SelectItem>
                    <SelectItem value="5000">5000 lines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span>Auto-scroll:</span>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => handleAutoScrollChange(e.target.checked)}
                  className="rounded border-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}