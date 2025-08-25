export interface ApiResponse<T = any> {
  data?: T;
  items?: T[];
  suggestions?: any[];
  message?: string;
  status?: number;
  page?: number;
  pageSize?: number;
  total?: number;
  pages?: number;
  ok?: boolean;
  filters?: Record<string, any>;
  meta?: Record<string, any>;
  searchType?: 'standard' | 'similarity';
}

export class ApiError extends Error {
  status: number;
  details?: { url?: string; method?: string; responseText?: string; responseJson?: any };
  constructor(message: string, status: number, details?: ApiError['details']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
