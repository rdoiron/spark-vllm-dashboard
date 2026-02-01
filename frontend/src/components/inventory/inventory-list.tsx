"use client"

import React, { useState, useCallback, useMemo } from "react"
import { LocalModel, DownloadStatus } from "@/hooks/useInventory"
import { ModelCard, ModelListItem } from "./model-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Search,
  Grid3X3,
  List,
  Filter,
  Download,
  RefreshCw,
  HardDrive,
  Box,
  Trash2,
  Share2,
  Play,
} from "lucide-react"

interface InventoryListProps {
  models: LocalModel[]
  downloadStatus: DownloadStatus | null
  loading: boolean
  onDownload: (modelId: string, distribute?: boolean) => Promise<void>
  onDelete: (modelId: string) => void
  onDistribute: (modelId: string) => void
  onLaunch: (modelId: string) => void
  onRefresh: () => void
  className?: string
}

export function InventoryList({
  models,
  downloadStatus,
  loading,
  onDownload,
  onDelete,
  onDistribute,
  onLaunch,
  onRefresh,
  className,
}: InventoryListProps) {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterQuantization, setFilterQuantization] = useState<string>("ALL")
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  const filteredModels = useMemo(() => {
    let result = models

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query) ||
          (model.quantization?.toLowerCase().includes(query))
      )
    }

    if (filterQuantization !== "ALL") {
      result = result.filter((model) => {
        if (filterQuantization === "NONE") {
          return !model.quantization
        }
        return model.quantization?.toUpperCase() === filterQuantization
      })
    }

    return result
  }, [models, searchQuery, filterQuantization])

  const uniqueQuantizations = useMemo(() => {
    const all = models.map((m) => m.quantization).filter(Boolean) as string[]
    return Array.from(new Set(all))
  }, [models])

  const totalSize = useMemo(() => {
    return filteredModels.reduce((sum, m) => sum + m.size_gb, 0)
  }, [filteredModels])

  const formatSize = (gb: number) => {
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    return `${(gb * 1024).toFixed(0)} MB`
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterQuantization} onValueChange={setFilterQuantization}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Quantization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="NONE">Full Precision</SelectItem>
            {uniqueQuantizations.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setView("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredModels.length} of {models.length} models
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <HardDrive className="h-4 w-4" />
            {formatSize(totalSize)} used
          </span>
          {downloadStatus && downloadStatus.status === "downloading" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Download className="h-3 w-3 animate-pulse" />
              {downloadStatus.progress.toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className={cn(
          "grid gap-4",
          view === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No models found</p>
          <p className="text-muted-foreground mt-1">
            {models.length === 0
              ? "Download a model to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              downloadStatus={downloadStatus?.model_id === model.id ? downloadStatus : null}
              onDownload={onDownload}
              onDelete={onDelete}
              onDistribute={onDistribute}
              onLaunch={onLaunch}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredModels.map((model) => (
            <ModelListItem
              key={model.id}
              model={model}
              selected={selectedModel === model.id}
              onSelect={setSelectedModel}
              onLaunch={onLaunch}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface InventoryStatsBarProps {
  totalModels: number
  totalSizeGB: number
  quantizedModels: number
  downloadingModels: number
  className?: string
}

export function InventoryStatsBar({
  totalModels,
  totalSizeGB,
  quantizedModels,
  downloadingModels,
  className,
}: InventoryStatsBarProps) {
  const formatSize = (gb: number) => {
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    return `${(gb * 1024).toFixed(0)} MB`
  }

  if (downloadingModels > 0) {
    return (
      <div className={cn("flex items-center gap-4 p-3 bg-primary/5 rounded-lg border", className)}>
        <div className="flex-1">
          <Progress value={33} className="h-1" />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Downloading model...
        </span>
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <Box className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-lg font-bold">{totalModels}</p>
          <p className="text-xs text-muted-foreground">Models</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <HardDrive className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-lg font-bold">{formatSize(totalSizeGB)}</p>
          <p className="text-xs text-muted-foreground">Storage</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <Share2 className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-lg font-bold">{quantizedModels}</p>
          <p className="text-xs text-muted-foreground">Quantized</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <Play className="h-5 w-5 text-green-400" />
        <div>
          <p className="text-lg font-bold text-green-400">{totalModels - quantizedModels}</p>
          <p className="text-xs text-muted-foreground">Full Precision</p>
        </div>
      </div>
    </div>
  )
}