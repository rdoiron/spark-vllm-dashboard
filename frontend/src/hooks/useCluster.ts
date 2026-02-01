import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

interface ClusterStatus {
  running: boolean
  head_healthy: boolean
  worker_healthy: boolean
  uptime: string | null
  message: string | null
}

interface NodeStatus {
  head: {
    ip: string
    healthy: boolean
    latency_ms: number | null
  }
  worker: {
    ip: string
    healthy: boolean
    latency_ms: number | null
  }
}

async function fetchClusterStatus(): Promise<ClusterStatus> {
  return api.get<ClusterStatus>("/api/cluster/status")
}

async function fetchNodesStatus(): Promise<NodeStatus> {
  return api.get<NodeStatus>("/api/cluster/nodes")
}

async function startCluster(): Promise<ClusterStatus> {
  return api.post<ClusterStatus>("/api/cluster/start")
}

async function stopCluster(): Promise<ClusterStatus> {
  return api.post<ClusterStatus>("/api/cluster/stop")
}

export function useClusterStatus() {
  return useQuery({
    queryKey: ["cluster-status"],
    queryFn: fetchClusterStatus,
    refetchInterval: 5000,
    gcTime: 10000,
  })
}

export function useNodesStatus() {
  return useQuery({
    queryKey: ["nodes-status"],
    queryFn: fetchNodesStatus,
    refetchInterval: 10000,
    gcTime: 20000,
  })
}

export function useClusterAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (action: "start" | "stop") => {
      if (action === "start") {
        return startCluster()
      }
      return stopCluster()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cluster-status"] })
      queryClient.invalidateQueries({ queryKey: ["nodes-status"] })
    },
  })
}

async function fetchUptime(): Promise<string | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://192.168.5.157:8080"}/api/cluster/uptime`
  )
  if (!response.ok) {
    return null
  }
  const data = await response.json()
  return data.uptime
}

export function useClusterUptime() {
  return useQuery({
    queryKey: ["cluster-uptime"],
    queryFn: fetchUptime,
    refetchInterval: 30000,
  })
}