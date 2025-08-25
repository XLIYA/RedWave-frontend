// src/components/setting/LyricsEditorDrawer.tsx
'use client'

import { useState, useEffect } from 'react'
import { Edit3, Save, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api'

interface LyricsEditorDrawerProps {
  songId: string
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessage?: (message: string, isError?: boolean) => void
}

export default function LyricsEditorDrawer({
  songId,
  canEdit,
  open,
  onOpenChange,
  onMessage
}: LyricsEditorDrawerProps) {
  const [lyrics, setLyrics] = useState('')
  const [originalLyrics, setOriginalLyrics] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasExistingLyrics, setHasExistingLyrics] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && songId) {
      fetchLyrics()
    }
  }, [open, songId])

  const fetchLyrics = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await api.getLyrics(songId)
      const lyricsText = result.lyricsText || ''

      setLyrics(lyricsText)
      setOriginalLyrics(lyricsText)
      setHasExistingLyrics(!!lyricsText)
    } catch (err: any) {
      setLyrics('')
      setOriginalLyrics('')
      setHasExistingLyrics(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!canEdit) return

    try {
      setSaving(true)
      setError('')

      await api.upsertLyrics(songId, lyrics.trim())

      setOriginalLyrics(lyrics)
      setHasExistingLyrics(true)
      onMessage?.('Lyrics saved.')
      onOpenChange(false)
    } catch (err: any) {
      const errorMessage = 'Failed to save lyrics'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit || !hasExistingLyrics) return

    try {
      setSaving(true)
      setError('')

      await api.deleteLyrics(songId)

      setLyrics('')
      setOriginalLyrics('')
      setHasExistingLyrics(false)
      setShowDeleteDialog(false)
      onMessage?.('Lyrics deleted.')
      onOpenChange(false)
    } catch (err: any) {
      const errorMessage = 'Failed to delete lyrics'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = lyrics.trim() !== originalLyrics.trim()
  const isEmpty = !lyrics.trim()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl text-left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Lyrics
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {error && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {!canEdit && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You do not have permission to edit lyrics for this song.
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <Label htmlFor="lyrics" className="text-base font-medium">
                  Lyrics
                </Label>
                <Textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Type lyrics here..."
                  className="min-h-96 font-mono resize-none"
                  disabled={!canEdit}
                />

                {canEdit && (
                  <p className="text-sm text-muted-foreground">
                    {isEmpty ? 'Lyrics are empty' : hasChanges ? 'You have unsaved changes' : hasExistingLyrics ? 'Saved lyrics' : 'New lyrics'}
                  </p>
                )}
              </div>
            )}

            {canEdit && !loading && (
              <div className="flex justify-between pt-4">
                <div>
                  {hasExistingLyrics && (
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={saving}>
                      <Trash2 className="h-4 w-4 ml-2" />
                      Delete Lyrics
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                    Cancel
                  </Button>

                  <Button onClick={handleSave} disabled={saving || !hasChanges || isEmpty} className="btn-gradient">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 ml-2" />
                        Save Lyrics
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="text-left">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lyrics</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the lyrics for this song? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
