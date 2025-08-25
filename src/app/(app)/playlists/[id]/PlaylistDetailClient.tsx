'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { playTracks } from '@/lib/playerBus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, ChevronLeft, Music2, Clock } from 'lucide-react';
import type { NormalizedTrack } from '@/lib/api/normalize';

type PlaylistDetail = {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  duration?: number | null;

  _count?: { songs?: number | null } | null;
  trackCount?: number | null;
  tracks?: NormalizedTrack[] | null;

  // سازگاری
  songsCount?: number | null;
  items?: any[] | null;
  songs?: any[] | null;
};

const formatDuration = (totalSeconds?: number | null) => {
  if (!totalSeconds && totalSeconds !== 0) return '-';
  const t = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

async function fetchPlaylistDetail(id: string): Promise<PlaylistDetail> {
  const res = await api.getPlaylist(id); // خروجی نرمال شده
  return res as PlaylistDetail;
}

export default function PlaylistDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetchPlaylistDetail(id);
        if (!cancelled) setData(res);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load playlist');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const tracks = data?.tracks ?? [];

  const songCount = useMemo(() => {
    if (!data) return 0;
    const tlen = Array.isArray(data.tracks) ? data.tracks.length : undefined;
    const ilen = Array.isArray(data.items) ? data.items.length : undefined;
    return (
      data.trackCount ??
      data._count?.songs ??
      data.songsCount ??
      tlen ??
      ilen ??
      0
    );
  }, [data]);

  const canPlayAll = tracks.some(t => !!t.audioUrl);

  const handlePlayAll = () => {
    const playable = tracks
      .filter(t => !!t.audioUrl)
      .map(t => ({
        id: t.id, title: t.title, artist: t.artist,
        audioUrl: t.audioUrl as string,
        coverImage: t.coverImage, duration: t.duration
      }));
    if (playable.length > 0) playTracks(playable, 0);
  };

  const handlePlayIndex = (idx: number) => {
    const playable = tracks
      .filter(t => !!t.audioUrl)
      .map(t => ({
        id: t.id, title: t.title, artist: t.artist,
        audioUrl: t.audioUrl as string,
        coverImage: t.coverImage, duration: t.duration
      }));
    if (!playable.length) return;
    // پیدا کردن index متناظر با idx اصلی
    const idAtIdx = tracks[idx]?.id;
    const startIndex = Math.max(0, playable.findIndex(p => p.id === idAtIdx));
    playTracks(playable, startIndex === -1 ? 0 : startIndex);
  };

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto p-6 space-y-6 text-left" dir="ltr">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex gap-6">
            <Skeleton className="h-40 w-40 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass p-4 rounded-lg flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-60 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-5xl mx-auto p-6 text-left" dir="ltr">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert>
          <AlertDescription>{error || 'Playlist not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6 text-left" dir="ltr">
      {/* Header */}
      <div className="glass p-6 rounded-xl card-hover">
        <div className="flex gap-6">
          <div className="relative h-40 w-40 rounded-lg overflow-hidden bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center">
            {data.coverImage ? (
              // @ts-ignore - next/image ok
              <Image
                src={data.coverImage}
                alt={data.name}
                width={320}
                height={320}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music2 className="w-12 h-12 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold gradient-text truncate">{data.name}</h1>
            {data.description ? (
              <p className="text-muted-foreground mt-2 max-w-prose">{data.description}</p>
            ) : (
              <p className="text-muted-foreground mt-2 italic">No description</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
              <span>{songCount.toLocaleString('en-US')} songs</span>
              {data.duration ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(data.duration)}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button className="btn-gradient" onClick={handlePlayAll} disabled={!canPlayAll}>
                <Play className="w-4 h-4 mr-2" />
                Play all
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-2">
        {tracks.length > 0 ? (
          tracks.map((t, idx) => {
            const playable = !!t.audioUrl;
            return (
              <Card key={`${t.id}-${idx}`} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden flex items-center justify-center">
                      {t.coverImage ? (
                        <img
                          src={t.coverImage}
                          alt={t.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-5 h-5 text-white/80" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t.artist}
                        {t.album ? ` • ${t.album}` : ''}
                        {t.genre ? ` • ${t.genre}` : ''}
                        {t.releaseDate ? ` • ${new Date(t.releaseDate).getFullYear()}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(t.duration)}
                      </div>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        disabled={!playable}
                        onClick={() => handlePlayIndex(idx)}
                        title={playable ? 'Play' : 'Audio URL missing'}
                        type="button"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-muted-foreground">No tracks in this playlist.</div>
        )}
      </div>
    </div>
  );
}
