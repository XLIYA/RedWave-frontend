import { http as _default } from '../http';
type HTTP = typeof _default;

export default (http: HTTP) => ({
  // Auth
  async login(credentials: { username: string; password: string }) {
    if (!credentials.username || !credentials.password) throw new Error('Username and password are required');
    const result = await http.post<{
      role: "user" | "admin";
      id: string;
      username: string; token: string 
}>('/auth/login', credentials, { auth: false });
    if ((result as any)?.token) {
      http.setAuthToken((result as any).token);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:login', { detail: result }));
    }
    return result;
  },
  async register(data: { username: string; password: string }) {
    if (!data.username || !data.password) throw new Error('Username and password are required');
    if (data.username.length < 3) throw new Error('Username must be at least 3 characters');
    if (data.password.length < 4) throw new Error('Password must be at least 4 characters');
    return http.post<any>('/auth/register', data, { auth: false });
  },
  async logout() {
    http.clearAuthToken();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  // Profile
  async getMe() { return http.get<any>('/users/me', undefined, { auth: true }); },
  async updateMe(data: { bio?: string | null; profileImage?: string | null; socialLinks?: any }) {
    return http.put<any>('/users/me', data, { auth: true });
  },
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    if (!data.currentPassword) throw new Error('Current password is required');
    if (!data.newPassword) throw new Error('New password is required');
    if (data.newPassword.length < 4) throw new Error('New password must be at least 4 characters');
    return http.post<any>('/users/me/change-password', data, { auth: true });
  },
  async setOnlineStatus(data: { isOnline: boolean }) {
    if (typeof data.isOnline !== 'boolean') throw new Error('isOnline must be a boolean');
    return http.post<any>('/users/me/online-status', data, { auth: true });
  },
  async getUser(id: string) { if (!id) throw new Error('User ID is required'); return http.get<any>(`/users/${id}`); },

  // Uploads/Likes lists
  async getMyUploads(params?: { page?: number; pageSize?: number; q?: string; genre?: string; order?: 'recent' | 'popular' | 'alphabetical' }) {
    return http.getPaginated<any>('/users/me/uploads', params, { auth: true });
  },
  async getMyLikes(params?: { page?: number; pageSize?: number }) {
    return http.getPaginated<any>('/users/me/likes', params, { auth: true });
  },
  async getUserUploads(userId: string, params?: { page?: number; pageSize?: number; q?: string; genre?: string; order?: 'recent' | 'popular' | 'alphabetical' }) {
    if (!userId) throw new Error('User ID is required');
    return http.getPaginated<any>(`/users/${userId}/uploads`, params);
  },
  async getUserPlaylists(userId: string, params?: { page?: number; pageSize?: number }) {
    if (!userId) throw new Error('User ID is required');
    return http.getPaginated<any>(`/users/${userId}/playlists`, params);
  },

  // Social: likes
  async likeSong(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.post<any>(`/likes/${songId}`, undefined, { auth: true }); },
  async unlikeSong(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.delete<any>(`/likes/${songId}`, undefined, { auth: true }); },
  async getSongLikes(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.get<any>(`/likes/${songId}`); },

  // Social: comments
  async getSongComments(songId: string, params?: { page?: number; pageSize?: number }) {
    if (!songId) throw new Error('Song ID is required');
    return http.getPaginated<any>(`/comments/${songId}`, params);
  },
  async addComment(songId: string, text: string) {
    if (!songId) throw new Error('Song ID is required');
    if (!text?.trim()) throw new Error('Comment text is required');
    return http.post<any>(`/comments/${songId}`, { text: text.trim() }, { auth: true });
  },
  async updateComment(commentId: string, text: string) {
    if (!commentId) throw new Error('Comment ID is required');
    if (!text?.trim()) throw new Error('Comment text is required');
    return http.put<any>(`/comments/${commentId}`, { text: text.trim() }, { auth: true });
  },
  async deleteComment(commentId: string) { if (!commentId) throw new Error('Comment ID is required'); return http.delete<any>(`/comments/${commentId}`, undefined, { auth: true }); },

  // Social: follow
  async followUser(userId: string) { if (!userId) throw new Error('User ID is required'); return http.post<any>(`/follow/${userId}`, undefined, { auth: true }); },
  async unfollowUser(userId: string) { if (!userId) throw new Error('User ID is required'); return http.delete<any>(`/follow/${userId}`, undefined, { auth: true }); },
  async getFollowers(userId?: string) { const id = userId || 'me'; return http.get<any>(`/follow/followers/${id}`); },
  async getFollowing(userId?: string) { const id = userId || 'me'; return http.get<any>(`/follow/following/${id}`); },
});
