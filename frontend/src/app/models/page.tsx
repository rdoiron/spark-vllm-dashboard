"use client"

import { useClusterStatus } from "@/hooks/useCluster"
import { ModelStatusCard } from "@/components/model/model-status-card"
import { ModelLaunchForm } from "@/components/model/model-launch-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export default function ModelsPage() {
  const { data: clusterStatus } = useClusterStatus()
  const clusterRunning = clusterStatus?.running ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground">Launch and manage vLLM models</p>
        </div>
        <Badge variant={clusterRunning ? "default" : "destructive"}>
          {clusterRunning ? "Cluster Online" : "Cluster Offline"}
        </Badge>
      </div>

      {!clusterRunning && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              The cluster is not running. Please start the cluster before launching models.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ModelStatusCard />
        </div>

        <div className="lg:col-span-2">
          <ModelLaunchForm clusterRunning={clusterRunning} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Model Presets</CardTitle>
          <CardDescription>
            Pre-configured model settings optimized for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">GLM-4.7B-AWQ</h3>
                <Badge variant="secondary">AWQ</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                GLM-4 7B quantized with AWQ for efficient inference
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated GPU Memory: 48GB
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">MiniMax-M2.1-AWQ</h3>
                <Badge variant="secondary">AWQ</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                MiniMax M2.1 model quantized with AWQ
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated GPU Memory: 48GB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}