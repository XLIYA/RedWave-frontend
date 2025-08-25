import { http as _default } from '../http';
type HTTP = typeof _default;

export default (http: HTTP) => ({
  async search(params: { q: string; scope?: 'songs' | 'users' | 'playlists'; page?: number; pageSize?: number; searchType?: 'standard' | 'similarity' }) {
    if (!params.q || params.q.trim().length === 0) throw new Error('Search query is required');
    if (params.q.length > 200) throw new Error('Search query too long');
    // similarity → standard fallback
    const url = new URL('/api/search', window.location.origin);
    url.searchParams.set('q', params.q);
    if (params.scope) url.searchParams.set('scope', params.scope);
    if (params.page) url.searchParams.set('page', String(params.page));
    if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize));
    url.searchParams.set('searchType', params.searchType ?? 'similarity');

    let res = await fetch(url.toString());
    if (res.ok) return res.json();
    if ((params.searchType ?? 'similarity') !== 'standard') {
      url.searchParams.set('searchType', 'standard');
      res = await fetch(url.toString());
      if (res.ok) {
        try { (window as any).toast?.info?.('Switched to standard search'); } catch {}
        return res.json();
      }
    }
    throw new Error('Search failed');
  },
  async getSearchSuggestions(q: string, limit = 10) {
    if (!q || q.trim().length < 2) return [];
    if (limit < 1 || limit > 20) limit = 10;
    try {
      const res = await http.request<any>(`/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`);
      return (res as any).suggestions || [];
    } catch { return []; }
  },
  // Disabled: recommendations replaced by authenticated /api/feed
  async getRecommendations(_params?: { type?: 'songs' | 'artists' | 'playlists'; limit?: number; basedOn?: 'likes' | 'listening_history' | 'similar_users' }) {
    throw new Error('Recommendations API is disabled');
  },
});
