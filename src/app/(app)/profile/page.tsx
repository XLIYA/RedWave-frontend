'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Music, Heart, List } from 'lucide-react'

import type { UserProfile, SongItem, PlaylistItem, FollowUser } from './components/types'
import ProfileHeader from './components/ProfileHeader'
import StatsPills from './components/StatsPills'
import PeopleDrawer from './components/PeopleDrawer'
import UploadsToolbar from './components/UploadsToolbar'
import UploadCard from './components/UploadCard'
import PlaylistCard from './components/PlaylistCard'

// Helper: English date formatting
const formatDateEn = (dateString?: string) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US')
  } catch {
    return ''
  }
}

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('id') || undefined

  // Determine mode
  const isMyProfile = !targetUserId || targetUserId === currentUser?.id

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'uploads' | 'playlists' | 'likes' | 'about'>('uploads')

  // People drawer
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [peopleType, setPeopleType] = useState<'followers' | 'following'>('followers')
  const [peopleUsers, setPeopleUsers] = useState<FollowUser[]>([])
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [peopleQuery, setPeopleQuery] = useState('')

  // Uploads
  const [uploads, setUploads] = useState<{
    data: SongItem[]
    loading: boolean
    currentPage: number
    totalPages: number
    searchQuery: string
    genre: string
    order: 'recent' | 'popular' | 'alphabetical'
  }>({
    data: [],
    loading: false,
    currentPage: 1,
    totalPages: 1,
    searchQuery: '',
    genre: '',
    order: 'recent',
  })

  // Playlists
  const [playlists, setPlaylists] = useState<{
    data: PlaylistItem[]
    loading: boolean
    currentPage: number
    totalPages: number
  }>({
    data: [],
    loading: false,
    currentPage: 1,
    totalPages: 1,
  })

  // Likes
  const [likes, setLikes] = useState<{
    data: SongItem[]
    loading: boolean
    currentPage: number
    totalPages: number
  }>({
    data: [],
    loading: false,
    currentPage: 1,
    totalPages: 1,
  })

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    const controller = new AbortController()
    try {
      setLoading(true)
      setError(null)
      const profileData = isMyProfile
        ? await api.getMe()
        : await api.getUser(targetUserId!)
      setProfile(profileData)
      // If backend returns isFollowing for "other user" mode, set it here:
      // setIsFollowing(!!profileData.isFollowing)
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [isMyProfile, targetUserId])

  // Fetch uploads
  const fetchUploads = useCallback(
    async (page = 1, reset = true) => {
      const controller = new AbortController()
      try {
        setUploads(prev => ({ ...prev, loading: true }))
        const params = {
          q: uploads.searchQuery || undefined,
          genre: uploads.genre || undefined,
          order: uploads.order,
          page,
          pageSize: 12,
        }
        const data = isMyProfile
          ? await api.getMyUploads(params)
          : await api.getUserUploads(targetUserId!, params)
        setUploads(prev => ({
          ...prev,
          data: reset ? data.items : [...prev.data, ...data.items],
          currentPage: page,
          totalPages: data.pages || 1,
          loading: false,
        }))
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Failed to load uploads:', err)
        setUploads(prev => ({ ...prev, loading: false }))
      }
      return () => controller.abort()
    },
    [isMyProfile, targetUserId, uploads.searchQuery, uploads.genre, uploads.order]
  )

  // Fetch playlists
  const fetchPlaylists = useCallback(
    async (page = 1) => {
      if (isMyProfile) return
      const controller = new AbortController()
      try {
        setPlaylists(prev => ({ ...prev, loading: true }))
        const data = await api.getUserPlaylists(targetUserId!, { page, pageSize: 12 })
        setPlaylists({ data: data.items, loading: false, currentPage: page, totalPages: data.pages || 1 })
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Failed to load playlists:', err)
        setPlaylists(prev => ({ ...prev, loading: false }))
      }
      return () => controller.abort()
    },
    [isMyProfile, targetUserId]
  )

  // Fetch likes
  const fetchLikes = useCallback(
    async (page = 1) => {
      if (!isMyProfile) return
      const controller = new AbortController()
      try {
        setLikes(prev => ({ ...prev, loading: true }))
        const data = await api.getMyLikes({ page, pageSize: 12 })
        setLikes({ data: data.items, loading: false, currentPage: page, totalPages: data.pages || 1 })
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Failed to load likes:', err)
        setLikes(prev => ({ ...prev, loading: false }))
      }
      return () => controller.abort()
    },
    [isMyProfile]
  )

  // Fetch followers/following
  const fetchPeople = useCallback(
    async (type: 'followers' | 'following') => {
      const controller = new AbortController()
      try {
        setPeopleLoading(true)
        const data =
          type === 'followers'
            ? await api.getFollowers(isMyProfile ? undefined : targetUserId!)
            : await api.getFollowing(isMyProfile ? undefined : targetUserId!)
        setPeopleUsers(Array.isArray(data) ? data : [])
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(`Failed to load ${type}:`, err)
      } finally {
        setPeopleLoading(false)
      }
      return () => controller.abort()
    },
    [isMyProfile, targetUserId]
  )

  // Follow/Unfollow
  const handleFollowToggle = async () => {
    if (isMyProfile || !targetUserId) return
    const prevFollowing = isFollowing
    const prevCount = profile?._count?.followers || 0

    setIsFollowing(!isFollowing) // optimistic
    if (profile) {
      setProfile(p => ({
        ...p!,
        _count: { ...p!._count!, followers: isFollowing ? prevCount - 1 : prevCount + 1 },
      }))
    }
    try {
      if (isFollowing) await api.unfollowUser(targetUserId)
      else await api.followUser(targetUserId)
    } catch (err) {
      setIsFollowing(prevFollowing) // rollback
      if (profile) {
        setProfile(p => ({ ...p!, _count: { ...p!._count!, followers: prevCount } }))
      }
      setError('Failed to perform the action')
    }
  }

  // Initial
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Load tab data
  useEffect(() => {
    if (activeTab === 'uploads') fetchUploads(1, true)
    if (activeTab === 'playlists') fetchPlaylists(1)
    if (activeTab === 'likes') fetchLikes(1)
  }, [activeTab, fetchUploads, fetchPlaylists, fetchLikes])

  // React to uploads filters
  useEffect(() => {
    if (activeTab !== 'uploads') return
    const id = setTimeout(() => {
      fetchUploads(1, true)
    }, 300)
    return () => clearTimeout(id)
  }, [uploads.searchQuery, uploads.genre, uploads.order, activeTab, fetchUploads])

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6 text-left">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container max-w-6xl mx-auto p-6 text-left">
        <Alert className="glass">
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchProfile()} className="btn-gradient mt-4">
          Retry
        </Button>
      </div>
    )
  }

  // Filter people in drawer (client-side search)
  const filteredPeople = peopleUsers.filter(u =>
    u.username.toLowerCase().includes(peopleQuery.toLowerCase())
  )

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6 animate-fade-in text-left" dir="ltr">
      {/* Header */}
      <div className="glass p-6 rounded-xl card-hover">
        <ProfileHeader
          profile={profile}
          isMyProfile={isMyProfile}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          formatDateEn={formatDateEn}
        />
        <StatsPills
          counts={profile._count}
          onOpenFollowers={() => {
            setPeopleType('followers')
            setPeopleOpen(true)
            setPeopleQuery('')
            fetchPeople('followers')
          }}
          onOpenFollowing={() => {
            setPeopleType('following')
            setPeopleOpen(true)
            setPeopleQuery('')
            fetchPeople('following')
          }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="glass p-6 rounded-xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          {!isMyProfile && <TabsTrigger value="playlists">Playlists</TabsTrigger>}
          {isMyProfile && <TabsTrigger value="likes">Likes</TabsTrigger>}
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* Uploads */}
        <TabsContent value="uploads" className="space-y-4">
          <UploadsToolbar
            searchQuery={uploads.searchQuery}
            genre={uploads.genre}
            order={uploads.order}
            onSearchChange={(q) => setUploads(prev => ({ ...prev, searchQuery: q }))}
            onGenreChange={(g) => setUploads(prev => ({ ...prev, genre: g }))}
            onOrderChange={(o) => setUploads(prev => ({ ...prev, order: o }))}
          />

          {uploads.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass p-4 rounded-lg">
                  <Skeleton className="h-32 w-full mb-3 rounded" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : uploads.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploads.data.map(song => (
                  <UploadCard key={song.id} song={song} />
                ))}
              </div>

              {uploads.totalPages > 1 && (
                <div className="flex items-center justify-start gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchUploads(uploads.currentPage - 1, true)}
                    disabled={uploads.currentPage === 1 || uploads.loading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Prev
                  </Button>
                  <span className="text-sm">
                    Page {uploads.currentPage.toLocaleString('en-US')} of {uploads.totalPages.toLocaleString('en-US')}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchUploads(uploads.currentPage + 1, true)}
                    disabled={uploads.currentPage === uploads.totalPages || uploads.loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Music className="w-6 h-6" />
                <p>No uploads yet</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Playlists */}
        <TabsContent value="playlists">
          {playlists.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass p-4 rounded-lg">
                  <Skeleton className="h-32 w-full mb-3 rounded" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : playlists.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.data.map(pl => (
                <PlaylistCard key={pl.id} playlist={pl} formatDateEn={formatDateEn} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-muted-foreground">
              <div className="flex items-center gap-3">
                <List className="w-6 h-6" />
                <p>No playlists yet</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Likes */}
        <TabsContent value="likes">
          {likes.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass p-4 rounded-lg">
                  <Skeleton className="h-32 w-full mb-3 rounded" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : likes.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {likes.data.map(song => (
                <UploadCard key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6" />
                <p>You haven’t liked any songs yet</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="space-y-6">
          <div className="glass p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">About {profile.username}</h3>
            {profile.bio ? (
              <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-muted-foreground italic">No bio available</p>
            )}
          </div>

          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="glass p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Social links</h3>
              <div className="flex flex-wrap gap-3">
                {profile.socialLinks?.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Instagram
                  </a>
                )}
                {profile.socialLinks?.telegram && (
                  <a
                    href={profile.socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Telegram
                  </a>
                )}
                {profile.socialLinks?.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Twitter
                  </a>
                )}
                {profile.socialLinks?.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="glass p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Account details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="px-3 py-1 bg-muted rounded-full">{profile.role === 'admin' ? 'Admin' : 'User'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since:</span>
                <span>{formatDateEn(profile.createdAt)}</span>
              </div>
              {profile.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last seen:</span>
                  <span>{formatDateEn(profile.lastSeen)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span>{profile.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <PeopleDrawer
        open={peopleOpen}
        type={peopleType}
        users={filteredPeople}
        loading={peopleLoading}
        searchQuery={peopleQuery}
        onOpenChange={setPeopleOpen}
        onSearchChange={setPeopleQuery}
      />
    </div>
  )
}
