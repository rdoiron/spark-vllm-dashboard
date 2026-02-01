"use client"

import { useState } from "react"
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
} from "lucide-react"

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

export default function Home() {
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
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
            <Activity className="mr-2 h-4 w-4" />
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
                <Button variant="secondary" className="w-full justify-start transition-all hover:translate-x-1">
                  <Play className="mr-2 h-4 w-4" />
                  Start All
                </Button>
                <Button variant="secondary" className="w-full justify-start transition-all hover:translate-x-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop All
                </Button>
                <Button variant="outline" className="w-full justify-start transition-all hover:translate-x-1">
                  <Server className="mr-2 h-4 w-4" />
                  Restart
                </Button>
                <Button variant="outline" className="w-full justify-start transition-all hover:translate-x-1">
                  <FileText className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((item) => (
          <Card key={item.title} className="cursor-pointer hover:bg-muted/50 transition-all hover:translate-y-1">
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
          <Button variant="outline" className="justify-start transition-all hover:translate-x-1">
            <Settings className="mr-2 h-4 w-4" />
            Cluster Configuration
          </Button>
          <Button variant="outline" className="justify-start transition-all hover:translate-x-1">
            <FolderOpen className="mr-2 h-4 w-4" />
            Model Presets
          </Button>
          <Button variant="outline" className="justify-start transition-all hover:translate-x-1">
            <FileText className="mr-2 h-4 w-4" />
            Log Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}