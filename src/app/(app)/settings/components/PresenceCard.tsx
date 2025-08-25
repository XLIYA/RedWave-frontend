// src/components/setting/PresenceCard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Globe, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface NotificationSettings {
  emailUpdates: boolean
  playlistUpdates: boolean
  followerUpdates: boolean
  messageUpdates: boolean
}

interface PresenceCardProps {
  isOnline: boolean
  onOnlineChange?: (next: boolean) => void
}

const STORAGE_KEY = 'settings.notifications'

const defaultNotifications: NotificationSettings = {
  emailUpdates: true,
  playlistUpdates: true,
  followerUpdates: true,
  messageUpdates: true
}

export default function PresenceCard({ isOnline, onOnlineChange }: PresenceCardProps) {
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setNotifications(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }, [])

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notifications, [key]: value }
    setNotifications(newSettings)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card className="glass card-hover text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show online status</Label>
                <p className="text-sm text-muted-foreground">Others can see that you are online</p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Online Status */}
      <Card className="glass card-hover text-left">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show online status</Label>
              <p className="text-sm text-muted-foreground">Others can see that you are online</p>
            </div>
            <Switch checked={isOnline} onCheckedChange={onOnlineChange} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="glass card-hover text-left">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
            <span className="text-xs px-2 py-1 bg-muted rounded-md">Local</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">Receive important updates via email</p>
            </div>
            <Switch
              checked={notifications.emailUpdates}
              onCheckedChange={(checked) => updateNotification('emailUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Playlist updates</Label>
              <p className="text-sm text-muted-foreground">Notify when songs are added to playlists</p>
            </div>
            <Switch
              checked={notifications.playlistUpdates}
              onCheckedChange={(checked) => updateNotification('playlistUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New followers</Label>
              <p className="text-sm text-muted-foreground">Notify when new users follow you</p>
            </div>
            <Switch
              checked={notifications.followerUpdates}
              onCheckedChange={(checked) => updateNotification('followerUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New messages</Label>
              <p className="text-sm text-muted-foreground">Notify when you receive new messages</p>
            </div>
            <Switch
              checked={notifications.messageUpdates}
              onCheckedChange={(checked) => updateNotification('messageUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
