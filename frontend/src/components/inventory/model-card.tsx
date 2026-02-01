"use client"

import React from "react"
import { LocalModel, DownloadStatus } from "@/hooks/useInventory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Box,
  HardDrive,
  Download,
  Trash2,
  Share2,
  Play,
  Clock,
  FileArchive,
  ShieldCheck,
} from "lucide-react"

interface ModelCardProps {
  model: LocalModel
  downloadStatus: DownloadStatus | null
  onDownload: (modelId: string, distribute?: boolean) => Promise<void>
  onDelete: (modelId: string) => void
  onDistribute: (modelId: string) => void
  onLaunch: (modelId: string) => void
  className?: string
}

export function ModelCard({
  model,
  downloadStatus,
  onDownload,
  onDelete,
  onDistribute,
  onLaunch,
  className,
}: ModelCardProps) {
  const isDownloading = downloadStatus?.model_id === model.id &&
    downloadStatus.status === "downloading"

  const formatSize = (gb: number) => {
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`
    }
    return `${(gb * 1024).toFixed(0)} MB`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  const getQuantizationColor = (q: string | null) => {
    switch (q?.toUpperCase()) {
      case "AWQ":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "GPTQ":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "GGUF":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "INT4":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "INT8":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="h-5 w-5 text-muted-foreground shrink-0" />
            <CardTitle className="text-lg font-semibold truncate">{model.name}</CardTitle>
          </div>
          {model.quantization && (
            <Badge
              variant="outline"
              className={cn("shrink-0", getQuantizationColor(model.quantization))}
            >
              {model.quantization}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
          {model.id}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{formatSize(model.size_gb)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{formatDate(model.downloaded_at)}</span>
          </div>
          {model.security && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400 shrink-0" />
              <span className="truncate">{model.security}</span>
            </div>
          )}
          {model.revision && (
            <div className="flex items-center gap-2 col-span-2">
              <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs truncate">{model.revision.slice(0, 7)}</span>
            </div>
          )}
        </div>

        {isDownloading && downloadStatus && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Download className="h-3.5 w-3.5 animate-pulse" />
                Downloading...
              </span>
              <span className="font-medium">{downloadStatus.progress.toFixed(1)}%</span>
            </div>
            <Progress value={downloadStatus.progress} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {downloadStatus.speed_mbps
                  ? `${downloadStatus.speed_mbps.toFixed(1)} MB/s`
                  : "Calculating..."}
              </span>
              <span>
                {downloadStatus.downloaded_bytes
                  ? `${(downloadStatus.downloaded_bytes / (1024 * 1024)).toFixed(1)} MB`
                  : "0 MB"}
              </span>
            </div>
          </div>
        )}

        {model.download_status === "completed" && !isDownloading && (
          <div className="flex items-center gap-2 text-sm text-green-400 p-2 bg-green-400/5 rounded-lg border border-green-400/20">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Ready to launch</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {model.download_status === "completed" && !isDownloading ? (
            <Button
              size="sm"
              onClick={() => onLaunch(model.id)}
              className="flex-1 min-w-24"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Launch
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(model.id)}
              disabled={isDownloading}
              className="flex-1 min-w-24"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDistribute(model.id)}
            disabled={isDownloading || model.download_status !== "completed"}
            title="Distribute to worker nodes"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(model.id)}
            disabled={isDownloading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete model"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ModelStatsProps {
  models: LocalModel[]
  className?: string
}

export function ModelStats({ models, className }: ModelStatsProps) {
  const totalSize = models.reduce((sum, m) => sum + m.size_gb, 0)
  const quantizedCount = models.filter(m => m.quantization).length
  const fullPrecisionCount = models.filter(m => !m.quantization).length

  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <div className="text-2xl font-bold">{models.length}</div>
        <div className="text-xs text-muted-foreground">Total Models</div>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <div className="text-2xl font-bold">{totalSize.toFixed(1)} GB</div>
        <div className="text-xs text-muted-foreground">Storage Used</div>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <div className="text-2xl font-bold">{quantizedCount}</div>
        <div className="text-xs text-muted-foreground">Quantized</div>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg text-center">
        <div className="text-2xl font-bold">{fullPrecisionCount}</div>
        <div className="text-xs text-muted-foreground">Full Precision</div>
      </div>
    </div>
  )
}

interface ModelListItemProps {
  model: LocalModel
  selected?: boolean
  onSelect: (modelId: string) => void
  onLaunch: (modelId: string) => void
  onDownload: (modelId: string) => void
  onDelete: (modelId: string) => void
}

export function ModelListItem({
  model,
  selected,
  onSelect,
  onLaunch,
  onDownload,
  onDelete,
}: ModelListItemProps) {
  const getQuantizationColor = (q: string | null) => {
    switch (q?.toUpperCase()) {
      case "AWQ": return "text-purple-400"
      case "GPTQ": return "text-blue-400"
      case "GGUF": return "text-orange-400"
      case "INT4": return "text-green-400"
      case "INT8": return "text-cyan-400"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
        selected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={() => onSelect(model.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Box className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate">{model.name}</p>
          <p className={cn("text-xs truncate", getQuantizationColor(model.quantization))}>
            {model.quantization || "Full Precision"}
          </p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground shrink-0">
        {model.size_gb >= 1 ? `${model.size_gb.toFixed(1)} GB` : `${(model.size_gb * 1024).toFixed(0)} MB`}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onLaunch(model.id); }}>
          <Play className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDownload(model.id); }}>
          <Download className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(model.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}