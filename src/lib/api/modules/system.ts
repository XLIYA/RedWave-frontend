// src/lib/api/modules/system.ts
import { API_BASE_URL } from '../config';
import { http as httpInst } from '../http';
type HTTP = typeof httpInst;

export default (client: HTTP) => ({
  // Settings/Admin
  async getSettings() { return client.get<any>('/settings'); },
  async updateSettings(settings: Record<string, any>) { return client.put<any>('/settings', settings); },
  async getAdminStats() { return client.get<any>('/admin/stats'); },
  async getAllUsers(params?: { page?: number; pageSize?: number; q?: string; role?: string }) {
    return client.getPaginated<any>('/admin/users', params);
  },
  async getAllSongs(params?: { page?: number; pageSize?: number; q?: string; status?: string }) {
    return client.getPaginated<any>('/admin/songs', params);
  },
  async moderateSong(songId: string, action: 'approve' | 'reject' | 'delete', reason?: string) {
    if (!songId) throw new Error('Song ID is required');
    if (!action) throw new Error('Action is required');
    return client.post<any>(`/admin/songs/${songId}/moderate`, { action, reason });
  },
  async banUser(userId: string, reason?: string, duration?: number) {
    if (!userId) throw new Error('User ID is required');
    return client.post<any>(`/admin/users/${userId}/ban`, { reason, duration });
  },
  async unbanUser(userId: string) { if (!userId) throw new Error('User ID is required'); return client.post<any>(`/admin/users/${userId}/unban`); },
  async deleteUser(userId: string, reason?: string) { if (!userId) throw new Error('User ID is required'); return client.delete<any>(`/admin/users/${userId}`, { reason }); },

  // Reports
  async reportSong(songId: string, reason: string, description?: string) {
    if (!songId) throw new Error('Song ID is required');
    if (!reason?.trim()) throw new Error('Report reason is required');
    return client.post<any>('/reports/songs', { songId, reason: reason.trim(), description: description?.trim() });
  },
  async reportUser(userId: string, reason: string, description?: string) {
    if (!userId) throw new Error('User ID is required');
    if (!reason?.trim()) throw new Error('Report reason is required');
    return client.post<any>('/reports/users', { userId, reason: reason.trim(), description: description?.trim() });
  },
  async reportComment(commentId: string, reason: string, description?: string) {
    if (!commentId) throw new Error('Comment ID is required');
    if (!reason?.trim()) throw new Error('Report reason is required');
    return client.post<any>('/reports/comments', { commentId, reason: reason.trim(), description: description?.trim() });
  },
  async getReports(params?: { page?: number; pageSize?: number; type?: 'song' | 'user' | 'comment'; status?: 'pending' | 'reviewed' | 'resolved'; sortBy?: 'date' | 'priority' }) {
    return client.getPaginated<any>('/admin/reports', params);
  },
  async updateReportStatus(reportId: string, status: 'reviewed' | 'resolved', action?: string) {
    if (!reportId) throw new Error('Report ID is required');
    if (!status) throw new Error('Status is required');
    return client.put<any>(`/admin/reports/${reportId}`, { status, action });
  },

  // Queue (disabled)
  async getQueue() { throw new Error('Queue API is disabled'); },
  async addToQueue(_songId: string, _position?: number) { throw new Error('Queue API is disabled'); },
  async removeFromQueue(_songId: string) { throw new Error('Queue API is disabled'); },
  async clearQueue() { throw new Error('Queue API is disabled'); },
  async reorderQueue(_songIds: string[]) { throw new Error('Queue API is disabled'); },

  // History (disabled)
  async getListeningHistory(_params?: { page?: number; pageSize?: number; dateFrom?: string; dateTo?: string }) { throw new Error('History API is disabled'); },
  async addToHistory(_songId: string, _duration?: number, _timestamp?: string) { throw new Error('History API is disabled'); },
  async clearHistory() { throw new Error('History API is disabled'); },

  // Export/Import (disabled)
  async exportUserData(_format: 'json' | 'csv' = 'json') { throw new Error('Export API is disabled'); },
  async exportPlaylist(_playlistId: string, _format: 'json' | 'csv' | 'm3u' = 'json') { throw new Error('Export API is disabled'); },
  async importPlaylist(_file: File, _format: 'json' | 'csv' | 'm3u') { throw new Error('Import API is disabled'); },

  // Backups (disabled)
  async createBackup() { throw new Error('Backup API is disabled'); },
  async getBackups() { throw new Error('Backup API is disabled'); },
  async restoreBackup(_backupId: string) { throw new Error('Backup API is disabled'); },
  async deleteBackup(_backupId: string) { throw new Error('Backup API is disabled'); },

  // Upload (با progress)
  async uploadFile(endpoint: string, file: File, onProgress?: (p: number) => void): Promise<{ url: string }> {
    if (!file) throw new Error('File is required');

    const isImage = endpoint.includes('cover');
    const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedAudio = ['audio/mpeg','audio/wav','audio/flac','audio/ogg','audio/mp3','audio/aac','audio/mp4','audio/webm','audio/m4a'];
    const allowed = isImage ? allowedImage : allowedAudio;
    if (!allowed.includes(file.type)) throw new Error('Invalid file type');

    const max = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > max) throw new Error('File too large');

    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append(isImage ? 'cover' : 'audio', file);

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
          else if (ok) reject(new Error('Invalid response from server'));
          else reject(new Error(json?.message || 'Upload failed'));
        } catch { reject(new Error('Invalid response from server')); }
      });
      xhr.addEventListener('error', () => reject(new Error('Upload failed due to network error')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));

      xhr.open('POST', `${API_BASE_URL}/upload${endpoint}`);
      const token = client.getAuthToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(fd);
    });
  },
  async uploadCover(file: File, onProgress?: (p: number) => void) { return (await (this as any).uploadFile('/cover', file, onProgress)); },
  async uploadAudio(file: File, onProgress?: (p: number) => void) { return (await (this as any).uploadFile('/audio', file, onProgress)); },
});
