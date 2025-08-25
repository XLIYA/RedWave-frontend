import type { Track as BaseTrack } from '@/lib/types';

export type RepeatMode = 'off' | 'one' | 'all';
export type ActiveAB = 'A' | 'B';
export type CrossfadeCurve = 'linear' | 'logarithmic' | 'exponential' | 'sine' | 'custom';

export interface Progress {
  current: number;
  duration: number;
  buffered: number;
}

export type Track = BaseTrack;

export interface AudioCtx {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  volume: number;      // 0..1
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: Progress;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track, playIfIdle?: boolean) => void;
  playTrack: (track: Track, queue?: Track[]) => void;

  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void; // 0..1
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // Crossfade controls
  crossfadeEnabled: boolean;
  crossfadeSeconds: number;
  crossfadeCurve: CrossfadeCurve;
  setCrossfadeEnabled: (on: boolean) => void;
  setCrossfadeSeconds: (sec: number) => void;
  setCrossfadeCurve: (c: CrossfadeCurve) => void;

  // Visualizer
  analyser: AnalyserNode | null;
}
