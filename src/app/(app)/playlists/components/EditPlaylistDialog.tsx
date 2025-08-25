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
  editing: boolean
  form: { name: string; description: string }
  setForm: (next: { name: string; description: string }) => void
  onSubmit: () => void
}

export default function EditPlaylistDialog({ open, onOpenChange, editing, form, setForm, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Edit playlist</DialogTitle>
          <DialogDescription>Rename and update the description.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="New name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={editing}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!form.name.trim() || editing}>
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
