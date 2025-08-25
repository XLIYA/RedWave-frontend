// src/components/setting/ConnectionsPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Search, UserMinus, UserPlus, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

type ConnectionUser = {
  id: string
  username: string
  profileImage?: string | null
}

interface ConnectionsPanelProps {
  onMessage?: (message: string, isError?: boolean) => void
}

export default function ConnectionsPanel({ onMessage }: ConnectionsPanelProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following')
  const [following, setFollowing] = useState<ConnectionUser[]>([])
  const [followers, setFollowers] = useState<ConnectionUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      setError('')

      const [followingData, followersData] = await Promise.all([
        api.getFollowing('me'),
        api.getFollowers('me')
      ])

      setFollowing(followingData || [])
      setFollowers(followersData || [])
    } catch (err: any) {
      const errorMessage = 'Failed to load connections'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (userId: string, username: string) => {
    try {
      setActionLoading(userId)
      const originalFollowing = [...following]
      setFollowing(prev => prev.filter(user => user.id !== userId))
      await api.unfollowUser(userId)
      onMessage?.(`${username} removed from following`)
    } catch (err: any) {
      setFollowing(following)
      const errorMessage = 'Failed to unfollow'
      onMessage?.(errorMessage, true)
    } finally {
      setActionLoading(null)
    }
  }

  const handleFollow = async (userId: string, username: string) => {
    try {
      setActionLoading(userId)
      const userToFollow = followers.find(u => u.id === userId)
      if (userToFollow) {
        setFollowing(prev => [...prev, userToFollow])
      }
      await api.followUser(userId)
      onMessage?.(`You followed ${username}`)
    } catch (err: any) {
      loadConnections()
      const errorMessage = 'Failed to follow'
      onMessage?.(errorMessage, true)
    } finally {
      setActionLoading(null)
    }
  }

  const filterUsers = (users: ConnectionUser[]) => {
    if (!search) return users
    return users.filter(user => user.username.toLowerCase().includes(search.toLowerCase()))
  }

  const filteredFollowing = filterUsers(following)
  const filteredFollowers = filterUsers(followers)

  const isUserFollowed = (userId: string) => {
    return following.some(user => user.id === userId)
  }

  const renderUserList = (users: ConnectionUser[], type: 'following' | 'followers') => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className="py-12 text-left">
          <Users className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'No users found' : type === 'following' ? "You haven't followed anyone yet" : "You don't have any followers yet"}
          </h3>
          <p className="text-muted-foreground">
            {search ? 'Adjust your search criteria' : type === 'following' ? 'Discover and follow interesting users' : 'Create great content to get followers'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profileImage || undefined} />
                <AvatarFallback>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.username}</span>
            </div>

            <div className="flex gap-2">
              {type === 'following' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfollow(user.id, user.username)}
                  disabled={actionLoading === user.id}
                  className="text-destructive hover:text-destructive"
                >
                  {actionLoading === user.id ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4 ml-2" />
                  )}
                  Unfollow
                </Button>
              ) : (
                !isUserFollowed(user.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollow(user.id, user.username)}
                    disabled={actionLoading === user.id}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 ml-2" />
                    )}
                    Follow
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="glass card-hover text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following">
              Following ({filteredFollowing.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              Followers ({filteredFollowers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4">
            {renderUserList(filteredFollowing, 'following')}
          </TabsContent>

          <TabsContent value="followers" className="mt-4">
            {renderUserList(filteredFollowers, 'followers')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
