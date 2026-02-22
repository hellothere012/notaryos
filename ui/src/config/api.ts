/**
 * Legacy import bridge.
 *
 * Components import from '../../config/api'. The actual implementation
 * lives in @/lib/api-client (Clerk-based auth).
 * This file re-exports everything so existing component imports
 * continue to work without modification.
 */
export {
  publicClient,
  authClient,
  setClerkTokenGetter,
  API_ENDPOINTS,
  API_BASE,
} from '@/lib/api-client';
