"use client"

import { useState, useEffect } from "react"
import { useSettingsStore } from "@/lib/settings-store"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ConnectionBadge } from "@/components/layout/connection-status"
import { toastSuccess } from "@/hooks/use-toast"
import {
  Settings,
  Monitor,
  Moon,
  Sun,
  HardDrive,
  Container,
  Network,
  Link,
  BookOpen,
  Github,
  RefreshCw,
  Save,
} from "lucide-react"

const METRICS_REFRESH_OPTIONS = [
  { value: 1000, label: "1 second" },
  { value: 2000, label: "2 seconds" },
  { value: 5000, label: "5 seconds" },
  { value: 10000, label: "10 seconds" },
  { value: 30000, label: "30 seconds" },
]

const LOG_BUFFER_OPTIONS = [
  { value: 500, label: "500 lines" },
  { value: 1000, label: "1,000 lines" },
  { value: 2000, label: "2,000 lines" },
  { value: 5000, label: "5,000 lines" },
  { value: 10000, label: "10,000 lines" },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const {
    cluster,
    display,
    setSparkDockerPath,
    setContainerName,
    setHeadNodeIP,
    setWorkerNodeIPs,
    setMetricsRefreshRate,
    setLogBufferSize,
    resetToDefaults,
  } = useSettingsStore()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const handleSave = () => {
    toastSuccess("Settings saved successfully")
  }

  const handleReset = () => {
    resetToDefaults()
    toastSuccess("Settings reset to defaults")
  }

  const formatMetricsRate = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(0)}s`
  }

  const formatBufferSize = (lines: number) => {
    if (lines >= 1000) return `${(lines / 1000).toFixed(0)}K`
    return lines.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your dashboard and cluster settings</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
        </div>
      </div>

      <Separator />

      <Card className="transition-smooth hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Cluster Configuration</CardTitle>
          </div>
          <CardDescription>
            Settings for connecting to your Spark vLLM Docker cluster
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="spark-docker-path">Spark Docker Path</Label>
              <Input
                id="spark-docker-path"
                placeholder="/path/to/spark-vllm-docker"
                value={cluster.sparkDockerPath}
                onChange={(e) => setSparkDockerPath(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Path to the spark-vllm-docker repository on your system
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-name">Container Name</Label>
              <Input
                id="container-name"
                placeholder="vllm_node"
                value={cluster.containerName}
                onChange={(e) => setContainerName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Docker container name to manage
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="head-node-ip">Head Node IP</Label>
            <Input
              id="head-node-ip"
              placeholder="192.168.1.100"
              value={cluster.headNodeIP}
              onChange={(e) => setHeadNodeIP(e.target.value)}
              className="font-mono text-sm max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              IP address of the head node in your DGX Spark cluster
            </p>
          </div>

          <div className="space-y-2">
            <Label>Worker Node IPs</Label>
            <div className="flex flex-wrap gap-2">
              {cluster.workerNodeIPs.length > 0 ? (
                cluster.workerNodeIPs.map((ip, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 font-mono text-sm"
                  >
                    <Network className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{ip}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No worker nodes configured</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Read-only display of configured worker node IPs
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="transition-smooth hover:translate-x-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} className="transition-smooth hover:translate-x-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-smooth hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Display Settings</CardTitle>
          </div>
          <CardDescription>
            Customize the appearance and behavior of the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={display.theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1 transition-all hover:translate-y-1"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={display.theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1 transition-all hover:translate-y-1"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={display.theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1 transition-all hover:translate-y-1"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>

            <div className="space-y-2">
              <Label>Metrics Refresh Rate</Label>
              <Select
                value={display.metricsRefreshRate.toString()}
                onValueChange={(value) => setMetricsRefreshRate(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select refresh rate" />
                </SelectTrigger>
                <SelectContent>
                  {METRICS_REFRESH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Current: {formatMetricsRate(display.metricsRefreshRate)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Log Buffer Size</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {formatBufferSize(display.logBufferSize)} lines
              </span>
            </div>
            <Slider
              value={[display.logBufferSize]}
              onValueChange={([value]) => setLogBufferSize(value)}
              min={500}
              max={10000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>500 lines</span>
              <span>10,000 lines</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-smooth hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Container className="h-5 w-5 text-muted-foreground" />
            <CardTitle>About</CardTitle>
          </div>
          <CardDescription>
            Version information and helpful links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Version Info</h4>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dashboard Version</span>
                  <span className="font-mono">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next.js</span>
                  <span className="font-mono">14.2.x</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">React</span>
                  <span className="font-mono">18.x</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Quick Links</h4>
              <div className="grid gap-2">
                <a
                  href="https://github.com/anomalyco/spark-vllm-docker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span className="text-sm">spark-vllm-docker Repository</span>
                </a>
                <a
                  href="https://docs.vllm.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm">vLLM Documentation</span>
                </a>
                <a
                  href="https://github.com/vllm-project/vllm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Link className="h-4 w-4" />
                  <span className="text-sm">vLLM GitHub</span>
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <h4 className="font-medium mb-2">Spark vLLM Dashboard</h4>
            <p className="text-sm text-muted-foreground">
              A web-based management dashboard for controlling vLLM inference on a DGX Spark cluster.
              Built with Next.js 14, FastAPI, and Docker.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}