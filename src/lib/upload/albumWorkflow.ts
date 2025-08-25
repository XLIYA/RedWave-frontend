import { xhrUpload } from './xhrUpload'

export type AlbumUploadItem = {
  file: File
  status: 'queued'|'uploading'|'success'|'error'|'cancelled'
  progress: number
  response?: any
  error?: string
}

export async function uploadAlbum({
  coverFile,
  audioFiles,
  onCoverProgress,
  onTrackProgress,
  onItemUpdate,
  signal
}: {
  coverFile: File
  audioFiles: File[]
  onCoverProgress?: (p: number) => void
  onTrackProgress?: (index: number, p: number) => void
  onItemUpdate?: (index: number, patch: Partial<AlbumUploadItem>) => void
  signal?: AbortSignal
}) {
  // 1) upload cover once
  {
    const fd = new FormData()
    fd.append('cover', coverFile)
    const { xhr, promise } = xhrUpload({ url: '/api/upload/cover', formData: fd, withAuth: true, onProgress: (p) => onCoverProgress?.(p) })
    signal?.addEventListener('abort', () => xhr.abort())
    const res = await promise
    if (!res.ok) throw new Error(`Cover upload failed: ${res.status}`)
  }

  // 2) upload tracks sequentially
  for (let i = 0; i < audioFiles.length; i++) {
    onItemUpdate?.(i, { status: 'uploading', progress: 0 })
    const fd = new FormData()
    fd.append('audio', audioFiles[i])
    const { xhr, promise } = xhrUpload({ url: '/api/upload/audio', formData: fd, withAuth: true, onProgress: (p) => { onTrackProgress?.(i, p); onItemUpdate?.(i, { progress: p }) } })
    signal?.addEventListener('abort', () => xhr.abort())
    const res = await promise
    if (res.ok) {
      const json = await res.json().catch(() => ({}))
      onItemUpdate?.(i, { status: 'success', response: json, progress: 100 })
    } else {
      const text = await res.text()
      onItemUpdate?.(i, { status: 'error', error: text || String(res.status) })
    }
  }
}


