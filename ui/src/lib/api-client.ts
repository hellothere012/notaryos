import axios, { AxiosInstance, AxiosError } from 'axios';

/* -------------------------------------------------------------------------- */
/*  Environment                                                               */
/* -------------------------------------------------------------------------- */

const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.agenttownsquare.com';

/* -------------------------------------------------------------------------- */
/*  Clerk token integration                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Reference to Clerk's `getToken()` function, injected at runtime by
 * <ClerkTokenProvider>.  Before injection, the getter is a no-op that
 * returns null (so SSR and pre-hydration requests don't explode).
 */
let _clerkGetToken: (() => Promise<string | null>) | null = null;

/**
 * Called once by <ClerkTokenProvider> to wire Clerk into the Axios client.
 */
export const setClerkTokenGetter = (
  getter: () => Promise<string | null>,
): void => {
  _clerkGetToken = getter;
};

/* -------------------------------------------------------------------------- */
/*  Axios instances                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Public client -- no Authorization header.
 * Used for verify, status, and other unauthenticated endpoints.
 */
export const publicClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/**
 * Authenticated client -- automatically attaches the Clerk session JWT
 * as a Bearer token on every outgoing request.
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
 * Request interceptor: fetch a fresh Clerk JWT and attach it.
 */
authClient.interceptors.request.use(
  async (config) => {
    if (_clerkGetToken) {
      try {
        const token = await _clerkGetToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Token unavailable — request proceeds without auth header
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: handle 401 Unauthorized.
 *
 * With Clerk managing sessions, a 401 typically means the session expired.
 * We redirect to the sign-in page so Clerk can re-authenticate.
 */
const isBrowser = typeof window !== 'undefined';

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && isBrowser) {
      if (!window.location.pathname.includes('/sign-in')) {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(
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

export const API_ENDPOINTS = {
  // Clerk auth
  clerkSync: '/v1/auth/clerk/sync',
  clerkMe: '/v1/auth/clerk/me',
  clerkAgents: '/v1/auth/clerk/agents',
  clerkStats: '/v1/auth/clerk/stats',

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

  // Agent registration
  registerAgent: '/v1/notary/agents/register',

  // User settings
  settings: '/v1/auth/clerk/settings',
} as const;

export { API_BASE };
