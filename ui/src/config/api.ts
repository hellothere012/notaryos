import axios, { AxiosInstance, AxiosError } from 'axios';

// API base URL - uses environment variable or defaults
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.agenttownsquare.com';

// Token storage key
const TOKEN_KEY = 'notary_token';
const REFRESH_KEY = 'notary_refresh_token';

// Safe localStorage wrapper for private browsing
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('localStorage not available');
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('localStorage not available');
    }
  },
};

// Public client (no auth required)
export const publicClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Authenticated client (with interceptor)
export const authClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth header interceptor
authClient.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      safeStorage.removeItem(TOKEN_KEY);
      safeStorage.removeItem(REFRESH_KEY);

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

// Token management functions
export const setAuthToken = (token: string, refreshToken?: string): void => {
  safeStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    safeStorage.setItem(REFRESH_KEY, refreshToken);
  }
};

export const getAuthToken = (): string | null => {
  return safeStorage.getItem(TOKEN_KEY);
};

export const clearAuthTokens = (): void => {
  safeStorage.removeItem(TOKEN_KEY);
  safeStorage.removeItem(REFRESH_KEY);
};

export const hasAuthToken = (): boolean => {
  return !!safeStorage.getItem(TOKEN_KEY);
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  login: '/v1/auth/login',
  signup: '/v1/auth/register',
  me: '/v1/auth/me',
  logout: '/v1/auth/logout',
  refreshToken: '/v1/auth/refresh',

  // Notary
  verify: '/v1/notary/verify',
  history: '/v1/notary/history',
  sampleReceipt: '/v1/notary/sample-receipt',
  publicReceiptLookup: (hash: string) => `/v1/notary/r/${hash}`,

  // API Keys
  apiKeys: '/v1/api-keys',
  createApiKey: '/v1/api-keys',
  revokeApiKey: (id: string) => `/v1/api-keys/${id}`,
  rotateApiKey: (id: string) => `/v1/api-keys/${id}/rotate`,

  // Admin
  signerConfig: '/v1/notary/admin/signer',
  rotateKey: '/v1/notary/admin/rotate-key',
  systemStats: '/v1/notary/admin/stats',

  // Billing
  createCheckout: '/v1/billing/create-checkout-session',
  billingPortal: '/v1/billing/portal',
  billingStatus: '/v1/billing/status',
  subscription: '/v1/billing/subscription',

  // User
  profile: '/v1/users/profile',
  settings: '/v1/users/settings',
  changePassword: '/v1/users/change-password',
};

export { API_BASE };
