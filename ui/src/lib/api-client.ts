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
  demo: '/v1/notary/demo',
  verify: '/v1/notary/verify',
  history: '/v1/notary/history',
  explore: '/v1/notary/explore',
  activityStats: '/v1/notary/activity/stats',
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

  // Agent Dashboard
  agentDashboardAgents: '/v1/notary/agents/dashboard/agents',
  agentDashboardActivity: '/v1/notary/agents/dashboard/activity',
  agentDashboardPermissions: '/v1/notary/agents/dashboard/permissions',
  agentDashboardApprovals: '/v1/notary/agents/dashboard/approvals',
  agentDashboardDecide: (id: number) => `/v1/notary/agents/dashboard/approvals/${id}/decide`,
  agentDashboardDecisions: '/v1/notary/agents/dashboard/decisions',
  agentDashboardStats: '/v1/notary/agents/dashboard/stats',

  // User settings
  settings: '/v1/auth/clerk/settings',

  // Usage analytics
  usageCurrent: '/v1/usage/current',
  usageHistory: '/v1/usage/history',
  usageSummary: '/v1/usage/summary',

  // Tutor workspace
  tutorSemesters: '/v1/tutor/semesters',
  tutorSemester: (id: number) => `/v1/tutor/semesters/${id}`,
  tutorCourses: (semId: number) => `/v1/tutor/semesters/${semId}/courses`,
  tutorCourse: (id: number) => `/v1/tutor/courses/${id}`,
  tutorMaterials: (courseId: number) => `/v1/tutor/courses/${courseId}/materials`,
  tutorMaterial: (id: number) => `/v1/tutor/materials/${id}`,
  tutorContext: (courseId: number) => `/v1/tutor/courses/${courseId}/context`,
} as const;

export { API_BASE };
