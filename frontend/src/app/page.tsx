"use client"

import { ClusterStatusCard } from "@/components/cluster/cluster-status-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your vLLM cluster</p>
        </div>
        <Button variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClusterStatusCard />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common cluster operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" className="w-full justify-start">
                  <Play className="mr-2 h-4 w-4" />
                  Start All Services
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Square className="mr-2 h-4 w-4" />
                  Stop All Services
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Server className="mr-2 h-4 w-4" />
                  Restart Services
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">MiniMax-M2.1-AWQ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPU Utilization</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <Progress value={0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Waiting for metrics...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- GB</div>
            <p className="text-xs text-muted-foreground">of -- GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cluster Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Last started: --</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {placeholders.map((item) => (
          <Card key={item.title} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
              <Badge variant="secondary">{item.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Quick access to cluster configuration</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Cluster Configuration
          </Button>
          <Button variant="outline" className="justify-start">
            <FolderOpen className="mr-2 h-4 w-4" />
            Model Presets
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Log Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}