'use client';

import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState
} from 'react';
import type { AudioCtx, Progress, RepeatMode, ActiveAB, Track, CrossfadeCurve } from './types';
import { DEFAULTS, LS, PLAY_ENDPOINT_BASE } from './constants';
import { EVENTS } from '@/lib/playerBus';
import { api } from '@/lib/api';
import { clamp01, toAbsolute, normalizeTrack, getNextIndex } from './helpers';
import { ensureAudioGraph } from './graph';
import { preloadStandbyNext, performCrossfadeTo } from '../crossfade';

const Ctx = createContext<AudioCtx | null>(null);

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  // ---------- State عمومی
  const [queue, setQueueState] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const current = queue[index] ?? null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState<boolean>(() => {
    try { return localStorage.getItem(LS.SHUFFLE) === '1'; } catch { return false; }
  });
  const [repeat, setRepeat] = useState<RepeatMode>(() => {
    try {
      const r = localStorage.getItem(LS.REPEAT) as RepeatMode | null;
      return r === 'one' || r === 'all' ? r : 'off';
    } catch { return 'off'; }
  });

  const [progress, setProgress] = useState<Progress>({ current: 0, duration: 0, buffered: 0 });
  const reportedPlayRef = useRef<string | null>(null);

  // ---------- Volume / Mute
  const [volume, setVolumeState] = useState<number>(() => {
    try { return clamp01(parseFloat(localStorage.getItem(LS.VOL) || `${DEFAULTS.VOLUME}`)); }
    catch { return DEFAULTS.VOLUME; }
  });
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem(LS.MUTED) === '1'; } catch { return false; }
  });

  // ---------- Crossfade
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(LS.XF_ON) !== '0'; } catch { return true; }
  });
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(() => {
    try { return Math.max(0, parseInt(localStorage.getItem(LS.XF_SEC) || `${DEFAULTS.CROSSFADE_SEC}`, 10)); }
    catch { return DEFAULTS.CROSSFADE_SEC; }
  });
  const [crossfadeCurve, setCrossfadeCurve] = useState<CrossfadeCurve>(() => {
    try {
      const v = (localStorage.getItem(LS.XF_CURVE) || DEFAULTS.CROSSFADE_CURVE) as CrossfadeCurve;
      return ['linear', 'logarithmic', 'exponential', 'sine', 'custom'].includes(v) ? v : DEFAULTS.CROSSFADE_CURVE;
    } catch {
      return DEFAULTS.CROSSFADE_CURVE;
    }
  });

  // ---------- WebAudio refs
  const acRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const aRef = useRef<HTMLAudioElement | null>(null);
  const bRef = useRef<HTMLAudioElement | null>(null);
  const srcARef = useRef<MediaElementAudioSourceNode | null>(null);
  const srcBRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);

  const [active, setActive] = useState<ActiveAB>('A');
  const activeAudio = active === 'A' ? aRef : bRef;
  const standbyAudio = active === 'A' ? bRef : aRef;
  const activeGain = active === 'A' ? gainARef : gainBRef;
  const standbyGain = active === 'A' ? gainBRef : gainARef;

  // ---------- Bootstrap graph
  useEffect(() => {
    const ac = ensureAudioGraph(
      {
        acRef, masterGainRef, analyserRef,
        aRef, bRef, srcARef, srcBRef, gainARef, gainBRef
      },
      { volume, muted }
    );

    const attach = (el: HTMLAudioElement) => {
      const onLoadedMetadata = () => setProgress(p => ({ ...p, duration: el.duration || 0 }));
      const onTimeUpdate = () => {
        const buffered = el.buffered?.length ? el.buffered.end(el.buffered.length - 1) : 0;
        setProgress({
          current: el.currentTime || 0,
          duration: el.duration || 0,
          buffered: buffered || 0,
        });
        const curId = current?.id;
        if (curId && !el.paused && reportedPlayRef.current !== curId && el.currentTime > 0.2) {
          reportedPlayRef.current = curId;
          fetch(`${PLAY_ENDPOINT_BASE}/songs/${curId}/play`, { method: 'POST' })
            .then(async (r) => {
              if (!r.ok) return;
              try { await r.json(); } catch {}
            })
            .catch(() => { });
        }
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      el.addEventListener('loadedmetadata', onLoadedMetadata);
      el.addEventListener('timeupdate', onTimeUpdate);
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      return () => {
        el.removeEventListener('loadedmetadata', onLoadedMetadata);
        el.removeEventListener('timeupdate', onTimeUpdate);
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
      };
    };

    const detachA = attach(aRef.current!);
    const detachB = attach(bRef.current!);
    return () => { detachA(); detachB(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- persist
  useEffect(() => { try { localStorage.setItem(LS.VOL, String(volume)); } catch { } }, [volume]);
  useEffect(() => { try { localStorage.setItem(LS.MUTED, muted ? '1' : '0'); } catch { } }, [muted]);
  useEffect(() => { if (masterGainRef.current) masterGainRef.current.gain.value = muted ? 0 : clamp01(volume); }, [volume, muted]);

  useEffect(() => { try { localStorage.setItem(LS.SHUFFLE, shuffle ? '1' : '0'); } catch { } }, [shuffle]);
  useEffect(() => { try { localStorage.setItem(LS.REPEAT, repeat); } catch { } }, [repeat]);
  useEffect(() => { try { localStorage.setItem(LS.XF_ON, crossfadeEnabled ? '1' : '0'); } catch { } }, [crossfadeEnabled]);
  useEffect(() => { try { localStorage.setItem(LS.XF_SEC, String(crossfadeSeconds)); } catch { } }, [crossfadeSeconds]);
  useEffect(() => { try { localStorage.setItem(LS.XF_CURVE, crossfadeCurve); } catch { } }, [crossfadeCurve]);

  // ---------- بارگذاری ترک روی کانال فعال
  useEffect(() => {
    const el = activeAudio.current;
    if (!el) return;

    if (!current?.fileUrl) {
      setIsPlaying(false);
      el.pause();
      return;
    }

    const src = toAbsolute(current.fileUrl);
    el.src = src;
    el.load();
    reportedPlayRef.current = null;

    const tryPlay = async () => {
      try { await acRef.current?.resume(); } catch { }
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };
    tryPlay();

    const nextIdx = getNextIndex(queue, index, { dir: 1, shuffle, repeat });
    preloadStandbyNext({
      queue, index, nextIndex: nextIdx, standbyAudio: standbyAudio.current
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, active]);

  // ---------- کراس‌فید خودکار نزدیک پایان
  useEffect(() => {
    const el = activeAudio.current;
    if (!el) return;

    let raf = 0;
    const tick = () => {
      if (!isPlaying || !crossfadeEnabled || crossfadeSeconds <= 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dur = el.duration || 0;
      const cur = el.currentTime || 0;
      if (dur > 0 && cur > 0) {
        const remain = dur - cur;
        if (remain <= crossfadeSeconds + 0.05) {
          const nextIdx = getNextIndex(queue, index, { dir: 1, shuffle, repeat });
          if (nextIdx !== index) {
            performCrossfadeTo({
              toIndex: nextIdx,
              queue,
              crossfadeEnabled,
              fadeSeconds: crossfadeSeconds,
              curve: crossfadeCurve,
              active,
              setActive,
              setIndex,
              ac: acRef.current!,
              masterGain: masterGainRef.current!, // ✅ اضافه شد
              activeAudio: activeAudio.current!,
              standbyAudio: standbyAudio.current!,
              activeGain: activeGain.current!,
              standbyGain: standbyGain.current!,
            }).catch(() => { });
            cancelAnimationFrame(raf);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, crossfadeEnabled, crossfadeSeconds, crossfadeCurve, index, queue.length, active, shuffle, repeat]);

  // ---------- Controls
  const togglePlay = async () => {
    const el = activeAudio.current;
    if (!el) return;
    try { await acRef.current?.resume(); } catch { }
    if (el.paused) el.play().catch(() => { }); else el.pause();
  };
  const play = () => activeAudio.current?.play().catch(() => { });
  const pause = () => activeAudio.current?.pause();

  const next = () => {
    const nextIdx = getNextIndex(queue, index, { dir: 1, shuffle, repeat });
    if (nextIdx === index) return;
    performCrossfadeTo({
      toIndex: nextIdx,
      queue,
      crossfadeEnabled,
      fadeSeconds: crossfadeSeconds,
      curve: crossfadeCurve,
      active, setActive, setIndex,
      ac: acRef.current!,
      masterGain: masterGainRef.current!, // ✅ اضافه شد
      activeAudio: activeAudio.current!,
      standbyAudio: standbyAudio.current!,
      activeGain: activeGain.current!,
      standbyGain: standbyGain.current!,
    }).catch(() => { });
  };

  const prev = () => {
    const el = activeAudio.current;
    if (el && el.currentTime > 3) { el.currentTime = 0; return; }
    const prevIdx = getNextIndex(queue, index, { dir: -1, shuffle, repeat });
    if (prevIdx === index) { el && (el.currentTime = 0); return; }
    performCrossfadeTo({
      toIndex: prevIdx,
      queue,
      crossfadeEnabled,
      fadeSeconds: crossfadeSeconds,
      curve: crossfadeCurve,
      active, setActive, setIndex,
      ac: acRef.current!,
      masterGain: masterGainRef.current!, // ✅ اضافه شد
      activeAudio: activeAudio.current!,
      standbyAudio: standbyAudio.current!,
      activeGain: activeGain.current!,
      standbyGain: standbyGain.current!,
    }).catch(() => { });
  };

  const seek = (seconds: number) => {
    const el = activeAudio.current;
    if (!el) return;
    const dur = el.duration || 0;
    el.currentTime = Math.max(0, Math.min(seconds, dur));
  };

  const setVolume = (v: number) => {
    setVolumeState(clamp01(v));
    setMuted(false);
  };
  const toggleMute = () => setMuted(m => !m);

  const toggleShuffle = () => setShuffle(s => !s);
  const cycleRepeat = () => setRepeat(r => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));

  // ---------- Queue helpers
  const setQueue = (tracks: Track[], startIndex = 0) => {
    const norm = tracks.map(normalizeTrack).filter(t => !!t.fileUrl);
    setQueueState(norm);
    setIndex(Math.max(0, Math.min(startIndex, norm.length - 1)));
    if (gainARef.current) gainARef.current.gain.value = 1;
    if (gainBRef.current) gainBRef.current.gain.value = 0;
    setActive('A');
  };

  const addToQueue = (track: Track, playIfIdle = false) => {
    const norm = normalizeTrack(track);
    if (!norm.fileUrl) return;
    setQueueState(prev => {
      const exists = prev.some(t => t.id === norm.id);
      if (prev.length === 0) {
        setIndex(0);
        return [norm];
      }
      if (exists) return prev;
      return [...prev, norm];
    });
    if (playIfIdle && !isPlaying && queue.length === 0) {
      requestAnimationFrame(() => activeAudio.current?.play().catch(() => { }));
    }
  };

  const playTrack = (track: Track, maybeQueue?: Track[]) => {
    const normTrack = normalizeTrack(track);
    if (!normTrack.fileUrl) return;
    if (maybeQueue?.length) {
      const normQueue = maybeQueue.map(normalizeTrack).filter(t => !!t.fileUrl);
      const startIdx = Math.max(0, normQueue.findIndex(t => t.id === normTrack.id));
      setQueueState(normQueue);
      setIndex(startIdx === -1 ? 0 : startIdx);
      if (gainARef.current) gainARef.current.gain.value = 1;
      if (gainBRef.current) gainBRef.current.gain.value = 0;
      setActive('A');
    } else {
      setQueueState([normTrack]);
      setIndex(0);
      if (gainARef.current) gainARef.current.gain.value = 1;
      if (gainBRef.current) gainBRef.current.gain.value = 0;
      setActive('A');
    }
  };

  // ---------- Bus events
  useEffect(() => {
    const onPlayTracks = (e: Event) => {
      const { tracks, startIndex = 0 } = (e as CustomEvent).detail || {};
      if (!Array.isArray(tracks) || tracks.length === 0) return;
      const norm = tracks.map((t: any) => normalizeTrack(t?.song ? t.song : t)).filter(t => !!t.fileUrl);
      if (!norm.length) return;
      setQueue(norm, startIndex);
    };

    const onPlayTrack = (e: Event) => {
      const { track, queue: q } = (e as CustomEvent).detail || {};
      if (!track) return;
      playTrack(track, q);
    };

    const onPlayPlaylist = async (e: Event) => {
      const { playlistId, startIndex = 0 } = (e as CustomEvent).detail || {};
      if (!playlistId) return;
      try {
        const pl: any = await api.getPlaylist(playlistId);
        const raw: any[] =
          Array.isArray(pl?.tracks) ? pl.tracks :
            Array.isArray(pl?.items) ? pl.items.map((x: any) => x?.song ?? x) :
              Array.isArray(pl?.songs) ? pl.songs.map((x: any) => x?.song ?? x) : [];
        const norm = raw.map((t) => normalizeTrack(t)).filter(t => !!t.fileUrl);
        if (norm.length) setQueue(norm, startIndex);
      } catch (err) {
        console.error('Failed to play playlist:', err);
      }
    };

    window.addEventListener(EVENTS.PLAY_TRACKS, onPlayTracks as EventListener);
    window.addEventListener(EVENTS.PLAY_TRACK, onPlayTrack as EventListener);
    window.addEventListener(EVENTS.PLAY_PLAYLIST, onPlayPlaylist as EventListener);
    return () => {
      window.removeEventListener(EVENTS.PLAY_TRACKS, onPlayTracks as EventListener);
      window.removeEventListener(EVENTS.PLAY_TRACK, onPlayTrack as EventListener);
      window.removeEventListener(EVENTS.PLAY_PLAYLIST, onPlayPlaylist as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- context value
  const ctxValue = useMemo<AudioCtx>(() => ({
    queue, index, current, isPlaying,
    volume, muted, shuffle, repeat, progress,

    setQueue, addToQueue, playTrack,
    togglePlay, play, pause, next, prev, seek,
    setVolume, toggleMute, toggleShuffle, cycleRepeat,

    crossfadeEnabled, crossfadeSeconds, crossfadeCurve,
    setCrossfadeEnabled,
    setCrossfadeSeconds: (sec: number) => setCrossfadeSeconds(Math.max(0, sec)),
    setCrossfadeCurve,

    analyser: analyserRef.current,
  }), [
    queue, index, current, isPlaying,
    volume, muted, shuffle, repeat, progress,
    crossfadeEnabled, crossfadeSeconds, crossfadeCurve
  ]);

  return (
    <Ctx.Provider value={ctxValue}>
      {children}
      {/* دو پلیر پنهان (A/B) */}
      <audio hidden ref={aRef} preload="metadata" crossOrigin="anonymous" />
      <audio hidden ref={bRef} preload="metadata" crossOrigin="anonymous" />
    </Ctx.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudioPlayer must be used within <AudioProvider>');
  return ctx;
}
