import { ReactNode } from "react"

export interface User {
  name: ReactNode
  email: ReactNode
  id: string
  username: string
  role: 'admin' | 'user'
  bio?: string
  profileImage?: string
  socialLinks?: Record<string, string>
  isOnline?: boolean
  lastSeen?: string
  createdAt: string
  updatedAt: string
  _count?: {
    followers: number
    following: number
    songs: number
    likes: number
    playlists: number
  }
  isFollowing?: boolean // for user profile views
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  duration?: number;
  coverImage: string;   // ← استاندارد
  fileUrl: string;      // ← استاندارد
  // سازگاری با داده‌های قدیمی (اختیاری)
  cover?: string;
  audioUrl?: string;

  // سایر فیلدها (مطابق استفادهٔ فعلی)
  createdAt: string;
  updatedAt?: string;
  releaseDate?: string;
  liked?: boolean;
  likedAt?: string;
  addedAt?: string;
  uploadedBy?: { id: string; username: string; profileImage?: string };
  analytics?: { id: string; playCount: number; uniqueListeners: number; lastPlayed: string };
  _count?: { likes: number; comments: number; moodTags: number };
}

export interface Playlist {
  id: string
  name: string
  description?: string
  cover?: string
  tracks?: Track[]
  items?: Track[] // for API responses
  trackCount?: number
  songsCount?: number // for API responses
  duration?: number
  isPublic?: boolean
  ownerId: string
  owner: Pick<User, 'id' | 'username' | 'profileImage'>
  createdAt: string
  updatedAt: string
  _count?: {
    songs: number
  }
}

export interface Comment {
  id: string
  text: string
  userId: string
  songId: string
  createdAt: string
  updatedAt?: string
  user: Pick<User, 'id' | 'username' | 'profileImage'>
}

export interface Like {
  id: string
  userId: string
  songId: string
  createdAt: string
  user: Pick<User, 'id' | 'username' | 'profileImage'>
}

export interface SearchResult {
  scope: 'songs' | 'users' | 'playlists'
  q: string
  page: number
  pageSize: number
  total: number
  pages: number
  items: Track[] | User[] | Playlist[]
  searchType?: 'standard' | 'similarity'
}

export interface SearchSuggestion {
  type: 'title' | 'artist'
  value: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  queue: Track[]
  currentIndex: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
}

export interface UploadProgress {
  audio: number
  cover: number
}

export interface ApiError {
  message: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  pages: number
}