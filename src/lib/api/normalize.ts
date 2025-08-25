// src/lib/api/normalize.ts

export type NormalizedTrack = {
  id: string;
  title: string;
  artist: string;
  duration?: number | null;
  coverImage?: string | null;
  audioUrl?: string | null;
  album?: string | null;
  genre?: string | null;
  releaseDate?: string | null;
  // هر چیز اضافه:
  raw?: any;
};

const pick = (obj: any, keys: string[]): any =>
  keys.reduce((acc: any, k) => (obj?.[k] !== undefined ? (acc[k] = obj[k], acc) : acc), {});

export function mapToTrack(s: any): NormalizedTrack {
  // آیدی
  const id = String(s?.id ?? s?._id ?? s?.uuid ?? s?.slug ?? '');

  // عنوان/هنرمند
  const title =
    s?.title ?? s?.name ?? s?.trackTitle ?? s?.songTitle ?? 'Untitled';
  const artist =
    s?.artist ??
    s?.artistName ??
    s?.uploader?.username ??
    s?.uploadedBy?.username ??
    s?.author ??
    'Unknown';

  // کاور
  const coverImage =
    s?.coverImage ?? s?.cover ?? s?.coverUrl ?? s?.image ?? s?.thumbnail ?? null;

  // مدت
  const duration =
    typeof s?.duration === 'number' ? s.duration :
    typeof s?.length === 'number' ? s.length :
    s?.meta?.duration ?? null;

  // آلبوم/ژانر/تاریخ
  const album =
    s?.album ??
    s?.albumName ??
    s?.metadata?.album ??
    s?.meta?.album ??
    null;

  const genre =
    s?.genre ??
    s?.metadata?.genre ??
    s?.meta?.genre ??
    null;

  const releaseDate =
    s?.releaseDate ??
    s?.publishedAt ??
    s?.meta?.releaseDate ??
    null;

  // آدرس صوتی (چندین نام محتمل)
  const audioUrl =
    s?.audioUrl ??
    s?.fileUrl ??
    s?.streamUrl ??
    s?.sourceUrl ??
    s?.url ??
    s?.audio?.url ??
    s?.file ??
    null;

  return {
    id, title, artist, coverImage, duration, audioUrl, album, genre, releaseDate,
    raw: pick(s, ['id','_id','uuid','slug','title','name','artist','coverImage','duration','fileUrl','audioUrl','streamUrl'])
  };
}

// ————— پلی‌لیست
export function normalizePlaylistResponse(raw: any) {
  if (!raw || typeof raw !== 'object') return raw;

  // استخراج تراک‌ها از شکل‌های مختلف
  let rawTracks: any[] = [];
  if (Array.isArray(raw.tracks)) rawTracks = raw.tracks;
  else if (Array.isArray(raw.items)) rawTracks = raw.items.map((x: { song: any; }) => (x?.song ? x.song : x));
  else if (Array.isArray(raw.songs)) rawTracks = raw.songs.map((x: { song: any; }) => (x?.song ? x.song : x));

  const tracks = rawTracks.map(mapToTrack);

  const trackCount =
    raw?.trackCount ??
    raw?._count?.songs ??
    raw?.songsCount ??
    tracks.length;

  return { ...raw, tracks, trackCount };
}
