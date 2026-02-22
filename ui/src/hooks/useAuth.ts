/**
 * useAuth - Re-export of useAuth from AuthContext
 *
 * This file provides a convenient import path for the useAuth hook.
 * Instead of importing from contexts/AuthContext, components can import from hooks/useAuth.
 *
 * @example
 * ```tsx
 * // Both of these work:
 * import { useAuth } from '../hooks/useAuth';
 * import { useAuth } from '../contexts/AuthContext';
 * ```
 */

export { useAuth } from '../contexts/AuthContext';

// Re-export types if needed elsewhere
export type { User, AuthState, LoginCredentials, SignupData } from '../types';
