"use client"

import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ProfileList } from "@/components/profiles/profile-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectionBadge } from "@/components/layout/connection-status"
import { useClusterStatus } from "@/hooks/useCluster"
import { AlertCircle, FolderOpen } from "lucide-react"

export default function ProfilesPage() {
  const { data: clusterStatus } = useClusterStatus()
  const clusterRunning = clusterStatus?.running ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profiles</h1>
          <p className="text-muted-foreground">Manage model configuration profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <Badge variant={clusterRunning ? "default" : "destructive"} className="transition-smooth">
            {clusterRunning ? "Cluster Online" : "Cluster Offline"}
          </Badge>
        </div>
      </div>

      {!clusterRunning && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20 transition-smooth">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              The cluster is not running. Profiles can still be created and edited, but models cannot be launched.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="transition-smooth hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Saved Profiles</CardTitle>
          </div>
          <CardDescription>
            Configuration profiles for quick model deployment. Favorites are shown first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            fallback={
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <AlertCircle className="h-4 w-4" />
                <span>Unable to load profiles. Please refresh to try again.</span>
              </div>
            }
          >
            <ProfileList />
          </ErrorBoundary>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">What are profiles?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Profiles are saved model configurations that you can quickly apply when launching vLLM models.
              They include settings like tensor parallel size, GPU memory utilization, and various vLLM parameters.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Default Profiles</h4>
            <p className="text-sm text-muted-foreground mt-1">
              The dashboard comes with pre-configured profiles for GLM-4.7B-AWQ and MiniMax-M2.1-AWQ models.
              These are marked as favorites by default.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Import/Export</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You can export your profiles to share them with others or back them up.
              Imported profiles will be added to your existing collection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}