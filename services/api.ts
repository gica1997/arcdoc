// ============================================
// ArcDoc Enterprise - API Client (Axios)
// ============================================

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiResponse, LoginResponse } from '@/types';

/**
 * Create the main Axios instance for ArcDoc API communication.
 * Configured with interceptors for JWT token management and error handling.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor - attaches JWT token from storage.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // In browser context, get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('arcdoc_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles token refresh on 401 errors.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retried, try to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('arcdoc_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse<LoginResponse>>(
          `${apiClient.defaults.baseURL}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data!;

        // Store new tokens
        localStorage.setItem('arcdoc_access_token', accessToken);
        localStorage.setItem('arcdoc_refresh_token', newRefreshToken);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('arcdoc_access_token');
        localStorage.removeItem('arcdoc_refresh_token');
        localStorage.removeItem('arcdoc_user');

        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[API Error] ${status}:`, data);
    } else if (error.request) {
      console.error('[API Error] No response received:', error.message);
    } else {
      console.error('[API Error] Request failed:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to handle API errors consistently.
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 401) {
      return 'Sesiunea a expirat. Vă rugăm să vă autentificați din nou.';
    }
    if (axiosError.response?.status === 403) {
      return 'Nu aveți permisiunea necesară pentru această acțiune.';
    }
    if (axiosError.response?.status === 404) {
      return 'Resursa solicitată nu a fost găsită.';
    }
    if (axiosError.response?.status === 429) {
      return 'Prea multe cereri. Vă rugăm să încercați din nou mai târziu.';
    }
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'Eroare internă de server. Vă rugăm să încercați din nou.';
    }
    if (axiosError.message === 'Network Error') {
      return 'Eroare de rețea. Verificați conexiunea la internet.';
    }
    return axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'A apărut o eroare necunoscută.';
}

export default apiClient;