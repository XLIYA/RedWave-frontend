export type UserProfile = {
  id: string
  username: string
  role: 'admin' | 'user'
  isOnline: boolean
  bio?: string | null
  profileImage?: string | null
  socialLinks?: {
    instagram?: string
    telegram?: string
    twitter?: string
    website?: string
  } | null
  createdAt?: string
  lastSeen?: string | null
  _count?: {
    followers: number
    following: number
    songs: number
    likes: number
    playlists: number
  }
}

export type SongItem = {
  id: string
  title: string
  artist: string
  genre?: string
  coverImage?: string
  analytics?: { playCount?: number; lastPlayed?: string }
  createdAt?: string
}

export type PlaylistItem = {
  id: string
  title: string
  coverImage?: string
  createdAt?: string
}

export type FollowUser = {
  id: string
  username: string
  profileImage?: string | null
  isOnline: boolean
}
