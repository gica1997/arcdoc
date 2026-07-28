'use client';

import { useState, useCallback, useEffect } from 'react';
import type { UserProfile, LoginRequest, LoginResponse } from '@/types';
import apiClient, { handleApiError } from '@/services/api';

interface AuthState { user: UserProfile | null; isLoading: boolean; isAuthenticated: boolean; error: string | null; }

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false, error: null });

  useEffect(() => {
    const storedUser = localStorage.getItem('arcdoc_user');
    const storedToken = localStorage.getItem('arcdoc_access_token');
    if (storedUser && storedToken) {
      try {
        setState({ user: JSON.parse(storedUser) as UserProfile, isLoading: false, isAuthenticated: true, error: null });
      } catch {
        localStorage.removeItem('arcdoc_user'); localStorage.removeItem('arcdoc_access_token'); localStorage.removeItem('arcdoc_refresh_token');
        setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await apiClient.post('/api/v1/auth/login', credentials);
      const { accessToken, refreshToken, user } = res.data.data as LoginResponse;
      localStorage.setItem('arcdoc_access_token', accessToken);
      localStorage.setItem('arcdoc_refresh_token', refreshToken);
      localStorage.setItem('arcdoc_user', JSON.stringify(user));
      // Also set cookie for middleware auth check
      document.cookie = `arcdoc_session=${accessToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      return res.data.data;
    } catch (error) {
      const msg = handleApiError(error);
      setState((prev) => ({ ...prev, isLoading: false, error: msg }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { }
    localStorage.removeItem('arcdoc_access_token'); localStorage.removeItem('arcdoc_refresh_token'); localStorage.removeItem('arcdoc_user');
    // Clear cookie
    document.cookie = 'arcdoc_session=; path=/; max-age=0';
    setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const rt = localStorage.getItem('arcdoc_refresh_token');
    if (!rt) return false;
    try {
      const res = await apiClient.post('/api/v1/auth/refresh-token', { refreshToken: rt });
      const { accessToken, refreshToken: newRt } = res.data.data as LoginResponse;
      localStorage.setItem('arcdoc_access_token', accessToken);
      localStorage.setItem('arcdoc_refresh_token', newRt);
      return true;
    } catch { await logout(); return false; }
  }, [logout]);

  const updateUser = useCallback((u: UserProfile) => { localStorage.setItem('arcdoc_user', JSON.stringify(u)); setState((prev) => ({ ...prev, user: u })); }, []);
  const clearError = useCallback(() => setState((prev) => ({ ...prev, error: null })), []);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/users/me');
      const u = res.data.data as UserProfile;
      localStorage.setItem('arcdoc_user', JSON.stringify(u));
      setState((prev) => ({ ...prev, user: u }));
    } catch {
      // ignore
    }
  }, []);

  return { ...state, login, logout, refreshToken, updateUser, clearError, refresh };
}

export default useAuth;