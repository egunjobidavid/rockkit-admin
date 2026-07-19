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
      const data = await api.post('/auth/login', { email, password });
      const user = data.user;
      if (!user?.isSuperadmin) {
        throw new Error('Not a superadmin account');
      }
      localStorage.setItem('admin_token', data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({ token: data.accessToken, user, loading: false });
    } catch (err: any) {
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
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.isSuperadmin) {
          set({ token, user });
        }
      } catch { /* ignore */ }
    }
  },
}));
