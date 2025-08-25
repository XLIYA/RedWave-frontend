// src/components/player/PlayerBar.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX,
  Heart, Music, ChevronUp, ChevronDown, X, Waves, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '@/context/AudioProvider';
import PlayerVisualizer from './PlayerVisualizer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerBarProps {
  showVolumeControl?: boolean;
  showShuffleRepeat?: boolean;
  showLikeButton?: boolean;
  compact?: boolean;
  className?: string;
  accentFrom?: string; // e.g. 'rgb(220 38 38)' // red-600
  accentTo?: string;   // e.g. 'rgb(244 63 94)'  // rose-500
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
}

/** Format seconds as mm:ss */
function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Crossfade presets for quick selection - Use basic CrossfadeCurve types only
const CrossfadePresets = {
  off: { enabled: false, seconds: 0, curve: 'linear' as const },
  quick: { enabled: true, seconds: 3, curve: 'sine' as const },
  smooth: { enabled: true, seconds: 8, curve: 'logarithmic' as const },
  dj: { enabled: true, seconds: 12, curve: 'exponential' as const },
  radio: { enabled: true, seconds: 6, curve: 'custom' as const }, // Changed from smoothstep to custom
  seamless: { enabled: true, seconds: 15, curve: 'sine' as const }, // Changed from psychoacoustic to sine
} as const;

