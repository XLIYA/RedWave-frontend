'use client'

import { Progress } from '@/components/ui/progress'

export function UploadQueueItem({ name, sizeMB, status, progress, error }: { name: string; sizeMB: string; status: string; progress: number; error?: string }) {
  return (
    <div className="p-3 border rounded-md">
      <div className="flex items-center justify-between">
        <div className="min-w-0 mr-4">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{sizeMB} • {status}</p>
        </div>
        <div className="w-40">
          <Progress value={progress} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}


