// src/lib/playerBus.ts
export type Playable = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverImage?: string | null;
  duration?: number | null;
};

export const EVENTS = {
  PLAY_TRACKS: 'player:playTracks',
  PLAY_PLAYLIST: 'player:playPlaylist',
  PLAY_TRACK: 'player:playTrack',
} as const;

export function playTracks(tracks: Playable[], startIndex = 0) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTS.PLAY_TRACKS, { detail: { tracks, startIndex } }));
}

export function playTrack(track: Playable) {
  playTracks([track], 0);
}

export function playPlaylist(playlistId: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTS.PLAY_PLAYLIST, { detail: { playlistId } }));
}
