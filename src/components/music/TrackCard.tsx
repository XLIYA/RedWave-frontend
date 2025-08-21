'use client';

import { useState, useMemo } from 'react';
import { Play, Pause, Music, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Track } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';
import { useAudioPlayer } from '@/context/AudioProvider';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface TrackCardProps {
  track: Track;
  showAddedDate?: boolean;
  showPlayCount?: boolean;
  onPlay?: (track: Track) => void;
  onPause?: () => void;
  onLike?: (track: Track) => Promise<void>;
  onAddToPlaylist?: (track: Track) => void;
  className?: string;
  /** سایز آیکن پلی/پاز (px) */
  iconSize?: number;
  /** نسخه‌ی فشرده‌تر کارت */
  compact?: boolean;
  /** گوشه‌ی قرارگیری دکمه‌ی پلی/پاز */
  playButtonCorner?: Corner;
}

export function TrackCard(props: TrackCardProps) {
  const {
    track,
    showAddedDate = false,
    showPlayCount = false,
    onPlay,
    onPause,
    onLike,
    onAddToPlaylist,
    className,
    iconSize = 18,
    compact = false,
    playButtonCorner = 'bottom-right',
  } = props;

  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(track.liked || false);
  const [likeCount, setLikeCount] = useState(track._count?.likes || 0);
  const [isLiking, setIsLiking] = useState(false);

  const { user } = useAuth();
  const { current, isPlaying, playTrack, togglePlay } = useAudioPlayer();
  const isCurrentTrack = current?.id === track.id;

  // اندازه‌ها بر اساس compact
  const sizes = useMemo(() => {
    return compact
      ? {
          playBtn: 'w-8 h-8',
          likeBtn: 'w-7 h-7',
          likeIcon: 'w-3.5 h-3.5',
          statIcon: 'w-3 h-3',
          title: 'text-sm',
          artist: 'text-[11px]',
          statsText: 'text-[10px]',
          badge: 'text-[10px] px-2 py-0.5',
        }
      : {
          playBtn: 'w-9 h-9',
          likeBtn: 'w-8 h-8',
          likeIcon: 'w-4 h-4',
          statIcon: 'w-3.5 h-3.5',
          title: 'text-sm',
          artist: 'text-xs',
          statsText: 'text-xs',
          badge: 'text-xs px-2 py-1',
        };
  }, [compact]);

  // موقعیت گوشه‌ها
  const cornerClass: Record<Corner, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  // اگر پلی در سمت راست است، قلب را به سمت چپ ببریم تا هم‌پوشانی نشود
  const likeCorner =
    playButtonCorner.endsWith('right') ? (playButtonCorner.startsWith('top') ? 'top-left' : 'top-left') : (playButtonCorner.startsWith('top') ? 'top-right' : 'top-right');
  const likeCornerClass = cornerClass[likeCorner as Corner];

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCurrentTrack) {
      if (isPlaying) {
        togglePlay();
        onPause?.();
      } else {
        togglePlay();
        onPlay?.(track);
      }
    } else {
      const normalized = {
        ...track,
        audioUrl: (track as any).audioUrl || track.fileUrl,
        cover: (track as any).cover || track.coverImage,
      };
      playTrack(normalized as Track);
      onPlay?.(track);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking || !user) return;
    setIsLiking(true);
    try {
      if (onLike) {
        await onLike(track);
      } else {
        if (isLiked) {
          await api.unlikeSong(track.id);
          setIsLiked(false);
          setLikeCount((p) => Math.max(0, p - 1));
        } else {
          await api.likeSong(track.id);
          setIsLiked(true);
          setLikeCount((p) => p + 1);
        }
      }
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-500 cursor-pointer',
        'bg-gray-950/80 backdrop-blur-xl border border-gray-800/60',
        'hover:bg-gray-950/90 hover:border-red-600/60 hover:shadow-xl hover:shadow-red-600/20',
        'transform hover:scale-[1.02] hover:-translate-y-1',
        isCurrentTrack && 'ring-2 ring-red-600/80 shadow-lg shadow-red-600/30 bg-gray-950/90',
        className
      )}
    >
      <CardContent className="p-0">
        {/* Cover */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/8 to-rose-700/12 animate-pulse opacity-60" />

          {track.coverImage && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.coverImage}
              alt={track.title}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-600/30 to-rose-700/40 flex items-center justify-center">
              <Music className="w-10 h-10 text-red-300/80 group-hover:scale-110 transition-transform duration-300" />
            </div>
          )}

          {/* ثابت: دکمه‌ی Play/Pause در گوشه */}
          <div className={cn('absolute z-10', cornerClass[playButtonCorner])}>
            <Button
              size="icon"
              aria-label={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
              className={cn(
                sizes.playBtn,
                'rounded-full bg-black/55 text-white border border-white/20 backdrop-blur-sm',
                'hover:bg-red-600/80 hover:border-red-300/40 transition-colors'
              )}
              onClick={handlePlayClick}
            >
              {isCurrentTrack && isPlaying ? (
                <Pause size={iconSize} />
              ) : (
                <Play size={iconSize} />
              )}
            </Button>
          </div>

          {/* حلقه‌ی پخش برای ترک جاری */}
          {isCurrentTrack && isPlaying && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-1 border-2 border-red-600/70 rounded-lg animate-pulse shadow-lg shadow-red-600/30" />
              <div className="absolute inset-3 border border-red-500/50 rounded-lg animate-ping" />
            </div>
          )}

          {/* Like (همیشه ثابت، با جابه‌جایی خودکار برای عدم تداخل) */}
          {user && (
            <div className={cn('absolute z-10', likeCornerClass)}>
              <Button
                size="icon"
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                className={cn(
                  sizes.likeBtn,
                  'p-0 rounded-full bg-black/40 backdrop-blur-sm',
                  'text-white border border-white/20 hover:bg-red-500/80 transition-all'
                )}
                onClick={handleLikeClick}
                disabled={isLiking}
                variant="ghost"
              >
                <Heart
                  className={cn(sizes.likeIcon)}
                  strokeWidth={2}
                  fill={isLiked ? 'currentColor' : 'none'}
                  color={isLiked ? '#ef4444' : 'currentColor'}
                />
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className={cn('font-medium text-white leading-tight truncate group-hover:text-red-300 transition-colors duration-300', sizes.title)}>
              {track.title}
            </h3>
            <p className={cn('text-gray-400 truncate group-hover:text-gray-200 transition-colors duration-300', sizes.artist)}>
              {(track.artist as any)?.name || (track as any).artistName || 'Unknown Artist'}
            </p>
          </div>

          {/* Stats */}
          <div className={cn('flex items-center justify-between', sizes.statsText)}>
            <div className="flex items-center gap-3 text-gray-500">
              {likeCount > 0 && (
                <div className="flex items-center gap-1">
                  <Heart className={cn(sizes.statIcon, 'text-red-400')} fill="currentColor" />
                  <span>{formatNumber(likeCount)}</span>
                </div>
              )}
              {showPlayCount && (track._count as any)?.plays && (
                <div className="flex items-center gap-1">
                  <Play className={cn(sizes.statIcon, 'text-green-400')} />
                  <span>{formatNumber((track._count as any).plays)}</span>
                </div>
              )}
            </div>

            {track.genre && (
              <span className={cn('bg-red-600/25 text-red-300 rounded-full border border-red-600/30', sizes.badge)}>
                {track.genre}
              </span>
            )}
          </div>

          {isCurrentTrack && (
            <div className="w-full bg-gray-800/60 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-rose-700 rounded-full animate-pulse w-3/4 shadow-lg shadow-red-600/40" />
            </div>
          )}

          {showAddedDate && track.createdAt && (
            <p className={cn('text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300', compact ? 'text-[10px]' : 'text-xs')}>
              {new Date(track.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
