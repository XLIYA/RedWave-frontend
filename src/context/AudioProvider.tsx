// context/AudioProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Track } from '@/lib/types';

type RepeatMode = 'off' | 'one' | 'all';

interface Progress {
  current: number;
  duration: number;
  buffered: number;
}

interface AudioCtx {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: Progress;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const AudioContext = createContext<AudioCtx | null>(null);

// توجه: BASE بدون /api است چون فایل‌های صوتی زیر /uploads سرو می‌شوند
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const PLAY_ENDPOINT_BASE = `${API_BASE}/api`;

function toAbsolute(url: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

// پشتیبانی از هر دو مدل داده
function normalizeTrack(t: Partial<Track>): Track {
  const fileUrl = t.fileUrl || (t as any).audioUrl || '';
  const coverImage = t.coverImage || (t as any).cover || '';
  return {
    id: String(t.id),
    title: t.title || '',
    artist: t.artist || '',
    genre: t.genre,
    duration: t.duration || 0,
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt,
    coverImage,
    fileUrl,
    analytics: t.analytics,
    _count: t._count,
    uploadedBy: t.uploadedBy,
    liked: t.liked,
    likedAt: t.likedAt,
    addedAt: t.addedAt,
    releaseDate: (t as any).releaseDate,
    format: (t as any).format,
  } as Track;
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [progress, setProgress] = useState<Progress>({ current: 0, duration: 0, buffered: 0 });
  const [mounted, setMounted] = useState(false);

  const current = queue[index] ?? null;

  // جلوگیری از گزارش چندبارهٔ play
  const reportedPlayRef = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);

  // بازیابی حجم/بی‌صدا از localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem('rw_volume');
      if (v) setVolumeState(Math.min(1, Math.max(0, parseFloat(v))));
      const m = localStorage.getItem('rw_muted');
      if (m) setMuted(m === '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('rw_volume', String(volume));
      localStorage.setItem('rw_muted', muted ? '1' : '0');
    } catch {}
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  // بارگذاری ترک جدید
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!current) {
      setIsPlaying(false);
      return;
    }

    const n = normalizeTrack(current);
    let src = toAbsolute(n.fileUrl);
    audio.src = src;
    audio.load();
    reportedPlayRef.current = null;

    const tryPlay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Autoplay ممنوع → تا کلیک کاربر صبر می‌کنیم
        setIsPlaying(false);
      }
    };
    tryPlay();
  }, [current?.id]);

  // لیسنرهای Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setProgress(p => ({ ...p, duration: audio.duration || 0 }));
    };

    const onTimeUpdate = () => {
      const buffered = audio.buffered?.length ? audio.buffered.end(audio.buffered.length - 1) : 0;
      setProgress({
        current: audio.currentTime || 0,
        duration: audio.duration || 0,
        buffered: buffered || 0,
      });

      // گزارش اولین شروع واقعی پخش
      if (current && !audio.paused && reportedPlayRef.current !== current.id && audio.currentTime > 0.2) {
        reportedPlayRef.current = current.id;
        fetch(`${PLAY_ENDPOINT_BASE}/songs/${current.id}/play`, { method: 'POST' }).catch(() => {});
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      if (shuffle && queue.length > 1) {
        let nextIdx = index;
        while (nextIdx === index) nextIdx = Math.floor(Math.random() * queue.length);
        setIndex(nextIdx);
        return;
      }
      if (index < queue.length - 1) setIndex(i => i + 1);
      else if (repeat === 'all' && queue.length > 0) setIndex(0);
      else setIsPlaying(false);
    };

    const onError = () => {
      // خطاهای شبکه/کدک → فقط وضعیت را به‌روز کن
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [current?.id, queue.length, index, repeat, shuffle]);

  const api = useMemo<AudioCtx>(() => ({
    queue,
    index,
    current,
    isPlaying,
    volume,
    muted,
    shuffle,
    repeat,
    progress,

    setQueue: (tracks, startIndex = 0) => {
      const norm = tracks.map(normalizeTrack);
      setQueueState(norm);
      setIndex(Math.max(0, Math.min(startIndex, norm.length - 1)));
    },
    playTrack: (track, maybeQueue) => {
      const normTrack = normalizeTrack(track);
      if (maybeQueue?.length) {
        const normQueue = maybeQueue.map(normalizeTrack);
        const startIdx = Math.max(0, normQueue.findIndex(t => t.id === normTrack.id));
        setQueueState(normQueue);
        setIndex(startIdx === -1 ? 0 : startIdx);
      } else {
        setQueueState([normTrack]);
        setIndex(0);
      }
    },
    togglePlay: () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    },
    play: () => audioRef.current?.play().catch(() => {}),
    pause: () => audioRef.current?.pause(),
    next: () => {
      if (shuffle) {
        if (queue.length <= 1) return;
        let nextIdx = index;
        while (nextIdx === index) nextIdx = Math.floor(Math.random() * queue.length);
        setIndex(nextIdx);
        return;
      }
      if (index < queue.length - 1) setIndex(i => i + 1);
      else if (repeat === 'all' && queue.length > 0) setIndex(0);
    },
    prev: () => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
      if (index > 0) setIndex(i => i - 1);
      else if (repeat === 'all' && queue.length > 0) setIndex(queue.length - 1);
    },
    seek: (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
    },
    setVolume: (v: number) => setVolumeState(Math.max(0, Math.min(v, 1))),
    toggleMute: () => setMuted(m => !m),
    toggleShuffle: () => setShuffle(s => !s),
    cycleRepeat: () => setRepeat(r => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
  }), [queue, index, current, isPlaying, volume, muted, shuffle, repeat, progress]);

  return (
    <AudioContext.Provider value={api}>
      {children}
      {mounted && <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />}
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within <AudioProvider>');
  return ctx;
}
