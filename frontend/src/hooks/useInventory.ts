import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

export interface LocalModel {
  id: string
  name: string
  size_gb: number
  quantization: string | null
  revision: string | null
  security: string | null
  downloaded_at: string | null
  download_status: string | null
  local_path: string | null
}

export interface DownloadStatus {
  model_id: string
  progress: number
  status: "idle" | "downloading" | "completed" | "failed" | "cancelled"
  downloaded_bytes: number
  total_bytes: number | null
  speed_mbps: number | null
  error_message: string | null
  started_at: string | null
  updated_at: string | null
}

export interface ModelListResponse {
  models: LocalModel[]
  total_count: number
  total_size_gb: number
}

interface DownloadRequest {
  model_id: string
  revision?: string
  distribute?: boolean
}

interface DownloadResponse {
  success: boolean
  message: string
  model_id: string
}

interface DeleteResponse {
  success: boolean
  message: string
  freed_space_gb: number | null
}

interface DistributeResponse {
  success: boolean
  message: string
  distributed_to: string[]
}

async function fetchModels(): Promise<ModelListResponse> {
  return api.get<ModelListResponse>("/api/models")
}

async function fetchModel(modelId: string): Promise<LocalModel> {
  return api.get<LocalModel>(`/api/models/${encodeURIComponent(modelId)}`)
}

async function downloadModel(
  modelId: string,
  distribute?: boolean
): Promise<DownloadResponse> {
  const request: DownloadRequest = { model_id: modelId }
  if (distribute !== undefined) {
    request.distribute = distribute
  }
  return api.post<DownloadResponse>("/api/models/download", request)
}

async function deleteModel(modelId: string): Promise<DeleteResponse> {
  return api.delete<DeleteResponse>(`/api/models/${encodeURIComponent(modelId)}`)
}

async function fetchDownloadStatus(): Promise<DownloadStatus> {
  return api.get<DownloadStatus>("/api/models/download/status")
}

async function distributeModel(modelId: string): Promise<DistributeResponse> {
  return api.post<DistributeResponse>(`/api/models/${encodeURIComponent(modelId)}/distribute`)
}

async function cancelDownload(modelId: string): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    `/api/models/download/${encodeURIComponent(modelId)}/cancel`
  )
}

export function useInventory() {
  const [models, setModels] = useState<LocalModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchModels()
      setModels(response.models)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch models")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    models,
    loading,
    error,
    refresh,
  }
}

export function useDownloadStatus() {
  const [status, setStatus] = useState<DownloadStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDownloadStatus()
      setStatus(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch download status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => {
      clearInterval(interval)
      setStatus(null)
    }
  }, [refresh])

  return {
    status,
    loading,
    error,
    refresh,
  }
}

export const inventoryApi = {
  fetchModels,
  fetchModel,
  downloadModel,
  deleteModel,
  fetchDownloadStatus,
  distributeModel,
  cancelDownload,
}