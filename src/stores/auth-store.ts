import { create } from 'zustand';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  fullName?: string;
  isSuperadmin?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      console.log('[Admin] Login attempt:', email);
      const data = await api.post('/auth/login', { email, password });
      console.log('[Admin] Login response:', JSON.stringify(Object.keys(data)));
      const user = data.user;
      console.log('[Admin] user:', user);
      console.log('[Admin] isSuperadmin:', user?.isSuperadmin);
      if (!user?.isSuperadmin) {
        throw new Error('Not a superadmin account');
      }
      localStorage.setItem('admin_token', data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({ token: data.accessToken, user, loading: false });
      console.log('[Admin] Login successful, token stored');
    } catch (err: any) {
      console.error('[Admin] Login error:', err.message);
      set({ error: err.message || 'Login failed', loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, user: null });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    console.log('[Admin] loadFromStorage:', { hasToken: !!token, hasUser: !!userStr });
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.isSuperadmin) {
          set({ token, user });
          console.log('[Admin] Restored session from storage');
        }
      } catch (e) {
        console.error('[Admin] Failed to parse stored user:', e);
        localStorage.removeItem('admin_user');
      }
    }
  },
}));
