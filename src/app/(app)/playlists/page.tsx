//src/app/(app)/playlist/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Play, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/api'
import { Playlist } from '@/lib/types'
import { formatNumber } from '@/lib/utils'

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await api.getPlaylists({ pageSize: 50 })
      setPlaylists(response.items as Playlist[])
    } catch (err) {
      console.error('Failed to fetch playlists:', err)
      setError('Failed to fetch playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name.trim()) return

    setCreating(true)
    try {
      const playlist = await api.createPlaylist({
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim() || undefined
      }) as Playlist

      setPlaylists(prev => [playlist, ...prev])
      setNewPlaylist({ name: '', description: '' })
      setIsCreateDialogOpen(false)
    } catch (err) {
      console.error('Failed to create playlist:', err)
    } finally {
      setCreating(false)
    }
  }

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours} hours ${minutes} minutes`
    }
    return `${minutes} minutes`
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My playlists</h1>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              New playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new playlist</DialogTitle>
              <DialogDescription>
                Enter a name and description for your new playlist.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist name</Label>
                <Input
                  id="playlist-name"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter playlist name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playlist-description">Description (optional)</Label>
                <Textarea
                  id="playlist-description"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter playlist description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                >
                  cancel
                </Button>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylist.name.trim() || creating}
                >
                  {creating ?'Under construction...' : 'Construction'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Playlists Grid */}
      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                  <div className="text-white text-6xl opacity-80">♪</div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90">
                      <Play className="h-6 w-6 fill-current" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 left-2 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate" title={playlist.name}>
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2" title={playlist.description}>
                      {playlist.description}
                    </p>
                  )}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {formatNumber(playlist._count?.songs || playlist.trackCount || 0)} songs
                    </p>
                    {playlist.duration && (
                      <p>{formatDuration(playlist.duration)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-muted-foreground mb-4">
              <div className="text-6xl mb-4">♪</div>
              <p className="text-lg">You don't have a playlist yet.</p>
              <p className="text-sm">Create your first playlist</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              Creating a playlist
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}