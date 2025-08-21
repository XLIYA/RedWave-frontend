// components/PlayerBar.tsx
'use client';

import { useMemo, useState } from 'react';
import { useAudioPlayer } from '@/context/AudioProvider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX,
  X, Heart, MoreHorizontal, Maximize2, Minimize2, Music
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// اکولایزر ساده با pulse (بدون keyframes سفارشی)
function TinyEQ({ active }: { active: boolean }) {
  return (
    <div className={cn('ml-2 flex items-end gap-[3px] h-4', !active && 'opacity-0')}>
      <span className="w-[3px] h-2 rounded-sm bg-red-400/80 animate-pulse" />
      <span className="w-[3px] h-3 rounded-sm bg-red-400/80 animate-pulse [animation-delay:120ms]" />
      <span className="w-[3px] h-2 rounded-sm bg-red-400/80 animate-pulse [animation-delay:240ms]" />
    </div>
  );
}

export default function PlayerBar() {
  const {
    current, isPlaying, togglePlay, next, prev,
    progress, seek, volume, setVolume, muted, toggleMute,
    shuffle, toggleShuffle, repeat, cycleRepeat
  } = useAudioPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const pct = useMemo(
    () => (progress.duration ? (progress.current / progress.duration) * 100 : 0),
    [progress]
  );

  const handleClose = () => {
    setIsVisible(false);
    if (isPlaying) togglePlay();
  };

  const toggleLike = () => {
    setIsLiked((v) => !v);
    // TODO: call like/unlike API
  };

  if (!current || !isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-500',
        // شیشه‌ای هماهنگ + بوردر ملایم
        'bg-gray-950/90 backdrop-blur-xl border-t border-white/10',
        'shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.6)]',
        isExpanded ? 'h-32' : 'h-20'
      )}
      role="region"
      aria-label="Now playing bar"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Glow خیلی ملایم پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-600/5 via-rose-600/10 to-red-600/5" />

      <div className="relative mx-auto max-w-7xl px-6 py-3">
        {/* سطر اصلی */}
        <div className="grid grid-cols-3 items-center gap-6">
          {/* Left: Track Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative group">
              <div
                className={cn(
                  'relative h-16 w-16 overflow-hidden rounded-xl bg-gray-800/50 shadow-lg ring-1 ring-white/10',
                  isPlaying && 'animate-spin',
                )}
                style={isPlaying ? { animationDuration: '6s' } : {}}
              >
                {current.coverImage ? (
                  <img
                    src={current.coverImage}
                    alt={current.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-red-600/30 to-rose-700/40 flex items-center justify-center">
                    <Music className="h-8 w-8 text-red-300/80" />
                  </div>
                )}
              </div>
              {/* رینگ پالس دور کاور وقتی آهنگ پخش می‌شود */}
              {isPlaying && (
                <span className="pointer-events-none absolute inset-0 rounded-xl animate-ping ring-2 ring-red-500/30" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center min-w-0">
                <div className="truncate font-semibold text-white text-sm sm:text-base">
                  {current.title}
                </div>
                <TinyEQ active={isPlaying} />
              </div>
              <div className="truncate text-gray-400 text-xs sm:text-sm mt-0.5">
                {current.artist || 'Unknown Artist'}
              </div>
              {current.genre && (
                <div className="mt-1">
                  <span className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full text-[10px]">
                    {current.genre}
                  </span>
                </div>
              )}
            </div>

            {/* Like */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLike}
                    aria-pressed={isLiked}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    className="h-9 w-9 p-0 hover:bg-red-500/20 transition-all duration-300 group"
                  >
                    <Heart
                      className={cn('h-5 w-5 transition-transform duration-300 group-hover:scale-110', isLiked ? 'text-red-500' : 'text-gray-400')}
                      // پر کردن قلب
                      style={isLiked ? { fill: 'currentColor' } : {}}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900/95 backdrop-blur-xl border-white/10 text-white">
                  {isLiked ? 'Liked' : 'Like'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            {/* Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleShuffle}
                      className={cn(
                        'h-9 w-9 p-0 transition-all duration-300',
                        shuffle ? 'text-red-400 bg-red-500/15 ring-1 ring-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                      aria-pressed={shuffle}
                      aria-label="Shuffle"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">Shuffle</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prev}
                      className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                      aria-label="Previous"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">Previous</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="relative">
                {/* حلقه پالس زیر دکمه پلی وقتی درحال پخش هست */}
                {isPlaying && <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30" />}
                <Button
                  size="lg"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className={cn(
                    'relative h-12 w-12 rounded-full bg-gradient-to-r from-red-600 to-rose-600',
                    'hover:from-red-500 hover:to-rose-500 shadow-lg hover:shadow-red-500/30',
                    'transition-transform duration-300 hover:scale-110',
                    'ring-2 ring-white/20'
                  )}
                >
                  {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
                </Button>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={next}
                      className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                      aria-label="Next"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">Next</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cycleRepeat}
                      className={cn(
                        'h-9 w-9 p-0 transition-all duration-300 relative',
                        repeat !== 'off' ? 'text-red-400 bg-red-500/15 ring-1 ring-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                      aria-label={`Repeat: ${repeat}`}
                    >
                      <Repeat className="h-4 w-4" />
                      {/* نشانگر repeat-one */}
                      {repeat === 'one' && (
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-[10px] leading-4 text-white font-bold">
                          1
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">
                    Repeat: {repeat}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 w-full max-w-xl">
              <span className="text-[11px] font-mono text-gray-400 w-10 sm:w-12 text-right" aria-live="polite">
                {fmt(progress.current)}
              </span>

              <div className="relative flex-1">
                <Slider
                  value={[pct]}
                  onValueChange={([v]) => {
                    const target = (v / 100) * (progress.duration || 0);
                    seek(target);
                  }}
                  className="w-full cursor-pointer"
                  // سفارشی‌سازی ساده: رنگ رِنج و ترک
                  style={
                    {
                      '--slider-track': 'rgb(31 41 55)', // gray-800
                      '--slider-range': 'linear-gradient(to right, rgb(220 38 38), rgb(244 63 94))',
                    } as any
                  }
                  aria-label="Seek"
                />
                {/* Glow روی رنج */}
                <div
                  className="pointer-events-none absolute top-1/2 left-0 h-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full opacity-40 blur-sm transition-all duration-300"
                  style={{ width: `${pct}%`, transform: 'translateY(-50%)' }}
                />
              </div>

              <span className="text-[11px] font-mono text-gray-400 w-10 sm:w-12" aria-live="polite">
                {fmt(progress.duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume & Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">
                    {muted ? 'Unmute' : 'Mute'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Slider
                value={[muted ? 0 : volume]}
                max={1}
                step={0.05}
                onValueChange={([v]) => setVolume(v)}
                className="w-24"
                aria-label="Volume"
              />
            </div>

            {/* More / Expand / Close */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded((v) => !v)}
                    className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                    aria-label={isExpanded ? 'Minimize' : 'Expand'}
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">
                  {isExpanded ? 'Minimize' : 'Expand'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">
                  More options
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-9 w-9 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/15 transition-all duration-300"
                    aria-label="Close player"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900/95 border-white/10 text-white">
                  Close player
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Expanded area */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400">
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
