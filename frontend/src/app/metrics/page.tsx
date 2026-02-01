"use client"

import React from "react"
import { useMetricsStream } from "@/hooks/useMetrics"
import { MetricsGauge } from "@/components/metrics/metrics-gauge"
import { MetricsChart } from "@/components/metrics/metrics-chart"
import { MetricsStats, NoModelStats } from "@/components/metrics/metrics-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Activity, Server, AlertCircle } from "lucide-react"

export default function MetricsPage() {
  const { current, history, isConnected, connectionError } = useMetricsStream({
    maxDataPoints: 300,
  })

  const hasModel = current?.metrics?.model_loaded ?? false
  const hasData = current !== null && current.metrics !== null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metrics</h1>
          <p className="text-muted-foreground">
            Real-time vLLM performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            <Activity
              className={`h-3 w-3 ${isConnected ? "animate-pulse" : ""}`}
            />
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
          {connectionError && (
            <Badge variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              {connectionError}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {!hasModel ? (
        <div className="space-y-6">
          <NoModelStats />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                No Model Running
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">vLLM is not running</p>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                Start a model from the Models page to see real-time metrics.
                The metrics dashboard will display performance data once a model
                is loaded and serving requests.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {current?.metrics?.model_name ?? "Unknown Model"}
              </Badge>
              <Badge variant="secondary">
                Port: {current?.metrics?.port ?? 8000}
              </Badge>
            </div>
            {current?.metrics && (
              <div className="text-sm text-muted-foreground">
                Last updated:{" "}
                {current.timestamp
                  ? new Date(current.timestamp).toLocaleTimeString()
                  : "--"}
              </div>
            )}
          </div>

          <MetricsStats
            metrics={{
              throughput_tokens_per_second:
                current?.metrics?.throughput_tokens_per_second ?? 0,
              avg_prompt_latency_seconds:
                current?.metrics?.avg_prompt_latency_seconds ?? 0,
              num_active_requests:
                current?.metrics?.num_active_requests ?? 0,
              cache_hit_rate: current?.derived?.cache_hit_rate,
            }}
            derived={current?.derived}
          />

          <Separator />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Resource Usage</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricsGauge
                  value={
                    (current?.metrics?.gpu_memory_utilization ?? 0) * 100
                  }
                  label="GPU Memory"
                  unit="%"
                />
                <MetricsGauge
                  value={
                    (current?.metrics?.cpu_utilization ?? 0) * 100
                  }
                  label="CPU Usage"
                  unit="%"
                />
                <MetricsGauge
                  value={(current?.metrics?.queue_size ?? 0) * 10}
                  maxValue={100}
                  label="Queue Depth"
                  unit=""
                />
                <MetricsGauge
                  value={
                    (current?.metrics?.num_active_requests ?? 0) * 2
                  }
                  maxValue={100}
                  label="Active Requests"
                  unit=""
                />
              </div>
            </div>

            <MetricsChart
              data={history}
              metric="throughput"
              height={350}
              className="h-full"
            />
          </div>

          <Separator />

          <div className="grid gap-6 lg:grid-cols-2">
            <MetricsChart
              data={history}
              metric="latency"
              height={300}
            />
            <MetricsChart
              data={history}
              metric="gpu"
              height={300}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <MetricsChart
              data={history}
              metric="queue"
              height={300}
            />
            <MetricsChart
              data={history}
              metric="requests"
              height={300}
            />
          </div>
        </>
      )}
    </div>
  )
}