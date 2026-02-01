import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

interface ModelLaunchConfig {
  model_id: string
  tensor_parallel: number
  gpu_memory_utilization: number
  max_model_len?: number
  enable_auto_tool_choice: boolean
  tool_call_parser?: string
  reasoning_parser?: string
  trust_remote_code: boolean
  load_format?: string
  port: number
}

interface ModelStatus {
  running: boolean
  model_id: string | null
  uptime: string | null
  port: number
  message: string | null
}

interface LaunchResult {
  success: boolean
  message: string
  model_id?: string
  port?: number
}

interface RunningConfig {
  model_id: string
  tensor_parallel: number
  gpu_memory_utilization: number
  max_model_len?: number
  enable_auto_tool_choice: boolean
  tool_call_parser?: string
  reasoning_parser?: string
  trust_remote_code: boolean
  load_format: string
  port: number
}

interface AvailableModel {
  id: string
  name: string
  description: string
  quantization: string
  estimated_memory: string
}

interface ModelListResponse {
  models: AvailableModel[]
}

async function fetchModelStatus(): Promise<ModelStatus> {
  return api.get<ModelStatus>("/api/model/status")
}

async function fetchRunningConfig(): Promise<RunningConfig | null> {
  try {
    return await api.get<RunningConfig>("/api/model/running-config")
  } catch {
    return null
  }
}

async function fetchModelList(): Promise<ModelListResponse> {
  return api.get<ModelListResponse>("/api/model/list")
}

async function launchModel(config: ModelLaunchConfig): Promise<LaunchResult> {
  return api.post<LaunchResult>("/api/model/launch", config)
}

async function stopModel(): Promise<LaunchResult> {
  return api.post<LaunchResult>("/api/model/stop")
}

export function useModelStatus() {
  return useQuery({
    queryKey: ["model-status"],
    queryFn: fetchModelStatus,
    refetchInterval: 5000,
    gcTime: 10000,
  })
}

export function useRunningConfig() {
  return useQuery({
    queryKey: ["running-config"],
    queryFn: fetchRunningConfig,
    refetchInterval: 10000,
    gcTime: 20000,
  })
}

export function useModelList() {
  return useQuery({
    queryKey: ["model-list"],
    queryFn: fetchModelList,
    gcTime: 60000,
  })
}

export function useLaunchModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: launchModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-status"] })
      queryClient.invalidateQueries({ queryKey: ["running-config"] })
    },
  })
}

export function useStopModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-status"] })
      queryClient.invalidateQueries({ queryKey: ["running-config"] })
    },
  })
}