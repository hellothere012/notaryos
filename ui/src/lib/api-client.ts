import axios, { AxiosInstance, AxiosError } from 'axios';

/* -------------------------------------------------------------------------- */
/*  Environment                                                               */
/* -------------------------------------------------------------------------- */

/**
 * API base URL.
 *
 * Next.js exposes client-side env vars via the NEXT_PUBLIC_ prefix.
 * Falls back to the production API domain when unset.
 */
const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

/* -------------------------------------------------------------------------- */
/*  Cookie-based token storage                                                */
/* -------------------------------------------------------------------------- */

/**
 * Cookie key used to persist the JWT access token.
 *
 * Cookies are used instead of localStorage for two reasons:
 * 1. Cookies are sent automatically with SSR requests, enabling future
 *    server-side auth validation in middleware.
 * 2. Cookies do not cause hydration mismatches the way localStorage can
 *    (localStorage is unavailable during SSR).
 */
const TOKEN_COOKIE = 'notary_token';
const REFRESH_COOKIE = 'notary_refresh_token';

/**
 * Runtime guard -- returns true only when executing in a browser context.
 * Used to prevent document/window access during SSR or RSC evaluation.
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Persist a JWT token as an HTTP cookie.
 *
 * In production (HTTPS) the cookie is flagged Secure.
 * SameSite=Lax prevents CSRF on cross-origin POST while still sending
 * the cookie on same-site navigations.
 *
 * Max-Age is set to 7 days (604800 seconds).
 */
export const setAuthToken = (token: string, refreshToken?: string): void => {
  if (!isBrowser) return;

  const secure =
    window.location.protocol === 'https:' ? '; Secure' : '';
  const baseParts = `; Path=/; SameSite=Lax; Max-Age=604800${secure}`;

  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}${baseParts}`;

  if (refreshToken) {
    document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}${baseParts}`;
  }
};

/**
 * Read the JWT access token from cookies.
 * Returns null when running server-side or when the cookie is absent.
 */
export const getAuthToken = (): string | null => {
  if (!isBrowser) return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));

  if (!match) return null;

  try {
    return decodeURIComponent(match.split('=')[1]);
  } catch {
    return null;
  }
};

/**
 * Remove both token cookies by setting them to expire in the past.
 */
export const clearAuthTokens = (): void => {
  if (!isBrowser) return;

  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${REFRESH_COOKIE}=; Path=/; Max-Age=0`;
};

/**
 * Quick boolean check for whether a token cookie exists.
 */
export const hasAuthToken = (): boolean => {
  return getAuthToken() !== null;
};

/* -------------------------------------------------------------------------- */
/*  Axios instances                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Public client -- no Authorization header.
 * Used for login, signup, and other unauthenticated endpoints.
 */
export const publicClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/**
 * Authenticated client -- automatically attaches the Bearer token
 * from the cookie on every outgoing request.
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/* -------------------------------------------------------------------------- */
/*  Interceptors                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Request interceptor: attach the Bearer token from the cookie store.
 */
authClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: handle 401 Unauthorized globally.
 *
 * When the API responds with 401 the token has expired or been revoked.
 * We clear the cookie and redirect to the login page (preserving the
 * original path for post-login redirect).
 *
 * The window check ensures this only runs client-side.
 */
authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && isBrowser) {
      clearAuthTokens();

      // Avoid redirect loops when already on the login page.
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname,
        )}`;
      }
    }
    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/*  API endpoints                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Centralised endpoint map.
 * Keeps URL strings out of component code and makes refactoring trivial.
 */
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
} as const;

export { API_BASE };
