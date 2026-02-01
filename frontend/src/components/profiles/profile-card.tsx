"use client"

import { useState } from "react"
import { useUpdateProfile, useDeleteProfile, useLaunchProfile } from "@/hooks/useProfiles"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Star, Play, MoreHorizontal, Edit, Trash2, Box, Clock } from "lucide-react"
import { Loader2 } from "lucide-react"

interface ProfileCardProps {
  profile: {
    id: string
    name: string
    description: string | null
    model_id: string
    config: {
      tensor_parallel: number
      gpu_memory_utilization: number
      port: number
    }
    favorite: boolean
    created_at: string | null
  }
  onEdit: (profile: any) => void
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteProfile()
  const launchMutation = useLaunchProfile()

  const handleToggleFavorite = async () => {
    updateMutation.mutate({
      id: profile.id,
      data: { favorite: !profile.favorite },
    })
  }

  const handleDelete = async () => {
    deleteMutation.mutate(profile.id)
    setShowDeleteDialog(false)
  }

  const handleLaunch = () => {
    launchMutation.mutate(profile.id)
  }

  const isLoading = updateMutation.isPending || deleteMutation.isPending || launchMutation.isPending

  return (
    <>
      <Card className="group relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{profile.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleFavorite}
                disabled={isLoading}
              >
                {profile.favorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <Star className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(profile)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {profile.description && (
            <CardDescription className="mt-2">{profile.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{profile.model_id.split("/").pop()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tensor Parallel</span>
              <Badge variant="secondary">{profile.config.tensor_parallel}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GPU Memory</span>
              <Badge variant="secondary">{Math.round(profile.config.gpu_memory_utilization * 100)}%</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Port</span>
              <Badge variant="secondary">{profile.config.port}</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleLaunch}
            disabled={isLoading || launchMutation.isSuccess}
          >
            {launchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : launchMutation.isSuccess ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Launched
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Launch Model
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{profile.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}