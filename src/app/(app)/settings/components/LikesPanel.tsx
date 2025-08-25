// src/components/setting/LikesPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Heart, ExternalLink, Music, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

type SongItem = {
  id: string
  title: string
  artist: string
  genre?: string
  coverImage?: string
  uploadedBy?: { id: string; username: string }
  analytics?: { playCount?: number; lastPlayed?: string }
  createdAt?: string
}

type Paged<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  pages: number
}

interface LikesPanelProps {
  onMessage?: (message: string, isError?: boolean) => void
}

const formatRelativeTime = (date: string) => {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function LikesPanel({ onMessage }: LikesPanelProps) {
  const [likes, setLikes] = useState<SongItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadLikes()
  }, [page])

  const loadLikes = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page,
        pageSize: 20
      }

      const data: Paged<SongItem> = await api.getMyLikes(params)
      setLikes(data.items || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err: any) {
      const errorMessage = 'Failed to load liked songs'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  return (
    <Card className="glass card-hover text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Liked Songs ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : likes.length === 0 ? (
          <div className="py-12 text-left">
            <Heart className="h-16 w-16 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No liked songs yet</h3>
            <p className="text-muted-foreground">Songs you like will appear here</p>
          </div>
        ) : (
          <>
            {/* Liked Songs List */}
            <div className="space-y-3">
              {likes.map(song => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Cover Image */}
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={song.coverImage || undefined} className="object-cover" />
                    <AvatarFallback className="rounded-lg">
                      <Music className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-lg truncate">{song.title}</h4>
                    <p className="text-muted-foreground truncate">{song.artist}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {song.genre && (
                        <Badge variant="outline" className="text-xs">
                          {song.genre}
                        </Badge>
                      )}

                      {song.uploadedBy && (
                        <Badge variant="secondary" className="text-xs">
                          {song.uploadedBy.username}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {song.analytics?.playCount && <span>{song.analytics.playCount} plays</span>}

                      {song.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(song.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <ExternalLink className="h-4 w-4 ml-2" />
                      View Song
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                  Prev
                </Button>

                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>

                <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
