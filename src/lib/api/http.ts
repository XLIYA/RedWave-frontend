// src/lib/api/http.ts
import { API_BASE_URL, buildUrl } from './config';
import { ApiError, ApiResponse, isPlainObject } from './types';

export class HttpClient {
  // token
  private get token(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  getAuthToken(): string | null { return this.token; }
  setAuthToken(token: string) { if (typeof window !== 'undefined') localStorage.setItem('token', token); }
  clearAuthToken() { if (typeof window !== 'undefined') localStorage.removeItem('token'); }
  isAuthenticated(): boolean { return !!this.token; }

  private safeLogError(prefix: string, data: any) {
    try {
      const msg =
        typeof data === 'string' ? data :
        isPlainObject(data) ? JSON.stringify({
          ...('message' in data ? { message: (data as any).message } : {}),
          ...('status' in data ? { status: (data as any).status } : {}),
          ...('url' in data ? { url: (data as any).url } : {}),
          ...('method' in data ? { method: (data as any).method } : {}),
        }) : String(data);
      console.error(`${prefix} ${msg}`);
    } catch { console.error(prefix); }
  }

  // ---- core request
  async request<T>(
    endpoint: string,
    options: (RequestInit & { auth?: boolean }) = {},
    extra?: { quietStatuses?: number[] }
  ): Promise<ApiResponse<T>> {
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const hasBody = !!options.body;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(hasBody && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string>),
    };
    // attach Authorization only when explicitly requested
    if (options.auth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else if ('Authorization' in headers) {
      delete (headers as any).Authorization;
    }

    const cfg: RequestInit = { ...options, headers };
    const url = buildUrl(endpoint);

    try {
      if (process.env.NODE_ENV !== 'production') console.log('→', cfg.method || 'GET', url);
      const res = await fetch(url, cfg);

      if (res.ok && res.status === 204) return { ok: true, status: 204, message: 'No content' };

      let raw = ''; let data: any = {};
      try {
        raw = await res.text();
        const ctype = res.headers.get('content-type') || '';
        const looksJson =
          ctype.includes('application/json') || ctype.includes('+json') ||
          raw.trim().startsWith('{') || raw.trim().startsWith('[');
        if (raw.trim() && looksJson) data = JSON.parse(raw);
        else if (raw.trim()) data = { message: raw };
        else data = { message: 'Empty response from server' };
      } catch (e: any) {
        data = { message: 'Invalid JSON response from server', rawResponse: raw, parseError: e?.message };
      }

      if (!res.ok) {
        if (res.status === 401) {
          this.clearAuthToken();
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        const msg = data?.message || data?.error || `HTTP ${res.status}${res.statusText ? `: ${res.statusText}` : ''}`;
        if (!extra?.quietStatuses?.includes(res.status)) {
          this.safeLogError('❌ API', { message: msg, status: res.status, url, method: cfg.method || 'GET' });
        }
        throw new ApiError(msg, res.status, {
          url, method: (cfg.method as string) || 'GET',
          responseText: typeof data?.message === 'string' ? data.message : undefined,
          responseJson: isPlainObject(data) ? data : undefined,
        });
      }

      if (process.env.NODE_ENV !== 'production') console.log('←', res.status, url);
      return data;
    } catch (err: any) {
      if (err instanceof TypeError) {
        this.safeLogError('🌐 Network error:', err.message);
        throw new ApiError('Network connection failed - Check if server is running', 0, {
          url: buildUrl(endpoint), method: (options.method as string) || 'GET',
        });
      }
      if (err instanceof ApiError) throw err;
      this.safeLogError('🚨 Unexpected error:', err?.message || String(err));
      throw new ApiError(`Network error: ${err?.message || 'Unknown'}`, 500, {
        url: buildUrl(endpoint), method: (options.method as string) || 'GET',
      });
    }
  }

  // ---- convenience
  async get<T>(endpoint: string, _params?: any, opts?: { auth?: boolean }): Promise<T> {
    const res = await this.request<T>(endpoint, { auth: opts?.auth });
    const r: any = res;

    // فقط اگر پاسخ واضحاً صفحه‌بندی‌شده بود items را باز می‌کنیم
    const paged = r && typeof r === 'object' &&
      (('page' in r) || ('pages' in r) || ('total' in r) || ('pageSize' in r));

    if (paged && Array.isArray(r.items)) return r.items as T;
    if (r && typeof r === 'object' && 'data' in r) return r.data as T;
    return r as T;
  }

  async post<T>(endpoint: string, body?: any, opts?: { auth?: boolean }): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
      auth: opts?.auth,
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }

  async put<T>(endpoint: string, body?: any, opts?: { auth?: boolean }): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
      auth: opts?.auth,
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }

  async delete<T>(endpoint: string, body?: any, opts?: { auth?: boolean }): Promise<T> {
    const res = await this.request<T>(endpoint, {
      method: 'DELETE',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      auth: opts?.auth,
    });
    if ((res as any).data) return (res as any).data as T;
    return res as unknown as T;
  }

  async getPaginated<T>(endpoint: string, params?: Record<string, any>, opts?: { auth?: boolean }) {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
    });
    const url = sp.toString() ? `${endpoint}?${sp.toString()}` : endpoint;
    const res = await this.request<T[]>(url, { auth: opts?.auth });
    return {
      items: ((res as any).items || []) as T[],
      page: (res as any).page || 1,
      pageSize: (res as any).pageSize || 10,
      total: (res as any).total || 0,
      pages: (res as any).pages || 0,
      filters: (res as any).filters,
      meta: (res as any).meta,
    };
  }

  async requestWithRetry<T>(endpoint: string, options: RequestInit = {}, maxRetries = 3, delay = 1000) {
    let last: any;
    for (let i = 1; i <= maxRetries; i++) {
      try { return await this.request<T>(endpoint, options); }
      catch (e: any) {
        last = e;
        if (e.status >= 400 && e.status < 500 && e.status !== 429) throw e;
        if (i === maxRetries) throw e;
        await new Promise((r) => setTimeout(r, delay * i));
      }
    }
    throw last;
  }

  async batchRequest<T>(requests: Array<{ endpoint: string; options?: RequestInit }>) {
    const results = await Promise.allSettled(requests.map((r) => this.request<T>(r.endpoint, r.options)));
    return results.map((res) => ({
      success: res.status === 'fulfilled',
      data: res.status === 'fulfilled' ? (res as PromiseFulfilledResult<any>).value as T : undefined,
      error: res.status === 'rejected' ? (res as PromiseRejectedResult).reason?.message : undefined,
    }));
  }

  async debugEndpoint(endpoint: string) {
    const url = buildUrl(endpoint);
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) } });
      return { url, reachable: true, responseTime: Date.now() - start, status: res.status };
    } catch (e: any) {
      return { url, reachable: false, responseTime: Date.now() - start, error: e?.message || 'fail' };
    }
  }

  createWebSocketConnection(endpoint: string): WebSocket | null {
    if (typeof window === 'undefined') return null;
    if (!this.token) return null;
    const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const ws = new WebSocket(`${wsBase}${ep}?token=${encodeURIComponent(this.token)}`);
    ws.addEventListener('error', () => console.error('WebSocket error'));
    return ws;
  }

  async healthCheck() {
    try {
      const res = await fetch(API_BASE_URL.replace(/\/api$/, '/health'));
      if (!res.ok) throw new ApiError('Health check failed', res.status);
      return res.json();
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Health check failed', 0);
    }
  }
}

// ✅ فقط named exportها
export const http = new HttpClient();
export const apiFetch = (endpoint: string, options?: RequestInit) => http.request(endpoint, options);
export const createAuthHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
