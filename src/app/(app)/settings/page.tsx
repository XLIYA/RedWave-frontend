// src/app/(app)/setting/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, User, Shield, Bell, Users, Music, Heart, Code } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { AccountSnapshot } from './components/AccountSnapshot'
import { SocialLinksForm } from './components/SocialLinksForm'
import { AdminCtaCard } from './components/AdminCtaCard'
import PasswordForm from './components/PasswordForm'
import PresenceCard from './components/PresenceCard'
import ConnectionsPanel from './components/ConnectionsPanel'
import UploadsPanel from './components/UploadsPanel'
import LikesPanel from './components/LikesPanel'
import ApiDocsCard from './components/ApiDocsCard'

interface UserProfile {
  id: string
  username: string
  email?: string
  role: 'admin' | 'user'
  bio?: string | null
  profileImage?: string | null
  socialLinks?: {
    instagram?: string
    telegram?: string
    twitter?: string
    website?: string
  } | null
  isOnline: boolean
  createdAt: string
  lastSeen?: string | null
  _count?: {
    followers: number
    following: number
    songs: number
    likes: number
    playlists: number
  }
}

export default function SettingPage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('account')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getMe()
      setProfile(data)
    } catch (err: any) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
    const userUpdate = {
      ...updatedProfile,
      bio: updatedProfile.bio || undefined,
      profileImage: updatedProfile.profileImage || undefined,
      socialLinks: updatedProfile.socialLinks || undefined,
      lastSeen: updatedProfile.lastSeen || undefined
    }
    updateUser(userUpdate)
  }

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setMessage('')
    } else {
      setMessage(msg)
      setError('')
    }

    setTimeout(() => {
      setMessage('')
      setError('')
    }, 5000)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in text-left">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass p-6 rounded-lg space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-96 animate-fade-in">
        <Alert className="max-w-md text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load data. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">Manage your account, privacy, and platform settings</p>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 glass">
          <TabsTrigger value="account" className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 text-xs">
            <Shield className="h-3 w-3" />
            Security
          </TabsTrigger>
          <TabsTrigger value="presence" className="flex items-center gap-2 text-xs">
            <Bell className="h-3 w-3" />
            Presence
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2 text-xs">
            <Users className="h-3 w-3" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2 text-xs">
            <Music className="h-3 w-3" />
            Content
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-2 text-xs">
            <Code className="h-3 w-3" />
            Developer
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <AccountSnapshot profile={profile} />

          <SocialLinksForm profile={profile} onUpdate={handleProfileUpdate} onMessage={showMessage} />

          {profile.role === 'admin' && <AdminCtaCard />}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <PasswordForm onMessage={showMessage} />
        </TabsContent>

        {/* Presence & Preferences Tab */}
        <TabsContent value="presence" className="space-y-6">
          <PresenceCard
            isOnline={profile.isOnline}
            onOnlineChange={async (isOnline) => {
              try {
                await api.setOnlineStatus({ isOnline })
                const updatedProfile = { ...profile, isOnline }
                handleProfileUpdate(updatedProfile)
              } catch (err) {
                showMessage('Failed to update online status', true)
              }
            }}
          />
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <ConnectionsPanel onMessage={showMessage} />
        </TabsContent>

        {/* Content Tab (My Uploads + My Likes) */}
        <TabsContent value="content" className="space-y-6">
          <Tabs defaultValue="uploads" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                My Uploads
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Likes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads">
              <UploadsPanel profile={profile} onMessage={showMessage} />
            </TabsContent>

            <TabsContent value="likes">
              <LikesPanel onMessage={showMessage} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-6">
          <ApiDocsCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
