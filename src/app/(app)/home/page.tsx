// app/(app)/home/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Play, TrendingUp, Crown, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Track } from '@/lib/types';
import { useAudioPlayer } from '@/context/AudioProvider'
import { TrackCard } from '@/components/music/TrackCard';

export default function HomePage() {
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'top'>('trending');

  const { setQueue } = useAudioPlayer();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [trending, top] = await Promise.all([
          api.getTrendingSongs({ pageSize: 12 }),
          api.getTopSongs({ pageSize: 12 }),
        ]);
        // API همین حالا fileUrl/coverImage می‌دهد
        setTrendingTracks((trending.items || []) as Track[]);
        setTopTracks((top.items || []) as Track[]);
      } catch (e) {
        setError('Failed to load tracks');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePlay = (track: Track) => {
    const list = activeTab === 'trending' ? trendingTracks : topTracks;
    const idx = Math.max(0, list.findIndex(t => t.id === track.id));
    setQueue(list, idx);
  };

  const handlePlayAll = () => {
    const list = activeTab === 'trending' ? trendingTracks : topTracks;
    if (list.length) setQueue(list, 0);
  };

  if (loading) {
    return <div className="space-y-8"><Skeleton className="h-10 w-64" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
          <Music className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Discover Music</h1>
          <p className="text-muted-foreground">Explore trending tracks and top hits</p>
        </div>
      </div>

      {error && (
        <Alert><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Trending
              <Badge variant="secondary" className="ml-1">{trendingTracks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="top" className="flex items-center gap-2">
              <Crown className="h-4 w-4" /> Top Hits
              <Badge variant="secondary" className="ml-1">{topTracks.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <Button onClick={handlePlayAll}><Play className="h-4 w-4 mr-2" /> Play All</Button>
        </div>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingTracks.map((t) => (
              <TrackCard key={t.id} track={t} onPlay={handlePlay} showPlayCount />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topTracks.map((t) => (
              <TrackCard key={t.id} track={t} onPlay={handlePlay} showPlayCount />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
