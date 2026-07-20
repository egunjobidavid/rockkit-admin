import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth-store';

type HttpMethod = 'post' | 'patch' | 'delete';

interface UseAdminMutationOptions<TVariables, TResult> {
  method?: HttpMethod;
  path: string | ((vars: TVariables) => string);
  body?: (vars: TVariables) => any;
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
}

interface UseAdminMutationResult<TVariables, TResult> {
  execute: (vars: TVariables) => Promise<TResult | null>;
  loading: boolean;
  error: string | null;
  result: TResult | null;
  reset: () => void;
}

export function useAdminMutation<TVariables = void, TResult = any>(
  options: UseAdminMutationOptions<TVariables, TResult>
): UseAdminMutationResult<TVariables, TResult> {
  const { token } = useAuthStore();
  const { method = 'post', path, body, onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const execute = useCallback(async (vars: TVariables): Promise<TResult | null> => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = typeof path === 'function' ? path(vars) : path;
      const reqBody = body ? body(vars) : vars;
      const res = await api[method](url, reqBody, token);
      setResult(res);
      onSuccess?.(res);
      return res;
    } catch (err: any) {
      const msg = err.message || 'Operation failed';
      setError(msg);
      onError?.(new Error(msg));
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, method, path, body, onSuccess, onError]);

  return { execute, loading, error, result, reset };
}

// ─── Confirmation helper ────────────────────────────────────────────────────

export function useConfirm(message: string): () => Promise<boolean> {
  return useCallback(() => {
    return Promise.resolve(window.confirm(message));
  }, [message]);
}
