import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

interface ProfileConfig {
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

interface Profile {
  id: string
  name: string
  description: string | null
  model_id: string
  config: ProfileConfig
  favorite: boolean
  created_at: string | null
  updated_at: string | null
}

interface CreateProfileData {
  name: string
  description?: string
  model_id: string
  config: ProfileConfig
  favorite?: boolean
}

interface UpdateProfileData {
  name?: string
  description?: string
  model_id?: string
  config?: ProfileConfig
  favorite?: boolean
}

interface LaunchResult {
  success: boolean
  message: string
  profile_id: string
  model_id: string
}

async function fetchProfiles(): Promise<Profile[]> {
  return api.get<Profile[]>("/api/profiles/")
}

async function fetchProfile(id: string): Promise<Profile> {
  return api.get<Profile>(`/api/profiles/${id}`)
}

async function createProfile(data: CreateProfileData): Promise<Profile> {
  return api.post<Profile>("/api/profiles/", data)
}

async function updateProfile(id: string, data: UpdateProfileData): Promise<Profile> {
  return api.put<Profile>(`/api/profiles/${id}`, data)
}

async function deleteProfile(id: string): Promise<void> {
  return api.delete<void>(`/api/profiles/${id}`)
}

async function launchFromProfile(id: string): Promise<LaunchResult> {
  return api.post<LaunchResult>(`/api/profiles/${id}/launch`)
}

async function importProfiles(jsonData: string): Promise<{ imported: number; message: string }> {
  return api.post<{ imported: number; message: string }>("/api/profiles/import", { json_data: jsonData })
}

async function exportProfiles(): Promise<string> {
  const response = await api.get<{ profiles_json: string; count: number }>("/api/profiles/export")
  return response.profiles_json
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    gcTime: 60000,
  })
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfile(id),
    enabled: !!id,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileData }) =>
      updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      queryClient.invalidateQueries({ queryKey: ["profile", id] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
    },
  })
}

export function useLaunchProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: launchFromProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-status"] })
      queryClient.invalidateQueries({ queryKey: ["running-config"] })
    },
  })
}

export function useImportProfiles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importProfiles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
    },
  })
}

export function useExportProfiles() {
  return useMutation({
    mutationFn: exportProfiles,
  })
}

export function useModelList() {
  return useQuery({
    queryKey: ["model-list"],
    queryFn: async () => {
      const response = await api.get<{ models: Array<{ id: string; name: string; description: string; quantization: string; estimated_memory: string }> }>("/api/model/list")
      return response
    },
    gcTime: 60000,
  })
}