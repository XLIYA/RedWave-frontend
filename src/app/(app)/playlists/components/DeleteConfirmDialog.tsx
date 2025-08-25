'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  deleting: boolean
  onConfirm: () => void
}

export default function DeleteConfirmDialog({ open, onOpenChange, deleting, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Delete playlist</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this playlist?
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
