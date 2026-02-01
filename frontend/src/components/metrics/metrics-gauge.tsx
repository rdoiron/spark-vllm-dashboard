"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricsGaugeProps {
  value: number
  maxValue?: number
  label: string
  unit?: string
  className?: string
}

export function MetricsGauge({
  value,
  maxValue = 100,
  label,
  unit = "%",
  className,
}: MetricsGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  const getColor = (pct: number) => {
    if (pct >= 90) return "text-red-500"
    if (pct >= 70) return "text-yellow-500"
    return "text-green-500"
  }

  const getBackgroundColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500/20"
    if (pct >= 70) return "bg-yellow-500/20"
    return "bg-green-500/20"
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn("transition-all duration-500 ease-out", getColor(percentage))}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getColor(percentage))}>
              {value.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MiniGaugeProps {
  value: number
  maxValue?: number
  size?: "sm" | "md" | "lg"
}

export function MiniGauge({ value, maxValue = 100, size = "md" }: MiniGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  const getColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500"
    if (pct >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const dimensions = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
  }

  const { width, height } = dimensions[size]

  return (
    <div
      className="relative rounded-full overflow-hidden bg-muted"
      style={{ width, height }}
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300",
          getColor(percentage)
        )}
        style={{ height: `${percentage}%` }}
      />
    </div>
  )
}