const envUrl = (import.meta as any).env?.VITE_API_URL;
const BASE = envUrl
  ? (envUrl.startsWith('http') ? envUrl : `https://${envUrl}`)
  : 'https://copiaos-backend.onrender.com/api/v1';

interface FetchOptions {
  method?: string;
  body?: any;
  token?: string;
}

async function request<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

export const api = {
  get: <T = any>(path: string, token?: string) => request<T>(path, { token }),
  post: <T = any>(path: string, body: any, token?: string) => request<T>(path, { method: 'POST', body, token }),
  patch: <T = any>(path: string, body: any, token?: string) => request<T>(path, { method: 'PATCH', body, token }),
};
