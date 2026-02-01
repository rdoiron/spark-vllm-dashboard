"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"

interface DownloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (modelId: string, distribute: boolean) => Promise<void>
  suggestedModel?: string
}

export function DownloadDialog({
  open,
  onOpenChange,
  onDownload,
  suggestedModel,
}: DownloadDialogProps) {
  const [modelId, setModelId] = useState(suggestedModel || "")
  const [distribute, setDistribute] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!modelId.trim()) {
      setError("Model ID is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onDownload(modelId.trim(), distribute)
      onOpenChange(false)
      setModelId("")
      setDistribute(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start download")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Model
          </DialogTitle>
          <DialogDescription>
            Download a model from Hugging Face to the local cache.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-id">Model ID</Label>
            <Input
              id="model-id"
              placeholder="THUDM/glm-4-7b-chat-awq"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={loading}
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
            <Label htmlFor="distribute" className="text-sm">
              Distribute to worker nodes after download
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={loading || !modelId.trim()}
          >
            {loading ? "Starting..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}