"use client"

import { useState } from "react"
import { useProfiles, useImportProfiles, useExportProfiles } from "@/hooks/useProfiles"
import { ProfileCard } from "./profile-card"
import { ProfileFormDialog } from "./profile-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Plus, Upload, Download, FileJson } from "lucide-react"

interface ProfileListProps {
  onProfileLaunch?: (profileId: string) => void
}

export function ProfileList({ onProfileLaunch }: ProfileListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState("")

  const { data: profiles, isLoading, error } = useProfiles()
  const importMutation = useImportProfiles()
  const exportMutation = useExportProfiles()

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync()
    if (result) {
      const blob = new Blob([result], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `profiles-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = () => {
    if (importData.trim()) {
      importMutation.mutate(importData)
      setImportData("")
      setShowImportDialog(false)
    }
  }

  const handleEdit = (profile: any) => {
    setEditingProfile(profile)
    setShowFormDialog(true)
  }

  const filteredProfiles = profiles?.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.model_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.description && profile.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1
    if (!a.favorite && b.favorite) return 1
    return 0
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load profiles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
            <Button onClick={() => {
              setEditingProfile(null)
              setShowFormDialog(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>
        </div>

        {sortedProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? "No profiles match your search"
                  : "No profiles yet. Create your first profile!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      <ProfileFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        profile={editingProfile}
      />

      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" style={{ display: showImportDialog ? "block" : "none" }}>
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-semibold">Import Profiles</h3>
            <p className="text-sm text-muted-foreground">
              Paste JSON data containing profile(s) to import
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <textarea
              className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder='[{"name": "My Profile", "model_id": "...", ...}]'
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importData.trim() || importMutation.isPending}>
              {importMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}