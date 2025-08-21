'use client'

import { useState, useEffect } from 'react'
import { Save, Shield, User, Bell, Globe, Camera, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

interface UserProfile {
  id: string
  username: string
  role: string
  bio?: string
  profileImage?: string
  socialLinks?: {
    instagram?: string
    telegram?: string
    twitter?: string
    website?: string
  }
  isOnline: boolean
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Profile form
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    telegram: '',
    twitter: '',
    website: ''
  })

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Settings
  const [isOnline, setIsOnline] = useState(true)
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    playlistUpdates: true,
    followerUpdates: true,
    messageUpdates: true
  })

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getMe()
      setProfile(data)
      setBio(data.bio || '')
      setProfileImage(data.profileImage || '')
      setSocialLinks(data.socialLinks || {
        instagram: '',
        telegram: '',
        twitter: '',
        website: ''
      })
      setIsOnline(!!data.isOnline)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setSaving(true)
      setMessage('')
      setError('')

      const updateData = {
        bio: bio.trim() || null,
        profileImage: profileImage.trim() || null,
        socialLinks: socialLinks
      }

      // اگر API کاربر آپدیت‌شده را برگرداند، همان را به updateUser بده؛
      // در غیر این‌صورت، از updateData (Partial<User>) استفاده کن.
      const updated = await api.updateMe(updateData).catch(() => undefined)

      // ✅ اینجا آرگومان به updateUser داده می‌شود تا ارور ts(2554) رفع شود.
      updateUser((updated && typeof updated === 'object') ? updated : updateData)

      // state محلی را هم به‌روز کنیم تا UI فوراً رفرش شود
      setProfile(prev => prev ? { ...prev, ...((updated && typeof updated === 'object') ? updated : updateData) } as UserProfile : prev)

      setMessage('Profile successfully updated')
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err?.message || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true)
      setMessage('')
      setError('')

      if (newPassword !== confirmPassword) {
        setError('New password and repeat password must be the same')
        return
      }

      if (newPassword.length < 6) {
        setError('The new password must be at least 6 characters long')
        return
      }

      await api.changePassword({
        currentPassword,
        newPassword
      })

      setMessage('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Password change error:', err)
      setError(err?.message || 'Error changing password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleOnlineStatusChange = async (checked: boolean) => {
    try {
      setIsOnline(checked)
      await api.setOnlineStatus({ isOnline: checked })
      // ✅ هم Auth context و هم state محلی را به‌روز می‌کنیم
      updateUser({ isOnline: checked })
      setProfile(prev => prev ? { ...prev, isOnline: checked } : prev)
    } catch (err) {
      console.error('Online status error:', err)
      setIsOnline(!checked) // Revert on error
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">Account management and personal settings</p>
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                    {(profile?.username?.charAt(0).toUpperCase() || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile picture</Label>
                  <div className="flex gap-2">
                    <Input
                      id="profileImage"
                      placeholder="Profile image link"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" type="button">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">Username cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a few words about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Social links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram">Telegram</Label>
                    <Input
                      id="telegram"
                      placeholder="@username"
                      value={socialLinks.telegram}
                      onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="@username"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={saving} className="btn-gradient" type="button">
                  <Save className="h-4 w-4 ml-2" />
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Repeat new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-gradient"
                  type="button"
                >
                  {changingPassword ? 'Changing...' : 'Change password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Attendance status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show online status</Label>
                  <p className="text-sm text-muted-foreground">
                    Others can see that you are online.
                  </p>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleOnlineStatusChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Playlist updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification when songs are added to playlists
                  </p>
                </div>
                <Switch
                  checked={notifications.playlistUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, playlistUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New followers</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification when being followed by new users
                  </p>
                </div>
                <Switch
                  checked={notifications.followerUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, followerUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification when receiving new comments
                  </p>
                </div>
                <Switch
                  checked={notifications.messageUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, messageUpdates: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
