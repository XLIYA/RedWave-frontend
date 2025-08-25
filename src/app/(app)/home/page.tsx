'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Play, Grid3X3, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { api } from '@/lib/api';
import type { Track } from '@/lib/types';
import { toast } from 'sonner';
import { useAudioPlayer } from '@/context/AudioProvider';
import { AddToPlaylistDialog } from '@/components/music/AddToPlaylistDialog';

import { FilterBar } from './components/FilterBar';
import { TrackCard } from './components/TrackCard';

type TabKey = 'trending' | 'top';
type ViewMode = 'grid' | 'list';

const FALLBACK_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical'];
const STORAGE_KEYS = {
  activeTab: 'home-active-tab',
  viewMode: 'home-view-mode',
  trendingParams: 'home-trending-params',
  topParams: 'home-top-params',
};

const showToast = (title: string, description?: string, variant?: 'default' | 'destructive') => {
  const msg = description ? `${title}: ${description}` : title;
  if (variant === 'destructive') toast.error(msg);
  else toast(msg);
};

const GridSkeleton: React.FC<{ viewMode: ViewMode }> = ({ viewMode }) => {
  const items = Array.from({ length: 12 }, (_, i) => i);
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {items.map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState: React.FC<{ onReload: () => void; message?: string }> = ({ onReload, message = 'No tracks found' }) => (
  <div className="flex flex-col items-start justify-center py-16 text-left">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <Play className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">{message}</h3>
    <p className="text-muted-foreground mb-4">Try adjusting your filters or reload the page</p>
    <Button onClick={onReload} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Reload
    </Button>
  </div>
);

export default function HomePage() {
  const { playTrack } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<TabKey>('trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  const [trendingParams, setTrendingParams] = useState<{ windowDays: number; minPlays: number; genre?: string; }>({ windowDays: 14, minPlays: 0, genre: undefined });
  const [topParams, setTopParams] = useState<{ timeRange: 'all' | 'week' | 'month' | 'year'; genre?: string; }>({ timeRange: 'all', genre: undefined });

  const [tags, setTags] = useState<string[]>(FALLBACK_GENRES);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // --- NEW: ping animation state for Play All
  const [ping, setPing] = useState(false);
  const onPlayAllClick = useCallback(() => {
    setPing(true);
    setTimeout(() => setPing(false), 600); // one-shot ripple
    // call original action
    const list = activeTab === 'trending' ? trendingTracks : topTracks;
    if (!list.length) return;
    playTrack(list[0], list);
    api.playSong(list[0].id).catch(() => {});
  }, [activeTab, trendingTracks, topTracks, playTrack]);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab) as TabKey;
      const savedViewMode = localStorage.getItem(STORAGE_KEYS.viewMode) as ViewMode;
      const savedTrendingParams = localStorage.getItem(STORAGE_KEYS.trendingParams);
      const savedTopParams = localStorage.getItem(STORAGE_KEYS.topParams);
      if (savedTab) setActiveTab(savedTab);
      if (savedViewMode) setViewMode(savedViewMode);
      if (savedTrendingParams) setTrendingParams(JSON.parse(savedTrendingParams));
      if (savedTopParams) setTopParams(JSON.parse(savedTopParams));
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.activeTab, activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.viewMode, viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.trendingParams, JSON.stringify(trendingParams)); }, [trendingParams]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.topParams, JSON.stringify(topParams)); }, [topParams]);

  useEffect(() => {
    if (!query.trim()) { setSearchSuggestions([]); setShowSuggestions(false); return; }
    const t = setTimeout(async () => {
      try { setSearchSuggestions(await api.getSearchSuggestions(query, 5) || []); setShowSuggestions(true); }
      catch { setSearchSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const results = await Promise.allSettled([
        api.getTrendingSongs({ pageSize: 12, ...trendingParams }),
        api.getTopSongs({ pageSize: 12, ...topParams }),
        api.getTopTags(),
      ]);
      const [trRes, topRes, tagRes] = results;
      if (trRes.status === 'fulfilled') setTrendingTracks((trRes.value as any)?.items || []);
      if (topRes.status === 'fulfilled') setTopTracks((topRes.value as any)?.items || []);
      if (tagRes.status === 'fulfilled' && (tagRes.value as any)?.length) setTags(tagRes.value as any);
      if (results.every((r) => r.status === 'rejected')) setError('Failed to load music data. Please try again.');
    } catch { setError('Failed to load music data. Please try again.'); }
    finally { setLoading(false); }
  }, [trendingParams, topParams]);

  useEffect(() => { fetchInitialData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTabData = useCallback(async (tab: TabKey) => {
    try {
      if (tab === 'trending') {
        const data = await api.getTrendingSongs({ pageSize: 12, ...trendingParams });
        setTrendingTracks((data as any)?.items || []);
      } else {
        const data = await api.getTopSongs({ pageSize: 12, ...topParams });
        setTopTracks((data as any)?.items || []);
      }
    } catch { showToast('Error', `Failed to load ${tab} tracks`, 'destructive'); }
  }, [trendingParams, topParams]);

  useEffect(() => { if (!loading) fetchTabData('trending'); }, [trendingParams, fetchTabData, loading]);
  useEffect(() => { if (!loading) fetchTabData('top'); }, [topParams, fetchTabData, loading]);

  const handlePlayTrack = useCallback(async (track: Track, _index: number) => {
    const list = activeTab === 'trending' ? trendingTracks : topTracks;
    playTrack(track, list);
    try { await api.playSong(track.id).catch(() => {}); } catch {}
  }, [activeTab, trendingTracks, topTracks, playTrack]);

  const handlePlayAll = useCallback(async () => {
    const list = activeTab === 'trending' ? trendingTracks : topTracks;
    if (!list.length) return;
    playTrack(list[0], list);
    try { await api.playSong(list[0].id).catch(() => {}); } catch {}
  }, [activeTab, trendingTracks, topTracks, playTrack]);

  const handleLikeTrack = useCallback((_track: Track) => {}, []);
  const handleAddToPlaylist = useCallback((track: Track) => {
    setSelectedTrackForPlaylist(track);
    setPlaylistDialogOpen(true);
  }, []);

  const currentTracks = useMemo(() => {
    const tracks = activeTab === 'trending' ? trendingTracks : topTracks;
    if (!query.trim()) return tracks;
    const q = query.toLowerCase();
    return tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre?.toLowerCase().includes(q)
    );
  }, [activeTab, trendingTracks, topTracks, query]);

  const isPlayAllDisabled = loading || currentTracks.length === 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl text-left">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Discover Music</h1>
        {/* (SEARCH REMOVED FROM HEADER) */}
      </div>

      {/* Error Banner */}
      {error && (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchInitialData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs & Top Bar */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <div className="flex items-center justify-between mb-6 gap-3">
          {/* Left: Search + Tabs (search pinned left) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks, artists, genres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-20">
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => { setQuery(s); setShowSuggestions(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <TabsList className="shrink-0">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="top">Top Hits</TabsTrigger>
            </TabsList>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* --- NEW: Play All with lighter color + animations --- */}
            <div className="relative group shrink-0">
              {ping && (
                <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping pointer-events-none" />
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onPlayAllClick}
                disabled={isPlayAllDisabled}
                aria-label={`Play all ${activeTab} tracks`}
                title="Play All"
                className="
                  rounded-full h-9 w-9 px-0 aspect-square
                  bg-rose-500 hover:bg-rose-400 text-white
                  ring-1 ring-rose-300/60 hover:ring-rose-200/80
                  shadow-sm hover:shadow-md
                  transition-all duration-300
                  hover:scale-105 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Play className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
              <span className="pointer-events-none absolute inset-0 rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300 bg-rose-400/40" />
            </div>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className="rounded-r-none"
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className="rounded-l-none"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-x-auto">
          <FilterBar
            activeTab={activeTab}
            trendingParams={trendingParams}
            topParams={topParams}
            tags={tags}
            onTrendingChange={setTrendingParams}
            onTopChange={setTopParams}
          />
        </div>

        {/* Trending */}
        <TabsContent value="trending" className="mt-0">
          {loading ? (
            <GridSkeleton viewMode={viewMode} />
          ) : currentTracks.length === 0 ? (
            <EmptyState onReload={() => fetchTabData('trending')} message="No trending tracks found" />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-1'}>
              {currentTracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  viewMode={viewMode}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Top */}
        <TabsContent value="top" className="mt-0">
          {loading ? (
            <GridSkeleton viewMode={viewMode} />
          ) : currentTracks.length === 0 ? (
            <EmptyState onReload={() => fetchTabData('top')} message="No top hits found" />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-1'}>
              {currentTracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  viewMode={viewMode}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        track={selectedTrackForPlaylist}
      />
    </div>
  );
}
