//src/app/(app)/lyrics/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Edit3, ArrowLeft, Music, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Song {
  id: string
  title: string
  artist: string
  genre: string
  coverImage?: string
  uploadedBy: {
    id: string
    username: string
  }
}

interface Lyrics {
  id: string
  songId: string
  lyricsText: string
  createdAt: string
  updatedAt: string
}

export default function LyricsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const songId = params.id as string

  const [song, setSong] = useState<Song | null>(null)
  const [lyrics, setLyrics] = useState<Lyrics | null>(null)
  const [lyricsText, setLyricsText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (songId) {
      fetchData()
    }
  }, [songId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // دریافت اطلاعات آهنگ
      const songData = await api.getSong(songId)
      setSong(songData)

      // ✅ استفاده از متد quiet برای جلوگیری از خطای console در 404
      const lyricsData = await api.getLyricsQuiet(songId)
      
      if (lyricsData) {
        setLyrics(lyricsData)
        setLyricsText(lyricsData.lyricsText || '')
      } else {
        // متن پیدا نشد (404) - این عادی و مورد انتظار است
        setLyrics(null)
        setLyricsText('')
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Error loading information')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      if (!lyricsText.trim()) {
        setError('Lyrics cannot be empty')
        return
      }

      await api.upsertLyrics(songId, lyricsText.trim())

      setMessage("Lyrics saved successfully")
      setIsEditing(false)

      // رفرش اطلاعات
      await fetchData()
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Error saving lyrics')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the lyrics?')) {
      return
    }

    try {
      setDeleting(true)
      setError('')
      setMessage('')

      await api.deleteLyrics(songId)

      setMessage('Lyrics successfully deleted')
      setLyrics(null)
      setLyricsText('')
      setIsEditing(false)
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || 'Error deleting lyrics')
    } finally {
      setDeleting(false)
    }
  }

  const canEdit = user && song && (
    user.id === song.uploadedBy.id || user.role === 'admin'
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error && !song) {
    return (
      <div className="space-y-6">
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            return home
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            return
          </Link>
        </Button>

        {canEdit && (
          <div className="flex items-center gap-2">
            {lyrics && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editing
              </Button>
            )}

            {!lyrics && !isEditing && (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Add lyrics
              </Button>
            )}

            {lyrics && !isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <AlertDescription className="text-green-600">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Song Info */}
      {song && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {song.coverImage ? (
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <Music className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <h1 className="text-2xl font-bold">{song.title}</h1>
                <p className="text-lg text-muted-foreground">{song.artist}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{song.genre}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Uploaded by {song.uploadedBy.username}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lyrics Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Lyrics of the song
            {lyrics && (
              <Badge variant="outline" className="ml-auto">
                Latest update: {new Date(lyrics.updatedAt).toLocaleDateString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <Textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Enter the lyrics here..."
                rows={20}
                className="font-mono text-sm"
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {lyricsText.length} characters
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setLyricsText(lyrics?.lyricsText || '')
                      setError('')
                      setMessage('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !lyricsText.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </>
          ) : lyrics ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 border">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {lyrics.lyricsText}
                </pre>
              </div>

              {!canEdit && (
                <p className="text-sm text-muted-foreground text-center">
                  Only the song owner or admin can edit the lyrics.
                </p>
              )}
            </div>
          ) : (
            // ✅ حالت خالی تمیز - بدون خطای console برای متن‌های گم‌شده
            <div className="text-center py-12 space-y-4">
              <Music className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Lyrics Yet</h3>
                {canEdit ? (
                  <p className="text-muted-foreground">
                    Click the "Add Lyrics" button to add lyrics for this track
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Lyrics for this track are not available at the moment.
                  </p>
                )}
              </div>
              
              {/* اختیاری: CTA مشارکت برای غیر ویراستاران */}
              {!canEdit && (
                <div className="mt-6">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`mailto:support@yourapp.com?subject=Lyrics for ${song?.title || 'Song'}`}
                      className="inline-flex items-center"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Suggest lyrics for this track
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}