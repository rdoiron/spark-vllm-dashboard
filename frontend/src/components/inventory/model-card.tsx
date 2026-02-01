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
  className?: string
}

export function ModelCard({
  model,
  downloadStatus,
  onDownload,
  onDelete,
  onDistribute,
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
        return "bg-purple-500/20 text-purple-400"
      case "GPTQ":
        return "bg-blue-500/20 text-blue-400"
      case "GGUF":
        return "bg-orange-500/20 text-orange-400"
      case "INT4":
        return "bg-green-500/20 text-green-400"
      case "INT8":
        return "bg-cyan-500/20 text-cyan-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">{model.name}</CardTitle>
          </div>
          {model.quantization && (
            <Badge className={cn("", getQuantizationColor(model.quantization))}>
              {model.quantization}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">{model.id}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{formatSize(model.size_gb)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(model.downloaded_at)}</span>
          </div>
          {model.security && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span>{model.security}</span>
            </div>
          )}
          {model.revision && (
            <div className="flex items-center gap-2 col-span-2">
              <FileArchive className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{model.revision.slice(0, 7)}</span>
            </div>
          )}
        </div>

        {isDownloading && downloadStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Downloading...</span>
              <span className="font-medium">{downloadStatus.progress.toFixed(1)}%</span>
            </div>
            <Progress value={downloadStatus.progress} className="h-2" />
            {downloadStatus.speed_mbps && (
              <p className="text-xs text-muted-foreground">
                {downloadStatus.speed_mbps.toFixed(1)} MB/s
              </p>
            )}
          </div>
        )}

        {model.download_status === "completed" && !isDownloading && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Available</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(model.id)}
            disabled={isDownloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Re-download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDistribute(model.id)}
            disabled={isDownloading}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(model.id)}
            disabled={isDownloading}
            className="text-destructive hover:text-destructive"
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
  const quantizations = models.reduce((acc, m) => {
    if (m.quantization) {
      acc[m.quantization] = (acc[m.quantization] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn("grid grid-cols-4 gap-4", className)}>
      <div className="p-4 bg-muted/20 rounded-lg text-center">
        <div className="text-2xl font-bold">{models.length}</div>
        <div className="text-xs text-muted-foreground">Total Models</div>
      </div>
      <div className="p-4 bg-muted/20 rounded-lg text-center">
        <div className="text-2xl font-bold">{totalSize.toFixed(1)} GB</div>
        <div className="text-xs text-muted-foreground">Storage Used</div>
      </div>
      <div className="p-4 bg-muted/20 rounded-lg text-center">
        <div className="text-2xl font-bold">
          {models.filter(m => m.quantization).length}
        </div>
        <div className="text-xs text-muted-foreground">Quantized</div>
      </div>
      <div className="p-4 bg-muted/20 rounded-lg text-center">
        <div className="text-2xl font-bold">
          {models.filter(m => !m.quantization).length}
        </div>
        <div className="text-xs text-muted-foreground">Full Precision</div>
      </div>
    </div>
  )
}