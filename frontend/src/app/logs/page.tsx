"use client"

import React, { useState } from "react"
import { useLogStream, fetchLogHistory, downloadLogs, LogEntry } from "@/hooks/useLogs"
import { LogViewer, LogStats } from "@/components/logs/log-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Server, AlertCircle, Download } from "lucide-react"

export default function LogsPage() {
  const { isConnected, connectionError, reconnect } = useLogStream()
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [lines, setLines] = useState(100)
  const [filterLevel, setFilterLevel] = useState<string>("ALL")

  const handleLoadHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetchLogHistory(lines, filterLevel === "ALL" ? undefined : filterLevel)
      setHistoryLogs(response.logs)
    } catch (error) {
      console.error("Failed to load log history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadLogs(lines)
    } catch (error) {
      console.error("Failed to download logs:", error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-muted-foreground">
            View and monitor vLLM server logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {isConnected ? "Streaming" : "Disconnected"}
          </Badge>
          {connectionError && (
            <Badge variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              {connectionError}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <LogViewer />

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Log Statistics
                </CardTitle>
                <LogStats logs={historyLogs} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold">{historyLogs.length}</div>
                  <div className="text-xs text-muted-foreground">Total Logs</div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {historyLogs.filter((l) => l.level === "DEBUG").length}
                  </div>
                  <div className="text-xs text-muted-foreground">DEBUG</div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {historyLogs.filter((l) => l.level === "INFO").length}
                  </div>
                  <div className="text-xs text-muted-foreground">INFO</div>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">
                    {historyLogs.filter((l) => l.level === "ERROR" || l.level === "CRITICAL").length}
                  </div>
                  <div className="text-xs text-muted-foreground">ERROR</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Lines</label>
                <Select value={lines.toString()} onValueChange={(v) => setLines(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 lines</SelectItem>
                    <SelectItem value="100">100 lines</SelectItem>
                    <SelectItem value="200">200 lines</SelectItem>
                    <SelectItem value="500">500 lines</SelectItem>
                    <SelectItem value="1000">1000 lines</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Level</label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="WARNING">WARNING</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleLoadHistory} disabled={historyLoading}>
                  {historyLoading ? "Loading..." : "Load History"}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Log Format</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Logs are parsed to extract:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <span className="font-mono text-xs">timestamp</span> - ISO 8601 format
                </li>
                <li>
                  <span className="font-mono text-xs">level</span> - DEBUG/INFO/WARNING/ERROR
                </li>
                <li>
                  <span className="font-mono text-xs">message</span> - Log content
                </li>
              </ul>
              <p className="mt-2 text-xs">
                Timestamps are auto-detected from various formats. If no
                timestamp is found, the current time is used.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Connection Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buffer:</span>
                <span>{historyLogs.length} logs</span>
              </div>
              {connectionError && (
                <div className="p-2 bg-destructive/10 rounded text-destructive text-xs">
                  {connectionError}
                </div>
              )}
              {!isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={reconnect}
                >
                  Reconnect
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}