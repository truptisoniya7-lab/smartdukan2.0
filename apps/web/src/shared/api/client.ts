import axios from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';

// ─────────────────────────────────────────────────────────────
// Axios API client with auto token refresh
// ─────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api/v1',
  withCredentials: true, // needed for the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh on 401
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Never attempt token refresh on auth endpoints (login, refresh, register, otp)
    const url = original.url || '';
    if (url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // If user is not authenticated in store, don't attempt refresh or trigger redirect
    const { accessToken, isAuthenticated, clearAuth } = useAuthStore.getState();
    if (!accessToken && !isAuthenticated) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Deduplicate concurrent refresh calls
    if (!refreshPromise) {
      const baseURL = import.meta.env['VITE_API_URL'] ?? '/api/v1';
      refreshPromise = axios
        .post<{ accessToken: string }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        .then((r) => {
          const { accessToken } = r.data;
          useAuthStore.getState().updateToken(accessToken);
          return accessToken;
        })
        .catch((refreshErr) => {
          clearAuth();
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      return Promise.reject(error);
    }
  },
);
