'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACCEPT_AUDIO, ACCEPT_IMAGE, validateAudioFile, validateImageFile } from '@/lib/fileValidators'
import { uploadAlbum, type AlbumUploadItem } from '@/lib/upload/albumWorkflow'
import { UploadQueueItem } from './UploadQueueItem'

export function UploadAlbumWizard() {
  const [cover, setCover] = useState<File | null>(null)
  const [coverErr, setCoverErr] = useState('')
  const [tracks, setTracks] = useState<AlbumUploadItem[]>([])
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const canStart = !!cover && tracks.length > 0 && !running

  const handlePickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const err = validateImageFile(f)
    if (err) { setCoverErr(err); e.target.value = ''; setCover(null); return }
    setCoverErr('')
    setCover(f)
  }

  const handlePickAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const next: AlbumUploadItem[] = []
    for (const f of files) {
      const err = validateAudioFile(f)
      if (err) continue
      next.push({ file: f, status: 'queued', progress: 0 })
    }
    setTracks(next)
  }

  const totalSize = useMemo(() => {
    const sum = tracks.reduce((acc, t) => acc + t.file.size, 0)
    return (sum / (1024 * 1024)).toFixed(2) + ' MB'
  }, [tracks])

  const onItemUpdate = (idx: number, patch: Partial<AlbumUploadItem>) => {
    setTracks((prev) => prev.map((t, i) => i === idx ? { ...t, ...patch } : t))
  }

  const startUpload = async () => {
    if (!cover || tracks.length === 0) return
    setRunning(true)
    const ac = new AbortController()
    abortRef.current = ac
    try {
      await uploadAlbum({
        coverFile: cover,
        audioFiles: tracks.map((t) => t.file),
        onCoverProgress: () => {},
        onTrackProgress: () => {},
        onItemUpdate,
        signal: ac.signal,
      })
    } catch (e) {
      // noop; items updated individually
    } finally {
      setRunning(false)
    }
  }

  const cancelAll = () => {
    abortRef.current?.abort()
    setTracks((prev) => prev.map((t) => t.status === 'success' ? t : { ...t, status: 'cancelled' }))
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cover image *</Label>
        <Input type="file" accept={ACCEPT_IMAGE} onChange={handlePickCover} />
        {cover && <p className="text-xs text-muted-foreground">{cover.name} • {(cover.size/(1024*1024)).toFixed(2)} MB</p>}
        {coverErr && <p className="text-xs text-destructive">{coverErr}</p>}
      </div>

      <div className="space-y-2">
        <Label>Audio files *</Label>
        <Input type="file" accept={ACCEPT_AUDIO} multiple onChange={handlePickAudio} />
        <p className="text-xs text-muted-foreground">Total: {tracks.length} files • {totalSize}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Queue</Label>
          <div className="space-x-2">
            <Button size="sm" onClick={startUpload} disabled={!canStart}>Start Upload</Button>
            <Button size="sm" variant="outline" onClick={cancelAll} disabled={!running}>Cancel All</Button>
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {tracks.map((t, i) => (
            <UploadQueueItem key={t.file.name + i} name={t.file.name} sizeMB={(t.file.size/(1024*1024)).toFixed(2) + ' MB'} status={t.status} progress={t.progress} error={t.error} />
          ))}
        </div>
      </div>
    </div>
  )
}


