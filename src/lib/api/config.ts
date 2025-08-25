export const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000';

const SERVER_BASE = RAW_BASE.replace(/\/+$/, '');
export const API_BASE_URL = SERVER_BASE.endsWith('/api') ? SERVER_BASE : `${SERVER_BASE}/api`;

export const buildUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

export const API_CONSTANTS = {
  BASE_URL: API_BASE_URL,
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: { IMAGE: 10 * 1024 * 1024, AUDIO: 100 * 1024 * 1024 },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
    AUDIO: ['audio/mpeg','audio/wav','audio/ogg','audio/flac','audio/aac','audio/mp4','audio/webm','audio/m4a'],
  },
  CACHE_TTL: { SHORT: 5 * 60 * 1000, MEDIUM: 10 * 60 * 1000, LONG: 30 * 60 * 1000 },
} as const;
