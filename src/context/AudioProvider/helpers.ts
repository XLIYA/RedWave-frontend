import type { Track, RepeatMode } from './types';
import { API_BASE } from './constants';

export function clamp01(v: number) {
  return Math.max(0, Math.min(v, 1));
}

export function toAbsolute(url: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function normalizeTrack(t: Partial<Track>): Track {
  const fileUrl = (t as any).fileUrl || (t as any).audioUrl || '';
  const coverImage = (t as any).coverImage || (t as any).cover || '';
  return {
    id: String((t as any).id),
    title: (t as any).title || '',
    artist: (t as any).artist || '',
    genre: (t as any).genre,
    duration: (t as any).duration || 0,
    createdAt: (t as any).createdAt || new Date().toISOString(),
    updatedAt: (t as any).updatedAt,
    coverImage,
    fileUrl,
    analytics: (t as any).analytics,
    _count: (t as any)._count,
    uploadedBy: (t as any).uploadedBy,
    liked: (t as any).liked,
    likedAt: (t as any).likedAt,
    addedAt: (t as any).addedAt,
    releaseDate: (t as any).releaseDate,
    format: (t as any).format,
  } as Track;
}

export function getNextIndex(
  queue: Track[],
  index: number,
  opts: { dir: 1 | -1; shuffle: boolean; repeat: RepeatMode }
) {
  const { dir, shuffle, repeat } = opts;
  if (!queue.length) return index;

  const pickShuffle = () => {
    if (queue.length <= 1) return index;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * queue.length);
    return next;
  };

  if (dir === -1) {
    if (shuffle) return pickShuffle();
    if (index > 0) return index - 1;
    return repeat === 'all' ? queue.length - 1 : index;
  }

  // dir === 1
  if (shuffle) return pickShuffle();
  if (index < queue.length - 1) return index + 1;
  return repeat === 'all' ? 0 : index;
}
