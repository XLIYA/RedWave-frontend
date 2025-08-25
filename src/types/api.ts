export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  token: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  coverImage?: string;
  fileUrl?: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
}

export type PageResp<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export interface PlayAnalytics {
  songId: string;
  playCount: number;
  uniqueListeners: number;
  lastPlayed: string;
}

export interface PlayResponse {
  ok: boolean;
  message: string;
  data?: {
    song: Song;
    analytics: PlayAnalytics;
    uniqueIncreased: boolean;
  };
}


