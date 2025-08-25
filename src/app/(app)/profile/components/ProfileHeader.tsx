'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Settings, User, UserMinus, UserPlus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from './types'

type Props = {
  profile: UserProfile
  isMyProfile: boolean
  isFollowing: boolean
  onFollowToggle: () => void
  formatDateEn: (d?: string) => string
}

export default function ProfileHeader({ profile, isMyProfile, isFollowing, onFollowToggle, formatDateEn }: Props) {
  return (
    <div className="flex items-start gap-6">
      {/* Avatar */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
          {profile.profileImage ? (
            <Image src={profile.profileImage} alt={profile.username} width={96} height={96} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-white" />
          )}
        </div>
        {profile.isOnline && <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold gradient-text truncate">{profile.username}</h1>
          <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
            {profile.role === 'admin' ? 'Admin' : 'User'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Member since {formatDateEn(profile.createdAt)}
          </span>
          {profile.lastSeen && <span>Last seen: {formatDateEn(profile.lastSeen)}</span>}
        </div>

        <div>
          {isMyProfile ? (
            <Button asChild className="btn-gradient">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Account settings
              </Link>
            </Button>
          ) : (
            <Button onClick={onFollowToggle} className="btn-gradient" variant={isFollowing ? 'outline' : 'default'}>
              {isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
