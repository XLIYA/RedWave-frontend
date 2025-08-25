// src/components/setting/UploadsPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Music, Search, Edit3, ExternalLink, Play, Clock, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import LyricsEditorDrawer from './LyricsEditorDrawer'

type SongData = {
  id: string
  title: string
  artist: string
  genre?: string
  coverImage?: string
  uploadedBy?: { id: string; username: string }
  analytics?: { playCount?: number; lastPlayed?: string }
  createdAt?: string
}

type PagedResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  pages: number
}

interface ComponentProps {
  profile: any
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

export default function UploadsPanel({ profile, onMessage }: ComponentProps) {
  const [uploads, setUploads] = useState<SongData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('all')
  const [order, setOrder] = useState<'recent' | 'popular' | 'alphabetical'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Lyrics editor
  const [editingSong, setEditingSong] = useState<SongData | null>(null)
  const [lyricsOpen, setLyricsOpen] = useState(false)

  useEffect(() => {
    loadUploads()
  }, [search, genre, order, page])

  const loadUploads = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page,
        pageSize: 20,
        ...(search && { q: search }),
        ...(genre && genre !== 'all' && { genre }),
        order
      }

      const data: PagedResponse<SongData> = await api.getMyUploads(params)
      setUploads(data.items || [])
      setTotalPages(data.pages || 1)
    } catch (err: any) {
      const errorMessage = 'Failed to load uploads'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    } finally {
      setLoading(false)
    }
  }

  const canEditLyrics = (song: SongData) => {
    return song.uploadedBy?.id === profile?.id || profile?.role === 'admin'
  }

  const handleLyricsEdit = (song: SongData) => {
    setEditingSong(song)
    setLyricsOpen(true)
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
          <Music className="h-5 w-5" />
          My Uploads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={genre} onValueChange={(value) => setGenre(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genres</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="hip-hop">Hip-hop</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
              <SelectItem value="folk">Folk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={order} onValueChange={(value) => setOrder(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="aspect-square rounded" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <div className="py-12 text-left">
            <Music className="h-16 w-16 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No songs found</h3>
            <p className="text-muted-foreground">
              {search || (genre && genre !== 'all') ? 'Adjust your filters' : "You haven't uploaded any songs yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map(song => (
                <Card key={song.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Cover Image */}
                    <div className="aspect-square bg-muted rounded flex items-center justify-center relative group">
                      {song.coverImage ? (
                        <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Music className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          <Play className="h-4 w-4 ml-2" />
                          Play
                        </Button>
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{song.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditLyrics(song) && (
                              <DropdownMenuItem onClick={() => handleLyricsEdit(song)}>
                                <Edit3 className="h-4 w-4 ml-2" />
                                Edit lyrics
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>
                              <ExternalLink className="h-4 w-4 ml-2" />
                              View song
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-2 text-xs">
                        {song.genre && (
                          <Badge variant="outline" className="text-xs">
                            {song.genre}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {song.analytics?.playCount || 0} plays
                        </span>
                        {song.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(song.createdAt)}
                          </span>
                        )}
                      </div>

                      {song.analytics?.lastPlayed && (
                        <p className="text-xs text-muted-foreground">Last played: {formatRelativeTime(song.analytics.lastPlayed)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
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

      {/* Lyrics Editor */}
      {editingSong && (
        <LyricsEditorDrawer
          songId={editingSong.id}
          canEdit={canEditLyrics(editingSong)}
          open={lyricsOpen}
          onOpenChange={setLyricsOpen}
          onMessage={onMessage}
        />
      )}
    </Card>
  )
}
