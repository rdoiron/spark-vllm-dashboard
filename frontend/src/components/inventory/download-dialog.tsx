"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, X, Server, AlertCircle } from "lucide-react"

interface DownloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (modelId: string, distribute: boolean) => Promise<void>
  onCancel: (modelId: string) => Promise<void>
  suggestedModel?: string
}

export function DownloadDialog({
  open,
  onOpenChange,
  onDownload,
  onCancel,
  suggestedModel,
}: DownloadDialogProps) {
  const [modelId, setModelId] = useState(suggestedModel || "")
  const [distribute, setDistribute] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setModelId(suggestedModel || "")
      setDownloadProgress(0)
      setCurrentModelId(null)
      setDownloading(false)
      setError(null)
    }
  }, [open, suggestedModel])

  const handleDownload = async () => {
    if (!modelId.trim()) {
      setError("Model ID is required")
      return
    }

    setLoading(true)
    setError(null)
    setDownloading(true)
    setDownloadProgress(0)
    setCurrentModelId(modelId.trim())

    try {
      await onDownload(modelId.trim(), distribute)
      setDownloadProgress(100)
      setTimeout(() => {
        onOpenChange(false)
        setDownloading(false)
        setModelId("")
        setDistribute(false)
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start download")
      setDownloading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (currentModelId) {
      try {
        await onCancel(currentModelId)
      } catch (e) {
        console.error("Failed to cancel download:", e)
      }
    }
    setDownloading(false)
    setDownloadProgress(0)
    setCurrentModelId(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    if (downloading && downloadProgress < 100) {
      handleCancel()
    } else {
      onOpenChange(false)
      setDownloading(false)
      setModelId("")
      setDistribute(false)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {downloading && downloadProgress < 100 ? "Downloading..." : "Download Model"}
          </DialogTitle>
          <DialogDescription>
            {downloading && downloadProgress < 100
              ? "Downloading model from Hugging Face..."
              : "Download a model from Hugging Face to the local cache."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!downloading || downloadProgress >= 100 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="model-id">Model ID</Label>
                <Input
                  id="model-id"
                  placeholder="THUDM/glm-4-7b-chat-awq"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={loading}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the Hugging Face model ID or a custom model name.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="distribute"
                  checked={distribute}
                  onCheckedChange={(checked) => setDistribute(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="distribute" className="text-sm flex items-center gap-1">
                  <Server className="h-3.5 w-3.5" />
                  Distribute to worker nodes after download
                </Label>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4 animate-pulse text-primary" />
                <span className="font-medium truncate">{currentModelId}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{downloadProgress.toFixed(1)}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {downloadProgress < 50
                    ? "Fetching model files..."
                    : downloadProgress < 80
                    ? "Downloading weights..."
                    : downloadProgress < 95
                    ? "Processing files..."
                    : "Finalizing..."}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {error && !downloading && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          {downloading && downloadProgress < 100 ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Download
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                disabled={loading || !modelId.trim()}
              >
                {loading ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-pulse" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}