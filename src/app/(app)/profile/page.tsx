//src/app/(app)/profile/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Camera,Calendar, Music, Heart, Share, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { TrackCard } from '@/components/music/TrackCard'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface UserStats {
  followers: number
  following: number
  songs: number
  likes: number
  playlists: number
}

interface UserProfile {
  id: string
  username: string
  role: string
  bio?: string
  profileImage?: string
  socialLinks?: any
  isOnline: boolean
  lastSeen: string
  createdAt: string
  _count: UserStats
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [uploads, setUploads] = useState<any[]>([])
  const [likes, setLikes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [likesLoading, setLikesLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getMe()
      setProfile(data)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchUploads = async () => {
    if (uploadsLoading) return
    try {
      setUploadsLoading(true)
      const data = await api.getMyUploads({ pageSize: 6 })
      setUploads(data.items || [])
    } catch (err) {
      console.error('Uploads fetch error:', err)
    } finally {
      setUploadsLoading(false)
    }
  }

  const fetchLikes = async () => {
    if (likesLoading) return
    try {
      setLikesLoading(true)
      const data = await api.getMyLikes({ pageSize: 6 })
      setLikes(data.items || [])
    } catch (err) {
      console.error('Likes fetch error:', err)
    } finally {
      setLikesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'uploads') {
      fetchUploads()
    } else if (activeTab === 'likes') {
      fetchLikes()
    }
  }, [activeTab])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertDescription className="text-destructive">
          {error || 'profile not found'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cover & Profile Section */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-red-500/20 to-red-600/20 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarImage src={profile.profileImage} />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -left-1 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                  {profile.role === 'admin' ? 'admin' : 'user'}
                </Badge>
                {profile.isOnline && (
                  <Badge variant="outline" className="text-green-500 border-green-500/50">
                    Online
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  member of{formatRelativeTime(profile.createdAt)}
                </span>
                {!profile.isOnline && (
                  <span>Last activity{formatRelativeTime(profile.lastSeen)}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 ml-2" />
                sharing
              </Button>
              <Button asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 ml-2" />
                  Edit profile
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatNumber(profile._count.songs)}</div>
            <p className="text-sm text-muted-foreground">songs</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatNumber(profile._count.likes)}</div>
            <p className="text-sm text-muted-foreground">likes</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatNumber(profile._count.playlists)}</div>
            <p className="text-sm text-muted-foreground">playlists</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatNumber(profile._count.followers)}</div>
            <p className="text-sm text-muted-foreground">follower</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{formatNumber(profile._count.following)}</div>
            <p className="text-sm text-muted-foreground">Followed</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">overview </TabsTrigger>
          <TabsTrigger value="uploads">uploads</TabsTrigger>
          <TabsTrigger value="likes">likes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Latest uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploads.length > 0 ? (
                  <div className="space-y-3">
                    {uploads.slice(0, 3).map(track => (
                      <div key={track.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          {track.coverImage ? (
                            <img src={track.coverImage} alt={track.title} className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Music className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">You haven't uploaded any songs yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Likes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Latest likes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {likes.length > 0 ? (
                  <div className="space-y-3">
                    {likes.slice(0, 3).map(track => (
                      <div key={track.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          {track.coverImage ? (
                            <img src={track.coverImage} alt={track.title} className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Music className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">You haven't liked any songs yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uploads">
          {uploadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : uploads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map(track => (
                <TrackCard key={track.id} track={track} showPlayCount />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You haven't uploaded any songs yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="likes">
          {likesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : likes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likes.map(track => (
                <TrackCard key={track.id} track={track} showAddedDate />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You haven't liked any songs yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}