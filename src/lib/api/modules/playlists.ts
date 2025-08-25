// src/lib/api/modules/playlists.ts
import { normalizePlaylistResponse } from '../normalize';
import { http as httpInst } from '../http';
import type { ApiResponse } from '../types';
type HTTP = typeof httpInst;

export default (client: HTTP) => ({
  async getPlaylists(params?: { page?: number; pageSize?: number }) {
    return client.getPaginated<any>('/playlists/me', params, { auth: true });
  },
  async getPlaylist(id: string) {
    if (!id) throw new Error('Playlist ID is required');
    const res = await client.request<any>(`/playlists/${id}`);
    const raw = (res as ApiResponse<any>)?.data ?? res;
    return normalizePlaylistResponse(raw);
  },
  async createPlaylist(data: { name: string; description?: string }) {
    if (!data?.name?.trim()) throw new Error('Playlist name is required');
    return client.post<any>('/playlists', data, { auth: true });
  },
  async updatePlaylist(id: string, data: { name?: string; description?: string }) {
    if (!id) throw new Error('Playlist ID is required');
    return client.put<any>(`/playlists/${id}`, data, { auth: true });
  },
  async deletePlaylist(id: string) {
    if (!id) throw new Error('Playlist ID is required');
    return client.delete<any>(`/playlists/${id}`, undefined, { auth: true });
  },
  async addSongToPlaylist(playlistId: string, songId: string) {
    if (!playlistId) throw new Error('Playlist ID is required');
    if (!songId) throw new Error('Song ID is required');
    return client.post<any>(`/playlists/${playlistId}/songs`, { songId }, { auth: true });
  },
  async removeSongFromPlaylist(playlistId: string, songId: string) {
    if (!playlistId) throw new Error('Playlist ID is required');
    if (!songId) throw new Error('Song ID is required');
    return client.delete<any>(`/playlists/${playlistId}/songs/${songId}`, undefined, { auth: true });
  },
});
