"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Search,
  Filter,
} from "lucide-react"

export interface LogFilterState {
  levels: Set<string>
  searchQuery: string
}

interface LogControlsProps {
  isConnected: boolean
  isPaused: boolean
  onPauseToggle: () => void
  onReconnect: () => void
  onDownload: () => void
  onClear: () => void
  onLevelToggle: (level: string) => void
  onSearchChange: (query: string) => void
  filterState: LogFilterState
  logCount: number
  filteredCount: number
  className?: string
}

export function LogControls({
  isConnected,
  isPaused,
  onPauseToggle,
  onReconnect,
  onDownload,
  onClear,
  onLevelToggle,
  onSearchChange,
  filterState,
  logCount,
  filteredCount,
  className,
}: LogControlsProps) {
  const levels = [
    { value: "DEBUG", label: "DEBUG", color: "text-blue-400" },
    { value: "INFO", label: "INFO", color: "text-green-400" },
    { value: "WARNING", label: "WARN", color: "text-yellow-400" },
    { value: "ERROR", label: "ERROR", color: "text-red-400" },
    { value: "CRITICAL", label: "CRIT", color: "text-red-600" },
  ]

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={isPaused ? "default" : "outline"}
          size="sm"
          onClick={onPauseToggle}
          className="min-w-24"
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-1.5" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-1.5" /> Pause
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          disabled={isConnected}
        >
          <RotateCcw className="h-4 w-4 mr-1.5" />
          {isConnected ? "Connected" : "Reconnect"}
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          value={filterState.searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-48 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 px-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {levels.map((level) => (
          <label
            key={level.value}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Checkbox
              checked={filterState.levels.has(level.value)}
              onCheckedChange={() => onLevelToggle(level.value)}
              className="h-3.5 w-3.5 border-muted-foreground"
            />
            <span
              className={cn(
                "text-xs font-mono",
                filterState.levels.has(level.value) ? level.color : "text-muted-foreground"
              )}
            >
              {level.label}
            </span>
          </label>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted-foreground">
          {filteredCount}/{logCount}
        </span>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-1.5" /> Clear
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-1.5" /> Export
        </Button>
      </div>
    </div>
  )
}

interface LogStatsDisplayProps {
  logCount: number
  filteredCount: number
  levels: {
    DEBUG: number
    INFO: number
    WARNING: number
    ERROR: number
    CRITICAL: number
  }
  className?: string
}

export function LogStatsDisplay({
  logCount,
  filteredCount,
  levels,
  className,
}: LogStatsDisplayProps) {
  return (
    <div className={cn("flex items-center gap-4 text-xs", className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Total:</span>
        <span className="font-medium">{logCount}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-blue-400">D:</span>
        <span className="font-medium">{levels.DEBUG}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-green-400">I:</span>
        <span className="font-medium">{levels.INFO}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-yellow-400">W:</span>
        <span className="font-medium">{levels.WARNING}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-red-400">E:</span>
        <span className="font-medium">{levels.ERROR}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-red-600">C:</span>
        <span className="font-medium">{levels.CRITICAL}</span>
      </div>
    </div>
  )
}