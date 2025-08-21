// src/lib/api.ts

// ---------------- Base URL (safe) ----------------
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000';

const SERVER_BASE = RAW_BASE.replace(/\/+$/, '');
export const API_BASE_URL = SERVER_BASE.endsWith('/api') ? SERVER_BASE : `${SERVER_BASE}/api`;

const buildUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

// ---------------- Types --------------------------
export interface ApiResponse<T = any> {
  data?: T;
  items?: T[];
  suggestions?: any[];
  message?: string;
  status?: number;
  page?: number;
  pageSize?: number;
  total?: number;
  pages?: number;
  ok?: boolean;
  filters?: Record<string, any>;
  meta?: Record<string, any>;
  searchType?: 'standard' | 'similarity';
}

export class ApiError extends Error {
  status: number;
  details?: {
    url?: string;
    method?: string;
    responseText?: string;
    responseJson?: any;
  };
  constructor(message: string, status: number, details?: ApiError['details']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

// ---------------- Api Client ---------------------
class ApiClient {
  updateProfileImage(formData: FormData) {
    throw new Error('Method not implemented.');
  }
  // play de-dupe cache (client-side)
  private reportedPlays = new Map<string, number>();
  private playTTL = 10 * 60 * 1000; // 10 min

  // simple in-memory cache
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private get token(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  setAuthToken(token: string) {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  }
  clearAuthToken() {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  }
  isAuthenticated(): boolean {
    return !!this.token;
  }

  private shouldSkipPlay(songId: string): boolean {
    const now = Date.now();
    for (const [id, ts] of this.reportedPlays.entries()) {
      if (now - ts > this.playTTL) this.reportedPlays.delete(id);
    }
    const last = this.reportedPlays.get(songId);
    return !!last && now - last < this.playTTL;
  }
  private markPlay(id: string) {
    this.reportedPlays.set(id, Date.now());
  }

  private safeLogError(prefix: string, data: any) {
    // لاگ کوتاه و خوانا—بدون dump آبجکت‌های بزرگ
    try {
      const msg =
        typeof data === 'string'
          ? data
          : isPlainObject(data)
          ? JSON.stringify(
              {
                ...('message' in data ? { message: data.message } : {}),
                ...('status' in data ? { status: data.status } : {}),
                ...('url' in data ? { url: data.url } : {}),
                ...('method' in data ? { method: data.method } : {}),
              },
              null,
              0
            )
          : String(data);
      console.error(`${prefix} ${msg}`);
    } catch {
      console.error(prefix);
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const hasBody = !!options.body;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(hasBody && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const cfg: RequestInit = { ...options, headers };
    const url = buildUrl(endpoint);

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('→', cfg.method || 'GET', url);
      }

      const res = await fetch(url, cfg);

      // 204: empty OK
      if (res.ok && res.status === 204) {
        return { ok: true, status: 204, message: 'No content' };
      }

      // read body as text, then try JSON
      let raw = '';
      let data: any = {};
      try {
        raw = await res.text();
        const ctype = res.headers.get('content-type') || '';
        const looksJson =
          ctype.includes('application/json') ||
          ctype.includes('+json') ||
          raw.trim().startsWith('{') ||
          raw.trim().startsWith('[');

        if (raw.trim() && looksJson) {
          data = JSON.parse(raw);
        } else if (raw.trim()) {
          data = { message: raw };
        } else {
          data = { message: 'Empty response from server' };
        }
      } catch (e: any) {
        data = { message: 'Invalid JSON response from server', rawResponse: raw, parseError: e?.message };
      }

      if (!res.ok) {
        // 401 → clear token
        if (res.status === 401) {
          this.clearAuthToken();
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        const msg =
          data?.message ||
          data?.error ||
          `HTTP ${res.status}${res.statusText ? `: ${res.statusText}` : ''}`;

        this.safeLogError('❌ API', { message: msg, status: res.status, url, method: cfg.method || 'GET' });

        throw new ApiError(msg, res.status, {
          url,
          method: (cfg.method as string) || 'GET',
          responseText: typeof data?.message === 'string' ? data.message : undefined,
          responseJson: isPlainObject(data) ? data : undefined,
        });
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('←', res.status, url);
      }

      return data;
    } catch (err: any) {
      // network-level
      if (err instanceof TypeError) {
        this.safeLogError('🌐 Network error:', err.message);
        throw new ApiError('Network connection failed - Check if server is running', 0, {
          url: buildUrl(endpoint),
          method: (options.method as string) || 'GET',
        });
      }
      if (err instanceof ApiError) {
        throw err;
      }
      this.safeLogError('🚨 Unexpected error:', err?.message || String(err));
      throw new ApiError(`Network error: ${err?.message || 'Unknown'}`, 500, {
        url: buildUrl(endpoint),
        method: (options.method as string) || 'GET',
      });
    }
  }

  // --------- Basic HTTP wrappers ----------
  async get<T>(endpoint: string, _params?: any): Promise<T> {
    const res = await this.request<T>(endpoint);
    if ((res as any).items) return (res as any).items as T;
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }
  async post<T>(endpoint: string, body?: any): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }
  async put<T>(endpoint: string, body?: any): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }
  async delete<T>(endpoint: string, body?: any): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'DELETE',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }

  // -------------- Auth ---------------------
  async login(credentials: { username: string; password: string }) {
    if (!credentials.username || !credentials.password) throw new ApiError('Username and password are required', 400);
    const result = await this.post<{ id: string; username: string; role: string; token: string }>(
      '/auth/login',
      credentials
    );
    if ((result as any)?.token) {
      this.setAuthToken((result as any).token);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:login', { detail: result }));
    }
    return result;
  }
  async register(data: { username: string; password: string }) {
    if (!data.username || !data.password) throw new ApiError('Username and password are required', 400);
    if (data.username.length < 3) throw new ApiError('Username must be at least 3 characters', 400);
    if (data.password.length < 4) throw new ApiError('Password must be at least 4 characters', 400);
    return this.post<any>('/auth/register', data);
  }
  async logout() {
    this.clearAuthToken();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // --------- Pagination helper ------------
  async getPaginated<T>(endpoint: string, params?: Record<string, any>) {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
      });
    }
    const url = sp.toString() ? `${endpoint}?${sp.toString()}` : endpoint;
    const res = await this.request<T[]>(url);
    return {
      items: ((res as any).items || []) as T[],
      page: (res as any).page || 1,
      pageSize: (res as any).pageSize || 10,
      total: (res as any).total || 0,
      pages: (res as any).pages || 0,
      filters: (res as any).filters,
      meta: (res as any).meta,
    };
  }

  // -------------- Song APIs ----------------
  async getSongs(params?: { page?: number; pageSize?: number; q?: string; genre?: string; artist?: string; order?: 'recent' | 'popular' | 'trending' | 'alphabetical' }) {
    return this.getPaginated<any>('/songs', params);
  }
  async getTopSongs(params?: { page?: number; pageSize?: number; genre?: string; timeRange?: 'all' | 'week' | 'month' | 'year' }) {
    return this.getPaginated<any>('/songs/top', params);
  }
  async getTrendingSongs(params?: { page?: number; pageSize?: number; windowDays?: number; minPlays?: number; genre?: string }) {
    return this.getPaginated<any>('/songs/trending', params);
  }
  async getSong(id: string) {
    if (!id) throw new ApiError('Song ID is required', 400);
    return this.get<any>(`/songs/${id}`);
  }
  async createSong(data: { title: string; artist: string; genre: string; releaseDate: string; coverImage: string; fileUrl: string }) {
    if (!data.title?.trim()) throw new ApiError('Title is required', 400);
    if (!data.artist?.trim()) throw new ApiError('Artist is required', 400);
    if (!data.genre?.trim()) throw new ApiError('Genre is required', 400);
    if (!data.releaseDate) throw new ApiError('Release date is required', 400);
    if (!data.coverImage?.trim()) throw new ApiError('Cover image is required', 400);
    if (!data.fileUrl?.trim()) throw new ApiError('Audio file is required', 400);
    return this.post<any>('/songs', data);
  }
  async updateSong(id: string, data: Partial<{ title: string; artist: string; genre: string; releaseDate: string; coverImage: string }>) {
    if (!id) throw new ApiError('Song ID is required', 400);
    return this.put<any>(`/songs/${id}`, data);
  }
  async deleteSong(id: string) {
    if (!id) throw new ApiError('Song ID is required', 400);
    return this.delete<any>(`/songs/${id}`);
  }
  async playSong(id: string) {
    if (!id) throw new ApiError('Song ID is required', 400);
    if (this.shouldSkipPlay(id)) return { ok: true, message: 'play already reported recently' } as any;
    try {
      const res = await this.post<any>(`/songs/${id}/play`);
      this.markPlay(id);
      return res;
    } catch (e: any) {
      if (e?.status === 400 || e?.status === 409) {
        this.markPlay(id);
        return { ok: true, message: 'play deduped' } as any;
      }
      throw e;
    }
  }

  // -------------- Playlist -----------------
  async getPlaylists(params?: { page?: number; pageSize?: number }) {
    return this.getPaginated<any>('/playlists/me', params);
  }
  async getPlaylist(id: string) {
    if (!id) throw new ApiError('Playlist ID is required', 400);
    return this.get<any>(`/playlists/${id}`);
  }
  async createPlaylist(data: { name: string; description?: string }) {
    if (!data.name?.trim()) throw new ApiError('Playlist name is required', 400);
    return this.post<any>('/playlists', data);
  }
  async updatePlaylist(id: string, data: { name?: string; description?: string }) {
    if (!id) throw new ApiError('Playlist ID is required', 400);
    return this.put<any>(`/playlists/${id}`, data);
  }
  async deletePlaylist(id: string) {
    if (!id) throw new ApiError('Playlist ID is required', 400);
    return this.delete<any>(`/playlists/${id}`);
  }
  async addSongToPlaylist(playlistId: string, songId: string) {
    if (!playlistId) throw new ApiError('Playlist ID is required', 400);
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.post<any>(`/playlists/${playlistId}/songs`, { songId });
  }
  async removeSongFromPlaylist(playlistId: string, songId: string) {
    if (!playlistId) throw new ApiError('Playlist ID is required', 400);
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.delete<any>(`/playlists/${playlistId}/songs/${songId}`);
  }

  // -------------- Search -------------------
  async search(params: { q: string; scope?: 'songs' | 'users' | 'playlists'; page?: number; pageSize?: number }) {
    if (!params.q || params.q.trim().length === 0) throw new ApiError('Search query is required', 400);
    if (params.q.length > 200) throw new ApiError('Search query too long', 400);
    return this.getPaginated<any>('/search', params);
  }
  async getSearchSuggestions(q: string, limit = 10) {
    if (!q || q.trim().length < 2) return [];
    if (limit < 1 || limit > 20) limit = 10;
    try {
      const res = await this.request<any>(`/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`);
      return res.suggestions || [];
    } catch {
      return [];
    }
  }

  // -------------- Users --------------------
  async getMe() {
    return this.get<any>('/users/me');
  }
  async updateMe(data: { bio?: string | null; profileImage?: string | null; socialLinks?: any }) {
    return this.put<any>('/users/me', data);
  }
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    if (!data.currentPassword) throw new ApiError('Current password is required', 400);
    if (!data.newPassword) throw new ApiError('New password is required', 400);
    if (data.newPassword.length < 4) throw new ApiError('New password must be at least 4 characters', 400);
    return this.post<any>('/users/me/change-password', data);
  }
  async setOnlineStatus(data: { isOnline: boolean }) {
    if (typeof data.isOnline !== 'boolean') throw new ApiError('isOnline must be a boolean', 400);
    return this.post<any>('/users/me/online-status', data);
  }
  async getUser(id: string) {
    if (!id) throw new ApiError('User ID is required', 400);
    return this.get<any>(`/users/${id}`);
  }
  async getMyUploads(params?: { page?: number; pageSize?: number; q?: string; genre?: string; order?: 'recent' | 'popular' | 'alphabetical' }) {
    return this.getPaginated<any>('/users/me/uploads', params);
  }
  async getMyLikes(params?: { page?: number; pageSize?: number }) {
    return this.getPaginated<any>('/users/me/likes', params);
  }
  async getUserUploads(userId: string, params?: { page?: number; pageSize?: number; q?: string; genre?: string; order?: 'recent' | 'popular' | 'alphabetical' }) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.getPaginated<any>(`/users/${userId}/uploads`, params);
  }
  async getUserPlaylists(userId: string, params?: { page?: number; pageSize?: number }) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.getPaginated<any>(`/users/${userId}/playlists`, params);
  }

  // -------------- Likes --------------------
  async likeSong(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.post<any>(`/likes/${songId}`);
  }
  async unlikeSong(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.delete<any>(`/likes/${songId}`);
  }
  async getSongLikes(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.get<any>(`/likes/${songId}`);
  }

  // -------------- Comments -----------------
  async getSongComments(songId: string, params?: { page?: number; pageSize?: number }) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.getPaginated<any>(`/comments/${songId}`, params);
  }
  async addComment(songId: string, text: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!text?.trim()) throw new ApiError('Comment text is required', 400);
    return this.post<any>(`/comments/${songId}`, { text: text.trim() });
  }
  async updateComment(commentId: string, text: string) {
    if (!commentId) throw new ApiError('Comment ID is required', 400);
    if (!text?.trim()) throw new ApiError('Comment text is required', 400);
    return this.put<any>(`/comments/${commentId}`, { text: text.trim() });
  }
  async deleteComment(commentId: string) {
    if (!commentId) throw new ApiError('Comment ID is required', 400);
    return this.delete<any>(`/comments/${commentId}`);
  }

  // -------------- Follow -------------------
  async followUser(userId: string) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.post<any>(`/follow/${userId}`);
  }
  async unfollowUser(userId: string) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.delete<any>(`/follow/${userId}`);
  }
  async getFollowers(userId?: string) {
    const id = userId || 'me';
    return this.get<any>(`/follow/followers/${id}`);
  }
  async getFollowing(userId?: string) {
    const id = userId || 'me';
    return this.get<any>(`/follow/following/${id}`);
  }

  // -------------- Feed/Tags/Lyrics --------
  async getFeed(params?: { page?: number; pageSize?: number }) {
    return this.getPaginated<any>('/feed', params);
  }
  async getSongTags(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.get<any>(`/tags/song/${songId}`);
  }
  async addSongTag(songId: string, tag: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!tag?.trim()) throw new ApiError('Tag is required', 400);
    return this.post<any>(`/tags/song/${songId}`, { tag: tag.trim() });
  }
  async removeSongTag(songId: string, tag: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!tag?.trim()) throw new ApiError('Tag is required', 400);
    return this.delete<any>(`/tags/song/${songId}`, { tag: tag.trim() });
  }
  async getTopTags() {
    return this.get<any>('/tags');
  }
  async getLyrics(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.get<any>(`/lyrics/${songId}`);
  }
  async upsertLyrics(songId: string, lyricsText: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!lyricsText?.trim()) throw new ApiError('Lyrics text is required', 400);
    return this.put<any>(`/lyrics/${songId}`, { lyricsText: lyricsText.trim() });
  }
  async deleteLyrics(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.delete<any>(`/lyrics/${songId}`);
  }

  // -------------- Upload -------------------
  async uploadFile(endpoint: string, file: File, onProgress?: (p: number) => void): Promise<{ url: string }> {
    if (!file) throw new ApiError('File is required', 400);

    const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudio = ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/mp3','audio/aac','audio/mp4','audio/webm','audio/m4a'];
    const isImageUpload = endpoint.includes('cover');
    const allowed = isImageUpload ? allowedImage : allowedAudio;
    if (!allowed.includes(file.type)) throw new ApiError(`Invalid file type`, 400);

    const max = isImageUpload ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > max) throw new ApiError(`File too large`, 400);

    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append(isImageUpload ? 'cover' : 'audio', file);

      const xhr = new XMLHttpRequest();
      xhr.timeout = 2 * 60 * 1000;

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const ok = xhr.status >= 200 && xhr.status < 300;
          const json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (ok && json?.url) resolve(json);
          else if (ok) reject(new ApiError('Invalid response from server', xhr.status));
          else reject(new ApiError(json?.message || 'Upload failed', xhr.status));
        } catch {
          reject(new ApiError('Invalid response from server', xhr.status));
        }
      });
      xhr.addEventListener('error', () => reject(new ApiError('Upload failed due to network error', 0)));
      xhr.addEventListener('timeout', () => reject(new ApiError('Upload timed out', 408)));
      xhr.addEventListener('abort', () => reject(new ApiError('Upload was cancelled', 0)));

      xhr.open('POST', `${API_BASE_URL}/upload${endpoint}`);
      if (this.token) xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(fd);
    });
  }
  async uploadCover(file: File, onProgress?: (p: number) => void) {
    return this.uploadFile('/cover', file, onProgress);
  }
  async uploadAudio(file: File, onProgress?: (p: number) => void) {
    return this.uploadFile('/audio', file, onProgress);
  }

  // -------------- Settings/Admin -----------
  async getSettings() { return this.get<any>('/settings'); }
  async updateSettings(settings: Record<string, any>) { return this.put<any>('/settings', settings); }
  async getAdminStats() { return this.get<any>('/admin/stats'); }
  async getAllUsers(params?: { page?: number; pageSize?: number; q?: string; role?: string }) {
    return this.getPaginated<any>('/admin/users', params);
  }
  async getAllSongs(params?: { page?: number; pageSize?: number; q?: string; status?: string }) {
    return this.getPaginated<any>('/admin/songs', params);
  }
  async moderateSong(songId: string, action: 'approve' | 'reject' | 'delete', reason?: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!action) throw new ApiError('Action is required', 400);
    return this.post<any>(`/admin/songs/${songId}/moderate`, { action, reason });
  }
  async banUser(userId: string, reason?: string, duration?: number) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.post<any>(`/admin/users/${userId}/ban`, { reason, duration });
  }
  async unbanUser(userId: string) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.post<any>(`/admin/users/${userId}/unban`);
  }
  async deleteUser(userId: string, reason?: string) {
    if (!userId) throw new ApiError('User ID is required', 400);
    return this.delete<any>(`/admin/users/${userId}`, { reason });
  }

  // -------------- Reports ------------------
  async reportSong(songId: string, reason: string, description?: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    if (!reason?.trim()) throw new ApiError('Report reason is required', 400);
    return this.post<any>('/reports/songs', { songId, reason: reason.trim(), description: description?.trim() });
  }
  async reportUser(userId: string, reason: string, description?: string) {
    if (!userId) throw new ApiError('User ID is required', 400);
    if (!reason?.trim()) throw new ApiError('Report reason is required', 400);
    return this.post<any>('/reports/users', { userId, reason: reason.trim(), description: description?.trim() });
  }
  async reportComment(commentId: string, reason: string, description?: string) {
    if (!commentId) throw new ApiError('Comment ID is required', 400);
    if (!reason?.trim()) throw new ApiError('Report reason is required', 400);
    return this.post<any>('/reports/comments', { commentId, reason: reason.trim(), description: description?.trim() });
  }
  async getReports(params?: { page?: number; pageSize?: number; type?: 'song' | 'user' | 'comment'; status?: 'pending' | 'reviewed' | 'resolved'; sortBy?: 'date' | 'priority' }) {
    return this.getPaginated<any>('/admin/reports', params);
  }
  async updateReportStatus(reportId: string, status: 'reviewed' | 'resolved', action?: string) {
    if (!reportId) throw new ApiError('Report ID is required', 400);
    if (!status) throw new ApiError('Status is required', 400);
    return this.put<any>(`/admin/reports/${reportId}`, { status, action });
  }

  // -------------- Reco/Related -------------
  async getRecommendations(params?: { type?: 'songs' | 'artists' | 'playlists'; limit?: number; basedOn?: 'likes' | 'listening_history' | 'similar_users' }) {
    return this.get<any>('/recommendations', params);
  }
  async getRelatedSongs(songId: string, limit = 10) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.get<any>(`/songs/${songId}/related?limit=${limit}`);
  }

  // -------------- Queue --------------------
  async getQueue() { return this.get<any>('/queue'); }
  async addToQueue(songId: string, position?: number) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.post<any>('/queue', { songId, position });
  }
  async removeFromQueue(songId: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.delete<any>(`/queue/${songId}`);
  }
  async clearQueue() { return this.delete<any>('/queue'); }
  async reorderQueue(songIds: string[]) {
    if (!Array.isArray(songIds)) throw new ApiError('Song IDs array is required', 400);
    return this.put<any>('/queue/reorder', { songIds });
  }

  // -------------- History ------------------
  async getListeningHistory(params?: { page?: number; pageSize?: number; dateFrom?: string; dateTo?: string }) {
    return this.getPaginated<any>('/history/listening', params);
  }
  async addToHistory(songId: string, duration?: number, timestamp?: string) {
    if (!songId) throw new ApiError('Song ID is required', 400);
    return this.post<any>('/history/listening', {
      songId,
      duration,
      timestamp: timestamp || new Date().toISOString(),
    });
  }
  async clearHistory() { return this.delete<any>('/history/listening'); }

  // -------------- Export/Import ------------
  async exportUserData(format: 'json' | 'csv' = 'json') {
    return this.get<any>(`/export/user-data?format=${format}`);
  }
  async exportPlaylist(playlistId: string, format: 'json' | 'csv' | 'm3u' = 'json') {
    if (!playlistId) throw new ApiError('Playlist ID is required', 400);
    return this.get<any>(`/export/playlist/${playlistId}?format=${format}`);
  }
  async importPlaylist(file: File, format: 'json' | 'csv' | 'm3u') {
    if (!file) throw new ApiError('File is required', 400);
    if (!format) throw new ApiError('Format is required', 400);

    const fd = new FormData();
    fd.append('playlist', file);
    fd.append('format', format);

    const res = await fetch(buildUrl('/import/playlist'), {
      method: 'POST',
      headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err?.message || 'Import failed', res.status);
    }
    return res.json();
  }

  // -------------- Backups ------------------
  async createBackup() { return this.post<any>('/backup/create'); }
  async getBackups() { return this.get<any>('/backup/list'); }
  async restoreBackup(backupId: string) {
    if (!backupId) throw new ApiError('Backup ID is required', 400);
    return this.post<any>(`/backup/restore/${backupId}`);
  }
  async deleteBackup(backupId: string) {
    if (!backupId) throw new ApiError('Backup ID is required', 400);
    return this.delete<any>(`/backup/${backupId}`);
  }

  // -------------- WebSocket ----------------
  createWebSocketConnection(endpoint: string): WebSocket | null {
    if (typeof window === 'undefined') return null;
    if (!this.token) return null;
    const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const ws = new WebSocket(`${wsBase}${ep}?token=${encodeURIComponent(this.token)}`);
    ws.addEventListener('error', (e) => console.error('WebSocket error'));
    return ws;
  }

  // -------------- Cache helpers -----------
  private getCached(key: string) {
    const v = this.cache.get(key);
    if (!v) return null;
    if (Date.now() - v.timestamp > v.ttl) {
      this.cache.delete(key);
      return null;
    }
    return v.data;
  }
  private setCached(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }
  async getCachedSong(id: string) {
    const key = `song:${id}`;
    const c = this.getCached(key);
    if (c) return c;
    const song = await this.getSong(id);
    this.setCached(key, song, 10 * 60 * 1000);
    return song;
  }
  clearCache() {
    this.cache.clear();
    if (process.env.NODE_ENV !== 'production') console.log('🧹 cache cleared');
  }

  // -------------- Retry/Batch/Debug -------
  async requestWithRetry<T>(endpoint: string, options: RequestInit = {}, maxRetries = 3, delay = 1000) {
    let last: any;
    for (let i = 1; i <= maxRetries; i++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (e: any) {
        last = e;
        if (e.status >= 400 && e.status < 500 && e.status !== 429) throw e;
        if (i === maxRetries) throw e;
        await new Promise((r) => setTimeout(r, delay * i));
      }
    }
    throw last;
  }
  async batchRequest<T>(requests: Array<{ endpoint: string; options?: RequestInit }>) {
    const results = await Promise.allSettled(requests.map((r) => this.request<T>(r.endpoint, r.options)));
    return results.map((res) => ({
      success: res.status === 'fulfilled',
      data: res.status === 'fulfilled' ? (res as PromiseFulfilledResult<any>).value as T : undefined,
      error: res.status === 'rejected' ? (res as PromiseRejectedResult).reason?.message : undefined,
    }));
  }
  async debugEndpoint(endpoint: string) {
    const url = buildUrl(endpoint);
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) } });
      return { url, reachable: true, responseTime: Date.now() - start, status: res.status };
    } catch (e: any) {
      return { url, reachable: false, responseTime: Date.now() - start, error: e?.message || 'fail' };
    }
  }

  // -------------- Health -------------------
  async healthCheck() {
    try {
      const res = await fetch(`${SERVER_BASE}/health`);
      if (!res.ok) throw new ApiError('Health check failed', res.status);
      return res.json();
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Health check failed', 0);
    }
  }
}

// singleton
export const api = new ApiClient();

// helpers
export const apiFetch = (endpoint: string, options?: RequestInit) => api.request(endpoint, options);
export const createAuthHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
export const isApiError = (e: any): e is ApiError => e instanceof ApiError;
export const getErrorMessage = (e: any) => (isApiError(e) ? e.message : e?.message || 'An unknown error occurred');
export const getErrorStatus = (e: any) => (isApiError(e) ? e.status : 500);

// constants
export const API_CONSTANTS = {
  BASE_URL: API_BASE_URL,
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: { IMAGE: 10 * 1024 * 1024, AUDIO: 100 * 1024 * 1024 },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    AUDIO: ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/mp3','audio/aac','audio/mp4','audio/webm','audio/m4a'],
  },
  CACHE_TTL: { SHORT: 5 * 60 * 1000, MEDIUM: 10 * 60 * 1000, LONG: 30 * 60 * 1000 },
} as const;

// global listeners (optional)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => api.clearCache());
  window.addEventListener('auth:login', () => {});
  window.addEventListener('unhandledrejection', (ev) => {
    if (ev.reason instanceof ApiError) {
      console.error(`🚨 Unhandled API Error ${ev.reason.status}: ${ev.reason.message}`);
    }
  });
}
