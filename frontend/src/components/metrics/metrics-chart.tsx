"use client"

import React, { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsMessage } from "@/hooks/useMetrics"
import { cn } from "@/lib/utils"

interface MetricsChartProps {
  data: MetricsMessage[]
  metric: "throughput" | "latency" | "queue" | "gpu" | "requests"
  height?: number
  className?: string
}

interface ChartDataPoint {
  timestamp: string
  time: string
  value: number
}

export function MetricsChart({
  data,
  metric,
  height = 300,
  className,
}: MetricsChartProps) {
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data
      .filter((d) => d.metrics !== null)
      .map((d) => {
        const metrics = d.metrics!
        let value = 0

        switch (metric) {
          case "throughput":
            value = metrics.throughput_tokens_per_second
            break
          case "latency":
            value = metrics.avg_total_latency_seconds * 1000
            break
          case "queue":
            value = metrics.queue_size
            break
          case "gpu":
            value = metrics.gpu_memory_utilization * 100
            break
          case "requests":
            value = metrics.num_active_requests
            break
        }

        return {
          timestamp: d.timestamp,
          time: new Date(d.timestamp).toLocaleTimeString(),
          value,
        }
      })
  }, [data, metric])

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100]

    const values = chartData.map((d) => d.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const padding = max * 0.1 || 10

    return [Math.max(0, min - padding), max + padding]
  }, [chartData])

  const formatYAxis = (value: number) => {
    switch (metric) {
      case "latency":
        return `${value.toFixed(0)}ms`
      case "throughput":
        return `${value.toFixed(0)} tok/s`
      case "gpu":
        return `${value.toFixed(0)}%`
      default:
        return value.toFixed(0)
    }
  }

  const getMetricLabel = () => {
    switch (metric) {
      case "throughput":
        return "Throughput (tokens/sec)"
      case "latency":
        return "Latency (ms)"
      case "queue":
        return "Queue Size"
      case "gpu":
        return "GPU Memory (%)"
      case "requests":
        return "Active Requests"
      default:
        return metric
    }
  }

  const getLineColor = () => {
    switch (metric) {
      case "throughput":
        return "#22c55e"
      case "latency":
        return "#3b82f6"
      case "queue":
        return "#f59e0b"
      case "gpu":
        return "#ef4444"
      case "requests":
        return "#8b5cf6"
      default:
        return "#6b7280"
    }
  }

  if (chartData.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>{getMetricLabel()}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{getMetricLabel()}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const dataPoint = payload[0].payload
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-md">
                      <p className="text-sm font-medium">{dataPoint.time}</p>
                      <p className="text-sm text-muted-foreground">
                        {getMetricLabel()}: {formatYAxis(dataPoint.value)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getLineColor()}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: getLineColor() }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface MultiMetricChartProps {
  data: MetricsMessage[]
  metrics: Array<{
    key: "throughput" | "latency" | "queue" | "gpu" | "requests"
    color: string
  }>
  height?: number
  className?: string
}

export function MultiMetricChart({
  data,
  metrics,
  height = 300,
  className,
}: MultiMetricChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.metrics !== null)
      .map((d) => {
        const m = d.metrics!
        return {
          timestamp: d.timestamp,
          time: new Date(d.timestamp).toLocaleTimeString(),
          throughput: m.throughput_tokens_per_second,
          latency: m.avg_total_latency_seconds * 1000,
          queue: m.queue_size,
          gpu: m.gpu_memory_utilization * 100,
          requests: m.num_active_requests,
        }
      })
  }, [data])

  if (chartData.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>Multi-Metric Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Multi-Metric Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const dataPoint = payload[0].payload
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-md">
                      <p className="text-sm font-medium">{dataPoint.time}</p>
                      {payload.map((entry: { dataKey: string; color: string; value: number }) => (
                        <p
                          key={entry.dataKey}
                          className="text-sm"
                          style={{ color: entry.color }}
                        >
                          {entry.dataKey}: {entry.value.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            {metrics.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}