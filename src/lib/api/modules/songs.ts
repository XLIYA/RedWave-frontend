import { http as _default } from '../http';
type HTTP = typeof _default;

export default (http: HTTP) => {
  // de-dupe گزارش play
  const reported = new Map<string, number>();
  const TTL = 10 * 60 * 1000;

  function shouldSkip(id: string) {
    const now = Date.now();
    for (const [sid, ts] of reported.entries()) if (now - ts > TTL) reported.delete(sid);
    const last = reported.get(id);
    return !!last && now - last < TTL;
  }
  function mark(id: string) { reported.set(id, Date.now()); }

  return {
    async getSongs(params?: { page?: number; pageSize?: number; q?: string; genre?: string; artist?: string; order?: 'recent' | 'popular' | 'trending' | 'alphabetical' }) {
      return http.getPaginated<any>('/songs', params);
    },
    async getTopSongs(params?: { page?: number; pageSize?: number; genre?: string; timeRange?: 'all' | 'week' | 'month' | 'year' }) {
      return http.getPaginated<any>('/songs/top', params);
    },
    async getTrendingSongs(params?: { page?: number; pageSize?: number; windowDays?: number; minPlays?: number; genre?: string }) {
      return http.getPaginated<any>('/songs/trending', params);
    },
    async getSong(id: string) {
      if (!id) throw new Error('Song ID is required');
      return http.get<any>(`/songs/${id}`);
    },
    async createSong(data: { title: string; artist: string; genre: string; releaseDate: string; coverImage: string; fileUrl: string }) {
      if (!data.title?.trim()) throw new Error('Title is required');
      if (!data.artist?.trim()) throw new Error('Artist is required');
      if (!data.genre?.trim()) throw new Error('Genre is required');
      if (!data.releaseDate) throw new Error('Release date is required');
      if (!data.coverImage?.trim()) throw new Error('Cover image is required');
      if (!data.fileUrl?.trim()) throw new Error('Audio file is required');
      return http.post<any>('/songs', data, { auth: true });
    },
    async updateSong(id: string, data: Partial<{ title: string; artist: string; genre: string; releaseDate: string; coverImage: string }>) {
      if (!id) throw new Error('Song ID is required');
      return http.put<any>(`/songs/${id}`, data, { auth: true });
    },
    async deleteSong(id: string) {
      if (!id) throw new Error('Song ID is required');
      return http.delete<any>(`/songs/${id}`, undefined, { auth: true });
    },
    async playSong(id: string) {
      if (!id) throw new Error('Song ID is required');
      if (shouldSkip(id)) return { ok: true, message: 'play already reported recently' } as any;
      try {
        const res = await http.post<any>(`/songs/${id}/play`);
        mark(id);
        return res;
      } catch (e: any) {
        if (e?.status === 400 || e?.status === 409) { mark(id); return { ok: true, message: 'play deduped' } as any; }
        throw e;
      }
    },
    // Disabled: related endpoint not available (enable via feature flag if backend adds it)
    async getRelatedSongs(_songId: string, _limit = 10) {
      throw new Error('Related songs are not available');
    },

    // Tags
    async getSongTags(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.get<any>(`/tags/song/${songId}`); },
    async addSongTag(songId: string, tag: string) {
      if (!songId) throw new Error('Song ID is required');
      if (!tag?.trim()) throw new Error('Tag is required');
      return http.post<any>(`/tags/song/${songId}`, { tag: tag.trim() });
    },
    async removeSongTag(songId: string, tag: string) {
      if (!songId) throw new Error('Song ID is required');
      if (!tag?.trim()) throw new Error('Tag is required');
      return http.delete<any>(`/tags/song/${songId}`, { tag: tag.trim() });
    },
    async getTopTags() { return http.get<any>('/tags'); },

    // Lyrics
    async getLyrics(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.get<any>(`/lyrics/${songId}`); },
    async getLyricsQuiet(songId: string): Promise<any | null> {
      if (!songId) throw new Error('Song ID is required');
      try {
        const res = await http.request<any>(`/lyrics/${songId}`, {}, { quietStatuses: [404] });
        return (res as any)?.data ?? res ?? null;
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },
    async upsertLyrics(songId: string, lyricsText: string) {
      if (!songId) throw new Error('Song ID is required');
      if (!lyricsText?.trim()) throw new Error('Lyrics text is required');
      return http.put<any>(`/lyrics/${songId}`, { lyricsText: lyricsText.trim() });
    },
    async deleteLyrics(songId: string) { if (!songId) throw new Error('Song ID is required'); return http.delete<any>(`/lyrics/${songId}`); },
  };
};
