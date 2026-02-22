'use client';

/**
 * Legacy import bridge.
 *
 * All components import { useAuth } from '../../contexts/AuthContext'.
 * The actual implementation has moved to @/lib/auth-context (cookie-based,
 * SSR-compatible). This file re-exports everything so existing component
 * imports continue to work without modification.
 */
export { AuthProvider, useAuth } from '@/lib/auth-context';
