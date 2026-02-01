"use client"

import { useState } from "react"
import { useClusterStatus, useClusterAction } from "@/hooks/useCluster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Activity, Server, Play, Square, Wifi, WifiOff, Loader2 } from "lucide-react"

function NodeStatusIndicator({ healthy, label, ip }: { healthy: boolean; label: string; ip: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {healthy ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        )}
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{ip}</p>
        </div>
      </div>
      <Badge variant={healthy ? "default" : "destructive"} className={healthy ? "bg-green-600" : undefined}>
        {healthy ? "Online" : "Offline"}
      </Badge>
    </div>
  )
}

export function ClusterStatusCard() {
  const { data: status, isLoading: statusLoading, error: statusError } = useClusterStatus()
  const { mutate: performAction, isPending: isActionPending } = useClusterAction()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<"start" | "stop" | null>(null)

  const handleAction = (action: "start" | "stop") => {
    setPendingAction(action)
    setShowConfirmDialog(true)
  }

  const confirmAction = () => {
    if (pendingAction) {
      performAction(pendingAction)
    }
    setShowConfirmDialog(false)
    setPendingAction(null)
  }

  const isLoading = statusLoading || isActionPending
  const error = statusError ? "Failed to fetch cluster status" : null

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Cluster Status</CardTitle>
        </div>
        {status ? (
          <Badge
            variant="outline"
            className={
              status.running
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
            }
          >
            {status.running ? "Running" : "Stopped"}
          </Badge>
        ) : (
          <Badge variant="secondary">Unknown</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {isLoading && !status && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {status && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{status.uptime || "N/A"}</p>
              </div>
              <div className="flex gap-2">
                {status.running ? (
                  <AlertDialog open={showConfirmDialog && pendingAction === "stop"} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => handleAction("stop")} disabled={isActionPending}>
                        {isActionPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Square className="mr-2 h-4 w-4" />
                        )}
                        Stop Cluster
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Stop Cluster</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to stop the cluster? This will stop all running models and services.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>Stop</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog open={showConfirmDialog && pendingAction === "start"} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                      <Button onClick={() => handleAction("start")} disabled={isActionPending}>
                        {isActionPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start Cluster
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Start Cluster</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to start the cluster? This will initialize all vLLM services.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>Start</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <NodeStatusIndicator
                label="Head Node"
                ip="192.168.5.157"
                healthy={status.head_healthy}
              />
              <NodeStatusIndicator
                label="Worker Node"
                ip="192.168.5.212"
                healthy={status.worker_healthy}
              />
            </div>

            {status.message && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {status.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}