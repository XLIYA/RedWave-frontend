// src/lib/api/index.ts
import { http, apiFetch, createAuthHeader } from './http';
import { API_CONSTANTS } from './config';
export { ApiError, type ApiResponse, isPlainObject } from './types';
export { apiFetch, createAuthHeader, API_CONSTANTS };
export { getFeed } from './feed';

import playlistsModule from './modules/playlists';
import songsModule from './modules/songs';
import usersModule from './modules/users';
import searchModule from './modules/search';
import systemModule from './modules/system';

// اینجا «اینستنس» http را به ماژول‌ها می‌دهیم
const api = {
  ...playlistsModule(http),
  ...songsModule(http),
  ...usersModule(http),
  ...searchModule(http),
  ...systemModule(http),

  // دسترسی‌های عمومی به http
  setAuthToken: (t: string) => http.setAuthToken(t),
  clearAuthToken: () => http.clearAuthToken(),
  isAuthenticated: () => http.isAuthenticated(),
  createWebSocketConnection: (endpoint: string) => http.createWebSocketConnection(endpoint),
  healthCheck: () => http.healthCheck(),
};

export { api };

// اختیاری: لاگ خطای بدون مزاحمت
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (ev) => {
    console.error('🚨 Unhandled promise', ev?.reason?.message ?? ev?.reason);
  });
}
