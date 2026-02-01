"use client"

import { useState, useCallback } from "react"
import { useClusterStatus } from "@/hooks/useCluster"
import { useLocalModels, useDownloadModel, useDeleteModel, useDistributeModel, useDownloadStatus } from "@/hooks/useInventory"
import { toastSuccess, toastError } from "@/hooks/use-toast"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ModelStatusCard } from "@/components/model/model-status-card"
import { ModelLaunchForm } from "@/components/model/model-launch-form"
import { InventoryList, InventoryStatsBar } from "@/components/inventory/inventory-list"
import { DownloadDialog } from "@/components/inventory/download-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConnectionBadge } from "@/components/layout/connection-status"
import { AlertCircle, Database, Download } from "lucide-react"

export default function ModelsPage() {
  const { data: clusterStatus } = useClusterStatus()
  const clusterRunning = clusterStatus?.running ?? false

  const { models, loading: modelsLoading, refresh: refreshModels } = useLocalModels()
  const { downloading, download } = useDownloadModel()
  const { deleting, remove } = useDeleteModel()
  const { distributing, distribute } = useDistributeModel()
  const { status: downloadStatus } = useDownloadStatus()

  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

  const handleDownload = useCallback(async (modelId: string, distributeFlag?: boolean) => {
    try {
      const result = await download(modelId, distributeFlag)
      if (result.success) {
        toastSuccess(`Download started for ${modelId}`)
        refreshModels()
      } else {
        toastError(result.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Download failed")
    }
  }, [download, refreshModels])

  const handleDelete = useCallback(async (modelId: string) => {
    if (!confirm(`Are you sure you want to delete ${modelId}?`)) {
      return
    }
    try {
      const result = await remove(modelId)
      if (result.success) {
        toastSuccess(`${modelId} deleted (freed ${result.freed_space_gb} GB)`)
        refreshModels()
      } else {
        toastError(result.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Delete failed")
    }
  }, [remove, refreshModels])

  const handleDistribute = useCallback(async (modelId: string) => {
    try {
      const result = await distribute(modelId)
      if (result.success) {
        toastSuccess(`${modelId} distributed to ${result.distributed_to.length} nodes`)
      } else {
        toastError(result.message)
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Distribute failed")
    }
  }, [distribute])

  const handleLaunch = useCallback((modelId: string) => {
    toastSuccess(`Launch ${modelId} from the form on the right`)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground">Launch and manage vLLM models</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <Badge variant={clusterRunning ? "default" : "destructive"} className="transition-smooth">
            {clusterRunning ? "Cluster Online" : "Cluster Offline"}
          </Badge>
        </div>
      </div>

      {!clusterRunning && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20 transition-smooth">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              The cluster is not running. Please start the cluster before launching models.
            </p>
          </CardContent>
        </Card>
      )}

      <InventoryStatsBar
        totalModels={models.length}
        totalSizeGB={models.reduce((sum, m) => sum + m.size_gb, 0)}
        quantizedModels={models.filter(m => m.quantization).length}
        downloadingModels={downloadStatus?.status === "downloading" ? 1 : 0}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Model Inventory
              </CardTitle>
              <CardDescription>
                Downloaded models available for deployment
              </CardDescription>
            </div>
            <Button onClick={() => setShowDownloadDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Download New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryList
            models={models}
            downloadStatus={downloadStatus}
            loading={modelsLoading || downloading || deleting || distributing}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onDistribute={handleDistribute}
            onLaunch={handleLaunch}
            onRefresh={refreshModels}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ErrorBoundary
            fallback={
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Model Status</CardTitle>
                  <CardDescription>Unable to load model status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please refresh to try again</span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ModelStatusCard />
          </ErrorBoundary>
        </div>

        <div className="lg:col-span-2">
          <ErrorBoundary
            fallback={
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Launch Form</CardTitle>
                  <CardDescription>Unable to load launch form</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please refresh to try again</span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ModelLaunchForm clusterRunning={clusterRunning} />
          </ErrorBoundary>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Model Presets</CardTitle>
          <CardDescription>
            Pre-configured model settings optimized for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">GLM-4.7B-AWQ</h3>
                <Badge variant="secondary">AWQ</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                GLM-4 7B quantized with AWQ for efficient inference
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated GPU Memory: 48GB
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">MiniMax-M2.1-AWQ</h3>
                <Badge variant="secondary">AWQ</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                MiniMax M2.1 model quantized with AWQ
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated GPU Memory: 48GB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DownloadDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
        onDownload={handleDownload}
        onCancel={async (modelId) => {
          try {
            await fetch(`/api/models/download/${encodeURIComponent(modelId)}/cancel`, { method: "POST" })
          } catch (e) {
            console.error("Failed to cancel download:", e)
          }
        }}
      />
    </div>
  )
}