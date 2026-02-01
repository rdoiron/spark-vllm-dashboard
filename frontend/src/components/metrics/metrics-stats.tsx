"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  Users,
  Database,
} from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-500"
      case "down":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <span className={cn("text-xs", getTrendColor())}>
              {trendValue || trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricsStatsProps {
  metrics: {
    throughput_tokens_per_second: number
    avg_prompt_latency_seconds: number
    num_active_requests: number
    cache_hit_rate?: number
  }
  derived?: {
    throughput_rps?: number
    avg_ttft_ms?: number
    requests_per_min?: number
    cache_hit_rate?: number
  }
  className?: string
}

export function MetricsStats({ metrics, derived, className }: MetricsStatsProps) {
  const stats = [
    {
      title: "Throughput",
      value: metrics.throughput_tokens_per_second.toFixed(1),
      unit: "tok/s",
      trend: "up" as const,
      trendValue: "vs last minute",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Avg TTFT",
      value: (derived?.avg_ttft_ms ?? metrics.avg_prompt_latency_seconds * 1000).toFixed(1),
      unit: "ms",
      trend: "down" as const,
      trendValue: "vs last minute",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Requests/min",
      value: (derived?.requests_per_min ?? metrics.num_active_requests * 60).toFixed(0),
      unit: "req/min",
      trend: "neutral" as const,
      trendValue: "stable",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Cache Hit Rate",
      value: (derived?.cache_hit_rate ?? metrics.cache_hit_rate ?? 0).toFixed(1),
      unit: "%",
      trend: "up" as const,
      trendValue: "vs last minute",
      icon: <Database className="h-4 w-4" />,
    },
  ]

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

interface NoModelStatsProps {
  className?: string
}

export function NoModelStats({ className }: NoModelStatsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Throughput
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold text-muted-foreground">--</span>
          <span className="text-sm text-muted-foreground ml-1">tok/s</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg TTFT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold text-muted-foreground">--</span>
          <span className="text-sm text-muted-foreground ml-1">ms</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Requests/min
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold text-muted-foreground">--</span>
          <span className="text-sm text-muted-foreground ml-1">req/min</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cache Hit Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold text-muted-foreground">--</span>
          <span className="text-sm text-muted-foreground ml-1">%</span>
        </CardContent>
      </Card>
    </div>
  )
}