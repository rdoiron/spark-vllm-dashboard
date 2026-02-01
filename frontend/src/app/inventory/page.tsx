"use client"

import React, { useState, useCallback } from "react"
import { useInventory, useDownloadStatus, inventoryApi, LocalModel, DownloadStatus } from "@/hooks/useInventory"
import { toastSuccess, toastError } from "@/hooks/use-toast"
import { ModelCard, ModelStats } from "@/components/inventory/model-card"
import { DownloadDialog } from "@/components/inventory/download-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ConnectionBadge } from "@/components/layout/connection-status"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Box,
  Download,
  RefreshCw,
  Search,
  Filter,
  HardDrive,
  Database,
  Share2,
  AlertCircle,
} from "lucide-react"

export default function InventoryPage() {
  const { models, loading, error, refresh } = useInventory()
  const { status: downloadStatus, refresh: refreshDownloadStatus } = useDownloadStatus()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterQuantization, setFilterQuantization] = useState<string>("ALL")
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

  const handleDownload = useCallback(async (modelId: string, distribute?: boolean) => {
    try {
      const response = await inventoryApi.downloadModel(modelId, distribute)
      if (response.success) {
        toastSuccess(`Download started for ${modelId}`)
        refreshDownloadStatus()
      } else {
        toastError(response.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Download failed")
    }
  }, [refreshDownloadStatus])

  const handleDelete = useCallback(async (modelId: string) => {
    if (!confirm(`Are you sure you want to delete ${modelId}?`)) {
      return
    }

    try {
      const response = await inventoryApi.deleteModel(modelId)
      if (response.success) {
        toastSuccess(`${modelId} deleted (freed ${response.freed_space_gb} GB)`)
        refresh()
      } else {
        toastError(response.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Delete failed")
    }
  }, [refresh])

  const handleDistribute = useCallback(async (modelId: string) => {
    try {
      const response = await inventoryApi.distributeModel(modelId)
      if (response.success) {
        toastSuccess(`${modelId} distributed to ${response.distributed_to.length} nodes`)
      } else {
        toastError(response.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Distribute failed")
    }
  }, [])

  const handleLaunch = useCallback((modelId: string) => {
    toastSuccess(`Launch ${modelId} from the Models page`)
  }, [])

  const filteredModels = models.filter((model) => {
    const matchesSearch = !searchQuery.trim() ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.quantization?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesQuantization = filterQuantization === "ALL" ||
      model.quantization?.toUpperCase() === filterQuantization ||
      (filterQuantization === "NONE" && !model.quantization)

    return matchesSearch && matchesQuantization
  })

  const allQuantizations = models.map(m => m.quantization).filter(Boolean) as string[]
  const uniqueQuantizations = Array.from(new Set(allQuantizations))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-7 w-7" />
            Model Inventory
          </h1>
          <p className="text-muted-foreground">
            Manage downloaded models and Hugging Face cache
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          {downloadStatus && downloadStatus.status === "downloading" && (
            <Badge variant="secondary" className="flex items-center gap-2 transition-smooth">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Downloading {downloadStatus.progress.toFixed(0)}%
            </Badge>
          )}
          <Button onClick={() => setShowDownloadDialog(true)} className="transition-smooth hover:translate-x-1">
            <Download className="h-4 w-4 mr-2" />
            Download Model
          </Button>
        </div>
      </div>

      <Separator />

      <ModelStats models={models} />

      <Separator />

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
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Quantization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Quantizations</SelectItem>
            <SelectItem value="NONE">Full Precision</SelectItem>
            {uniqueQuantizations.map((q) => (
              <SelectItem key={q} value={q!}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-9 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No models found</p>
            <p className="text-muted-foreground mt-1">
              {models.length === 0
                ? "Download a model to get started"
                : "Try adjusting your search or filters"}
            </p>
            {models.length === 0 && (
              <Button className="mt-4" onClick={() => setShowDownloadDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Download First Model
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              downloadStatus={downloadStatus?.model_id === model.id ? downloadStatus : null}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onDistribute={handleDistribute}
              onLaunch={handleLaunch}
            />
          ))}
        </div>
      )}

      <DownloadDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
        onDownload={handleDownload}
        onCancel={async (modelId) => {
          try {
            await inventoryApi.cancelDownload(modelId)
          } catch (e) {
            console.error("Failed to cancel download:", e)
          }
        }}
      />
    </div>
  )
}