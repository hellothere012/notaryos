/**
 * Legacy import bridge.
 *
 * Components import from '../../config/api'. The actual implementation
 * has moved to @/lib/api-client (cookie-based, SSR-compatible).
 * This file re-exports everything so existing component imports
 * continue to work without modification.
 */
export {
  publicClient,
  authClient,
  setAuthToken,
  getAuthToken,
  clearAuthTokens,
  hasAuthToken,
  API_ENDPOINTS,
  API_BASE,
} from '@/lib/api-client';