export default function PlayerBar({
  showVolumeControl = true,
  showShuffleRepeat = true,
  showLikeButton = true,
  compact = false,
  className = '',
  accentFrom = 'rgb(220 38 38)',    // red-600
  accentTo = 'rgb(244 63 94)',      // rose-500
  backgroundColor = 'rgba(2,6,23,0.92)', // gray-950/90
  borderColor = 'rgba(255,255,255,0.08)',
  textColor = 'rgb(255,255,255)',
  secondaryTextColor = 'rgb(156,163,175)',
}: PlayerBarProps) {
  const {
    current, isPlaying, togglePlay, next, prev,
    progress, seek, volume, setVolume, muted, toggleMute,
    shuffle, toggleShuffle, repeat, cycleRepeat,

    // Crossfade (from AudioProvider)
    crossfadeEnabled, setCrossfadeEnabled,
    crossfadeSeconds, setCrossfadeSeconds,
    crossfadeCurve, setCrossfadeCurve,
  } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [xfOpen, setXfOpen] = useState(false); // Crossfade dialog open
  const [proMode, setProMode] = useState(false); // Professional mode

  const percent = useMemo(
    () => (progress?.duration ? (progress.current / progress.duration) * 100 : 0),
    [progress]
  );

  // Apply crossfade preset
  const applyPreset = (presetName: keyof typeof CrossfadePresets) => {
    const preset = CrossfadePresets[presetName];
    setCrossfadeEnabled(preset.enabled);
    setCrossfadeSeconds(preset.seconds);
    // Only use curves that are supported by the basic CrossfadeCurve type
    setCrossfadeCurve(preset.curve);
  };

  if (!current || !visible) return null;

  const playerHeight = compact ? 'h-16' : expanded ? 'h-32' : 'h-20';

  return (
    <div
      dir="ltr"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
        'backdrop-blur-xl border-t shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.6)]',
        'text-left',
        playerHeight,
        className
      )}
      style={{
        backgroundColor,
        borderColor,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="region"
      aria-label="Now playing bar"
    >
      {/* Progress – clickable seek line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-pointer"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          seek(ratio * (progress.duration || 0));
        }}
        aria-label="Seek by clicking on progress bar"
      >
        <div
          className="h-full transition-all duration-150 shadow-sm"
          style={{
            width: `${percent}%`,
            backgroundImage: `linear-gradient(to right, ${accentFrom}, ${accentTo})`,
          }}
        />
      </div>

      {/* Main row */}
      <div className="px-3 md:px-4 h-full flex items-center justify-between gap-3 text-sm">
        {/* Left: artwork + meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-white/10 overflow-hidden flex items-center justify-center"
            aria-label="Cover"
          >
            <Music className="w-5 h-5 opacity-70" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate" style={{ color: textColor }}>
              {current.title || 'Untitled'}
            </div>
            <div className="text-xs truncate" style={{ color: secondaryTextColor }}>
              {current.artist || 'Unknown Artist'}
            </div>
          </div>
        </div>

        {/* Center: transport */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleRepeat}
            className={cn(
              'w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/5',
              repeat !== 'off' && 'text-white'
            )}
            aria-label="Repeat"
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-white/5"
            aria-label="Previous"
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            onClick={togglePlay}
            size="sm"
            className="w-9 h-9 p-0 bg-red-600 hover:bg-red-500 text-white rounded-full shadow"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            className="w-8 h-8 p-0 text-gray-300 hover:text-white hover:bg-white/5"
            aria-label="Next"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Shuffle/Repeat (optional) */}
          {showShuffleRepeat && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShuffle}
                className={cn(
                  'w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/5',
                  shuffle && 'text-white'
                )}
                aria-pressed={shuffle}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Right side: time, volume, like, crossfade (dialog), expand, close */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Time */}
          <div className="hidden md:flex items-center gap-1 tabular-nums text-xs" style={{ color: secondaryTextColor }}>
            <span>{formatTime(progress.current)}</span>
            <span>•</span>
            <span>{formatTime(progress.duration)}</span>
          </div>

          {/* Volume */}
          {showVolumeControl && !compact && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                aria-label={muted ? 'Unmute' : 'Mute'}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              <div className="w-24">
                <Slider
                  value={[muted ? 0 : volume]}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => setVolume(v)}
                  className="cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>
          )}

          {/* Like */}
          {showLikeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked((v) => !v)}
              className={cn('w-8 h-8 p-0 hover:bg-white/5', isLiked ? 'text-red-500' : 'text-gray-400')}
              aria-pressed={isLiked}
              aria-label="Like"
              title="Like"
            >
              <Heart className="w-4 h-4" />
            </Button>
          )}

          {/* Crossfade settings icon -> Dialog */}
          <Dialog open={xfOpen} onOpenChange={setXfOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'relative w-8 h-8 p-0 hover:bg-white/5 transition-colors',
                  crossfadeEnabled ? 'text-white' : 'text-gray-400'
                )}
                aria-label="Crossfade settings"
                title="Crossfade"
              >
                <Waves className="w-4 h-4" />
                {crossfadeEnabled && (
                  <span className="absolute -top-0.5 -right-0.5 inline-block w-2 h-2 rounded-full bg-emerald-400" />
                )}
                {proMode && (
                  <Badge className="absolute -bottom-1 -right-1 text-[8px] h-3 px-1 bg-purple-500">
                    PRO
                  </Badge>
                )}
              </Button>
            </DialogTrigger>

            {/* English + LTR modal */}
            <DialogContent className="sm:max-w-2xl text-left" dir="ltr">
              <DialogHeader className="items-start text-left">
                <DialogTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5" />
                  Professional Crossfade
                  <div className="flex items-center gap-1 ml-auto">
                    <Switch
                      checked={proMode}
                      onCheckedChange={setProMode}
                    />
                    <span className="text-sm text-muted-foreground">Pro Mode</span>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Fine-tune how tracks crossfade into each other with professional-grade controls.
                </DialogDescription>
              </DialogHeader>

              {/* Mini visualizer */}
              <div className="rounded-md overflow-hidden bg-black/20">
                <PlayerVisualizer height={80} />
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                {/* Basic Settings */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Crossfade</div>
                    <Button
                      size="sm"
                      onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                      className={cn(
                        'px-3',
                        crossfadeEnabled ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'
                      )}
                      aria-pressed={crossfadeEnabled}
                    >
                      {crossfadeEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>

                  {/* Crossfade Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Duration</span>
                      <span className="font-mono text-red-400">{crossfadeSeconds}s</span>
                    </div>
                    <Slider
                      value={[crossfadeSeconds]}
                      min={1}
                      max={30}
                      step={1}
                      onValueChange={([v]) => setCrossfadeSeconds(v)}
                      aria-label="Crossfade duration"
                    />
                  </div>

                  {/* Basic Curve */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Transition Curve</div>
                    <Select value={crossfadeCurve} onValueChange={(v) => setCrossfadeCurve(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Curve" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="linear">Linear (Equal Volume)</SelectItem>
                        <SelectItem value="logarithmic">Logarithmic (Natural)</SelectItem>
                        <SelectItem value="sine">Equal-Power (Smooth)</SelectItem>
                        <SelectItem value="exponential">Exponential (Quick)</SelectItem>
                        <SelectItem value="custom">S-Curve (Balanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Advanced Settings */}
                <TabsContent value="advanced" className="space-y-4 pt-4">
                  {proMode ? (
                    <>
                      {/* Professional Curves - Only show advanced curves in Pro Mode */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Professional Curves</div>
                        <Select value={crossfadeCurve} onValueChange={(v) => setCrossfadeCurve(v as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Advanced Curve" />
                          </SelectTrigger>
                          <SelectContent align="start">
                            {/* Basic curves always available */}
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="logarithmic">Logarithmic</SelectItem>
                            <SelectItem value="exponential">Exponential</SelectItem>
                            <SelectItem value="sine">Equal-Power (Sine)</SelectItem>
                            <SelectItem value="custom">S-Curve</SelectItem>
                            
                            {/* Advanced curves only in Pro Mode */}
                            {proMode && (
                              <>
                                <SelectItem value="power2">Power² (Gentle)</SelectItem>
                                <SelectItem value="power3">Power³ (Moderate)</SelectItem>
                                <SelectItem value="power4">Power⁴ (Aggressive)</SelectItem>
                                <SelectItem value="smoothstep">Smoothstep (Ultra-smooth)</SelectItem>
                                <SelectItem value="bezier">Bézier Curve (Custom)</SelectItem>
                                <SelectItem value="psychoacoustic">Psychoacoustic (AI-optimized)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pro Features Toggles */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch id="loudness" />
                          <label htmlFor="loudness" className="text-sm">Loudness Match</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="spectral" />
                          <label htmlFor="spectral" className="text-sm">Spectral Crossfade</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="psycho" />
                          <label htmlFor="psycho" className="text-sm">Psychoacoustic</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="beats" />
                          <label htmlFor="beats" className="text-sm">Beat Matching</label>
                        </div>
                      </div>

                      {/* Advanced Sliders */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Target Loudness</span>
                            <span className="font-mono">-14 LUFS</span>
                          </div>
                          <Slider defaultValue={[-14]} min={-23} max={-6} step={1} />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stereo Width</span>
                            <span className="font-mono">100%</span>
                          </div>
                          <Slider defaultValue={[1]} min={0} max={2} step={0.1} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Enable Pro Mode to access advanced features</p>
                      <p className="text-xs">Professional audio processing and psychoacoustic algorithms</p>
                    </div>
                  )}
                </TabsContent>

                {/* Presets */}
                <TabsContent value="presets" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CrossfadePresets).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(key as keyof typeof CrossfadePresets)}
                        className="justify-start text-left h-auto p-3"
                      >
                        <div>
                          <div className="font-medium capitalize">{key}</div>
                          <div className="text-xs text-muted-foreground">
                            {preset.enabled ? `${preset.seconds}s • ${preset.curve}` : 'Disabled'}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="text-left">
                <Button variant="outline" onClick={() => setXfOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setXfOpen(false)}>
                  Apply Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Expand / collapse */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(v => !v)}
            className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>

          {/* Close bar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setVisible(false);
              if (isPlaying) togglePlay();
            }}
            className="w-8 h-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            aria-label="Close player"
            title="Close player"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded area: Enhanced Visualizer + Quick Controls */}
      {expanded && (
        <div className="mt-3 px-3 md:px-4 animate-in slide-in-from-bottom-2 duration-200 space-y-3">
          <PlayerVisualizer height={120} />

          {/* Quick crossfade controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={crossfadeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
                className={cn('transition-all', crossfadeEnabled ? 'bg-red-600 hover:bg-red-500' : '')}
              >
                <Waves className="w-3 h-3 mr-1" />
                {crossfadeEnabled ? 'On' : 'Off'}
              </Button>
              
              {crossfadeEnabled && (
                <Badge variant="outline" className="text-xs">
                  {crossfadeSeconds}s • {crossfadeCurve}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {/* Quick preset buttons */}
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => applyPreset('quick')}
                className="text-xs"
              >
                Quick
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => applyPreset('smooth')}
                className="text-xs"
              >
                Smooth
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => applyPreset('dj')}
                className="text-xs"
              >
                DJ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* bottom accent line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-50"
        style={{ backgroundImage: `linear-gradient(to right, ${accentFrom}, ${accentTo})` }}
      />
    </div>
  );
}