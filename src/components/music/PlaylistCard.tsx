'use client'

import { useState } from 'react'
import { Play, MoreHorizontal, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Playlist } from '@/lib/types'
import { cn, formatNumber } from '@/lib/utils'
import { usePlayer } from '@/hooks/usePlayer'

interface PlaylistCardProps {
  playlist: Playlist
  onPlay?: (playlist: Playlist) => void
  onAddToPlaylist?: (playlist: Playlist) => void
  className?: string
}

export function PlaylistCard({
  playlist,
  onPlay,
  onAddToPlaylist,
  className,
}: PlaylistCardProps) {
  const [imageError, setImageError] = useState(false)
  const { setQueue } = usePlayer()

  const handlePlayClick = () => {
    if (playlist.tracks || playlist.items) {
      const tracks = playlist.tracks || playlist.items || []
      setQueue(tracks, 0)
      onPlay?.(playlist)
    }
  }

  const trackCount = playlist.trackCount || playlist.songsCount || playlist._count?.songs || 0

  return (
    <Card className={cn('group overflow-hidden transition-all hover:shadow-lg cursor-pointer', className)}>
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative aspect-square">
          {playlist.cover && !imageError ? (
            <img
              src={playlist.cover}
              alt={playlist.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <span className="text-purple-400 text-4xl">♪</span>
            </div>
          )}
          
          {/* Overlay with controls */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              onClick={handlePlayClick}
            >
              <Play className="h-6 w-6 fill-current" />
            </Button>
          </div>

          {/* More options */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Playlist Info */}
        <div className="p-4">
          <h3 className="font-semibold truncate mb-1">{playlist.name}</h3>
          {playlist.description && (
            <p className="text-xs text-muted-foreground truncate mb-2">{playlist.description}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatNumber(trackCount)} trackCount</span>
            <span>{playlist.owner.username}</span>
          </div>
          
          {onAddToPlaylist && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => onAddToPlaylist(playlist)}
            >
              <Plus className="h-4 w-4 ml-2" />
              Add to playlist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}