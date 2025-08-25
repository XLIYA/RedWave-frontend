export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const PLAY_ENDPOINT_BASE = `${API_BASE}/api`;

export const LS = {
  VOL: 'rw_volume',
  MUTED: 'rw_muted',
  SHUFFLE: 'rw_shuffle',
  REPEAT: 'rw_repeat',
  XF_ON: 'rw_crossfade_on',
  XF_SEC: 'rw_crossfade_sec',
  XF_CURVE: 'rw_crossfade_curve',
} as const;

export const DEFAULTS = {
  VOLUME: 0.9,
  CROSSFADE_SEC: 6,
  CROSSFADE_CURVE: 'logarithmic' as const,
};
