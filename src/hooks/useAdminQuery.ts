import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth-store';
import type { PaginatedResponse } from '../types/admin';

interface UseAdminQueryOptions<T> {
  path: string;
  page?: number;
  limit?: number;
  search?: string;
  params?: Record<string, string>;
  enabled?: boolean;
  transform?: (data: any) => T;
}

interface UseAdminQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refresh: () => void;
}

export function useAdminQuery<T = any>(options: UseAdminQueryOptions<T>): UseAdminQueryResult<T> {
  const { token } = useAuthStore();
  const { path, page = 1, limit = 20, search = '', params = {}, enabled = true, transform } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page, limit, total: 0, totalPages: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!token || !enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    for (const [k, v] of Object.entries(params)) {
      if (v) query.set(k, v);
    }

    api.get(`${path}?${query}`, token)
      .then((res: any) => {
        if (cancelled) return;
        const result = transform ? transform(res) : res;
        setData(result?.data ?? result);
        setPagination({
          page: res?.page ?? page,
          limit: res?.limit ?? limit,
          total: res?.total ?? 0,
          totalPages: res?.totalPages ?? 0,
        });
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, path, page, limit, search, JSON.stringify(params), refreshKey, enabled]);

  return { data, loading, error, pagination, refresh };
}

// ─── Simple fetch hook (non-paginated) ──────────────────────────────────────

export function useAdminFetch<T = any>(path: string, enabled = true): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const { token } = useAuthStore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!token || !enabled) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    api.get(path, token)
      .then((res: any) => { if (!cancelled) setData(res); })
      .catch((err: any) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, path, refreshKey, enabled]);

  return { data, loading, error, refresh };
}
