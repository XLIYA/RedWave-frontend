// src/components/setting/AccountSnapshot.tsx
import { Crown, User, Calendar, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

interface AccountSnapshotProps {
  profile: any
}

export function AccountSnapshot({ profile }: AccountSnapshotProps) {
  const RoleIcon = profile.role === 'admin' ? Crown : User
  const roleText = profile.role === 'admin' ? 'Admin' : 'User'
  const onlineText = profile.isOnline ? 'Online' : 'Offline'

  return (
    <Card className="glass card-hover text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.profileImage || undefined} />
            <AvatarFallback className="text-lg font-bold">
              {profile.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-semibold">{profile.username}</h3>
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3" />
                {roleText}
              </Badge>
              <Badge variant={profile.isOnline ? 'default' : 'outline'} className={profile.isOnline ? 'bg-green-500' : ''}>
                {onlineText}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Member since {new Date(profile.createdAt).getFullYear()}
              </span>
              {profile.lastSeen && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last seen {formatRelativeTime(profile.lastSeen)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {profile._count && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-left space-y-1">
              <div className="text-2xl font-bold text-primary">{profile._count.followers || 0}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-left space-y-1">
              <div className="text-2xl font-bold text-primary">{profile._count.following || 0}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div className="text-left space-y-1">
              <div className="text-2xl font-bold text-primary">{profile._count.songs || 0}</div>
              <div className="text-sm text-muted-foreground">Songs</div>
            </div>
            <div className="text-left space-y-1">
              <div className="text-2xl font-bold text-primary">{profile._count.likes || 0}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-left space-y-1">
              <div className="text-2xl font-bold text-primary">{profile._count.playlists || 0}</div>
              <div className="text-sm text-muted-foreground">Playlists</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
