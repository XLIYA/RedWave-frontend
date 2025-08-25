'use client';

import React, { useState } from 'react';
import { Play, Heart, Plus, MoreHorizontal, Share, Copy, Music2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useAudioPlayer } from '@/context/AudioProvider';
import type { Track } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';

const showToast = (title: string, description?: string, variant?: 'default' | 'destructive') => {
  const msg = description ? `${title}: ${description}` : title;
  if (variant === 'destructive') toast.error(msg);
  else toast(msg);
};

export const TrackCard: React.FC<{
  track: Track;
  index: number;
  viewMode: ViewMode;
  onPlay: (track: Track, index: number) => void;
  onLike: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  isLiked?: boolean;
  showPlayCount?: boolean;
}> = ({ track, index, viewMode, onPlay, onLike, onAddToPlaylist, isLiked = false, showPlayCount }) => {
  const [liked, setLiked] = useState(isLiked);
  const audio = useAudioPlayer();
  const router = useRouter();

  const fmt = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = liked;
    setLiked(!liked);
    try {
      if (!liked) await api.likeSong(track.id);
      else await api.unlikeSong(track.id);
      onLike(track);
    } catch {
      setLiked(prev);
      showToast('Error', 'Failed to update like status', 'destructive');
    }
  };

  const handleAddToPlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToPlaylist(track);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof audio.addToQueue === 'function') {
        audio.addToQueue(track);
      } else {
        // fallback: دستی اضافه کن
        const existing = Array.isArray(audio.queue) ? audio.queue : [];
        const idx = typeof audio.index === 'number' ? audio.index : 0; // 👈 اصلاح: index
        const already = existing.some((t) => t.id === track.id);
        const nextQueue = already ? existing : [...existing, track];
        audio.setQueue(nextQueue, idx);
      }
      showToast('Added to Queue', `${track.title} by ${track.artist}`);
    } catch {
      showToast('Queue not available', 'Player not initialized', 'destructive');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/tracks/${track.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: track.title, text: `Check out "${track.title}" by ${track.artist}`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied', 'Track link copied to clipboard');
    }
  };

  const goToLyrics = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/lyrics/${track.id}`);
  };

  const QuickActions = () => (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onPlay(track, index); }} className="rounded-full" aria-label={`Play ${track.title}`}>
          <Play className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleLike} className="rounded-full" aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleAddToPlaylistClick} className="rounded-full" title="Add to Playlist" aria-label={`Add ${track.title} to playlist`}>
          <Plus className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="rounded-full" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddToQueue}>
              <ListPlus className="h-4 w-4 mr-2" />
              Add to Queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/tracks/${track.id}`); showToast('Link copied'); }}>
              <Copy className="h-4 w-4 mr-2" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={goToLyrics}>
              <Music2 className="h-4 w-4 mr-2" />
              Go to Lyrics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const baseCardClasses =
    'group relative rounded-lg overflow-hidden cursor-pointer ' +
    'border border-border bg-card ' +
    'hover:bg-red-500/5 hover:border-red-500/30 hover:ring-1 hover:ring-red-500/20 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  if (viewMode === 'list') {
    return (
      <div
        className={`${baseCardClasses} flex items-center gap-4 p-3 transition-colors`}
        onClick={() => onPlay(track, index)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onPlay(track, index);
          if (e.key.toLowerCase() === 'l') goToLyrics();
        }}
      >
        <div className="relative">
          {track.coverImage ? (
            <img src={track.coverImage} alt={`${track.title} cover`} className="w-12 h-12 rounded object-cover" loading="lazy" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
              <Play className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{track.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        </div>

        <div className="flex items-center gap-4">
          {track.genre && <Badge variant="secondary" className="text-xs">{track.genre}</Badge>}
          {showPlayCount && (track as any).playCount && <span className="text-xs text-muted-foreground">{(track as any).playCount.toLocaleString()} plays</span>}
          <span className="text-xs text-muted-foreground">{fmt(track.duration)}</span>
        </div>

        <QuickActions />
      </div>
    );
  }

  return (
    <div
      className={`${baseCardClasses} transition-colors`}
      onClick={() => onPlay(track, index)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPlay(track, index);
        if (e.key.toLowerCase() === 'l') goToLyrics();
      }}
    >
      <div className="relative aspect-square">
        {track.coverImage ? (
          <img src={track.coverImage} alt={`${track.title} cover`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <QuickActions />
      </div>

      <div className="p-3">
        <h3 className="font-medium truncate">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {track.genre && <Badge variant="secondary" className="text-xs">{track.genre}</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            {showPlayCount && (track as any).playCount && <span>{(track as any).playCount.toLocaleString()}</span>}
            {track.duration && <span className="ml-2">{fmt(track.duration)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
