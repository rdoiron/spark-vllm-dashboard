"use client"

import { useModelStatus, useStopModel } from "@/hooks/useModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
import { Box, Clock, Network, Loader2, Play, Square } from "lucide-react"

export function ModelStatusCard() {
  const { data: status, isLoading: statusLoading, error: statusError } = useModelStatus()
  const { mutate: stopModel, isPending: isStopping } = useStopModel()

  const isLoading = statusLoading || isStopping
  const error = statusError ? "Failed to fetch model status" : null

  if (statusLoading && !status) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Model Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Model Status</CardTitle>
          </div>
          {status?.running ? (
            <Badge className="bg-green-600">Running</Badge>
          ) : (
            <Badge variant="secondary">Stopped</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {status?.running ? (
          <>
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Box className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">{status.model_id}</p>
                  <p className="text-sm text-muted-foreground">Running Model</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="font-medium">{status.uptime || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Network className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Port</p>
                  <p className="font-medium">{status.port}</p>
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isStopping}>
                  {isStopping ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Stop Model
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop Model</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to stop the running model? This will terminate all ongoing inference requests.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => stopModel()}>Stop</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Box className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-muted-foreground">No model is currently running</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the form to launch a model
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}