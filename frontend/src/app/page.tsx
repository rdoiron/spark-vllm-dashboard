"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ClusterStatusCard } from "@/components/cluster/cluster-status-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Play,
  Square,
  LineChart,
  FileText,
  Box,
  FolderOpen,
  Settings,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useClusterAction, useClusterUptime } from "@/hooks/useCluster"
import { useCurrentMetrics } from "@/hooks/useMetrics"

const placeholders = [
  {
    title: "Models",
    description: "Active model deployments",
    icon: Box,
    href: "/models",
    badge: "1 Active",
  },
  {
    title: "Metrics",
    description: "Real-time performance monitoring",
    icon: LineChart,
    href: "/metrics",
    badge: "Live",
  },
  {
    title: "Logs",
    description: "System and application logs",
    icon: FileText,
    href: "/logs",
    badge: "View",
  },
  {
    title: "Profiles",
    description: "Configuration presets",
    icon: FolderOpen,
    href: "/profiles",
    badge: "Manage",
  },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function MetricCardSkeleton() {
  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Loading...</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

function ActiveModelsCard() {
  const { data: metrics, isLoading } = useCurrentMetrics()

  if (isLoading) {
    return (
      <Card className="transition-smooth hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Models</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Models</CardTitle>
        <Server className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metrics?.metrics?.model_loaded ? metrics.metrics.model_name || "1" : "0"}
        </div>
        <p className="text-xs text-muted-foreground">
          {metrics?.metrics?.model_loaded ? "Model loaded" : "No model loaded"}
        </p>
      </CardContent>
    </Card>
  )
}

function GPUUtilizationCard() {
  const { data: metrics, isLoading } = useCurrentMetrics()

  if (isLoading) {
    return (
      <Card className="transition-smooth hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GPU Utilization</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-1 w-full" />
          <Skeleton className="h-3 w-24 mt-2" />
        </CardContent>
      </Card>
    )
  }

  const gpuUtil = metrics?.metrics?.gpu_memory_utilization
  const gpuPercent = gpuUtil !== undefined ? Math.round(gpuUtil * 100) : 0

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">GPU Utilization</CardTitle>
        <Cpu className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{gpuPercent}%</div>
        <Progress value={gpuPercent} className="h-1 w-full mt-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {metrics?.metrics?.num_active_requests || 0} active requests
        </p>
      </CardContent>
    </Card>
  )
}

function MemoryUsedCard() {
  const { data: metrics, isLoading } = useCurrentMetrics()

  if (isLoading) {
    return (
      <Card className="transition-smooth hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Used</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    )
  }

  const memoryUsed = metrics?.metrics?.gpu_memory_used_bytes
  const memoryTotal = metrics?.metrics?.gpu_memory_total_bytes
  const usedFormatted = memoryUsed ? formatBytes(memoryUsed) : "N/A"
  const totalFormatted = memoryTotal ? formatBytes(memoryTotal) : "N/A"

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Memory Used</CardTitle>
        <HardDrive className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{usedFormatted}</div>
        <p className="text-xs text-muted-foreground">of {totalFormatted}</p>
      </CardContent>
    </Card>
  )
}

function UptimeCard() {
  const { data: uptime, isLoading } = useClusterUptime()

  if (isLoading) {
    return (
      <Card className="transition-smooth hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cluster Uptime</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cluster Uptime</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{uptime || "N/A"}</div>
        <p className="text-xs text-muted-foreground">
          {uptime ? "Since last start" : "Unavailable"}
        </p>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { mutate: performAction, isPending: isActionPending } = useClusterAction()

  const handleRefresh = () => {
    setLoading(true)
    queryClient.invalidateQueries({ queryKey: ["cluster-status"] })
    queryClient.invalidateQueries({ queryKey: ["nodes-status"] })
    queryClient.invalidateQueries({ queryKey: ["current-metrics"] })
    queryClient.invalidateQueries({ queryKey: ["cluster-uptime"] })
    setTimeout(() => setLoading(false), 1500)
  }

  const handleStartAll = () => {
    performAction("start")
  }

  const handleStopAll = () => {
    performAction("stop")
  }

  const handleRestart = () => {
    performAction("stop")
    setTimeout(() => performAction("start"), 2000)
  }

  const handleViewLogs = () => {
    router.push("/logs")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your vLLM cluster</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          {loading ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh All
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="w-full">
          <ErrorBoundary
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Status</CardTitle>
                  <CardDescription>Unable to load cluster status</CardDescription>
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
            <ClusterStatusCard />
          </ErrorBoundary>
        </div>

        <div className="w-full">
          <Card className="transition-smooth hover:shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common cluster operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="secondary"
                  className="w-full justify-start transition-all hover:translate-x-1"
                  onClick={handleStartAll}
                  disabled={isActionPending}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start All
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start transition-all hover:translate-x-1"
                  onClick={handleStopAll}
                  disabled={isActionPending}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop All
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start transition-all hover:translate-x-1"
                  onClick={handleRestart}
                  disabled={isActionPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start transition-all hover:translate-x-1"
                  onClick={handleViewLogs}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActiveModelsCard />
        <GPUUtilizationCard />
        <MemoryUsedCard />
        <UptimeCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer hover:bg-muted/50 transition-all hover:translate-y-1"
            onClick={() => router.push(item.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2 transition-fast">{item.description}</p>
              <Badge variant="secondary">{item.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="transition-smooth hover:shadow-md">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Quick access to cluster configuration</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="outline"
            className="justify-start transition-all hover:translate-x-1"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Cluster Configuration
          </Button>
          <Button
            variant="outline"
            className="justify-start transition-all hover:translate-x-1"
            onClick={() => router.push("/profiles")}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Model Presets
          </Button>
          <Button
            variant="outline"
            className="justify-start transition-all hover:translate-x-1"
            onClick={() => router.push("/logs")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Log Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}