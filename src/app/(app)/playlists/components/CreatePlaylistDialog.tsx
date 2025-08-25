'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  creating: boolean
  form: { name: string; description: string }
  setForm: (next: { name: string; description: string }) => void
  onSubmit: () => void
}

export default function CreatePlaylistDialog({ open, onOpenChange, creating, form, setForm, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Create a new playlist</DialogTitle>
          <DialogDescription>Give it a clear name and (optionally) a short description.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist name</Label>
            <Input
              id="playlist-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Focus • Deep Work"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description (optional)</Label>
            <Textarea
              id="playlist-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What’s inside this playlist?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!form.name.trim() || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create playlist'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
