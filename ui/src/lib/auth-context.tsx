'use client';

/**
 * Clerk-backed auth adapter.
 *
 * Exports the same `useAuth` and `AuthProvider` interface as the old
 * cookie-based implementation so all existing component imports
 * (`import { useAuth } from '../../contexts/AuthContext'`) continue to
 * work without modification.
 *
 * Under the hood this delegates to @clerk/nextjs hooks.
 * After Clerk login, syncs with backend to fetch actual role/tier.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  useUser as useClerkUser,
  useClerk,
  useAuth as useClerkAuth,
} from '@clerk/nextjs';
import { User, AuthState } from '@/types';
import { authClient, API_ENDPOINTS } from '@/lib/api-client';

/* -------------------------------------------------------------------------- */
/*  Types (unchanged — re-used by components)                                 */
/* -------------------------------------------------------------------------- */

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (data: { email: string; password: string; username?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Drop-in replacement for the old `useAuth` hook.
 *
 * Maps Clerk state to the existing AuthState / User types so components
 * like AppHeader, Sidebar, and UserMenu work without changes.
 * Fetches actual role/tier from backend via /v1/auth/clerk/sync.
 */
export const useAuth = (): AuthContextType => {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();
  const [backendProfile, setBackendProfile] = useState<{ role: User['role']; tier: User['tier'] } | null>(null);
  const syncAttempted = useRef(false);

  const VALID_ROLES: User['role'][] = ['user', 'admin', 'agent_operator'];
  const VALID_TIERS: User['tier'][] = ['free', 'starter', 'explorer', 'pro', 'enterprise'];

  // Sync with backend to get actual role/tier
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser || syncAttempted.current) return;
    syncAttempted.current = true;

    const syncProfile = async () => {
      try {
        const resp = await authClient.post(API_ENDPOINTS.clerkSync, {
          email: clerkUser.primaryEmailAddress?.emailAddress,
          display_name: clerkUser.fullName || clerkUser.username,
          avatar_url: clerkUser.imageUrl,
        });
        if (resp.data?.role || resp.data?.tier) {
          const role = VALID_ROLES.includes(resp.data.role) ? resp.data.role : 'user';
          const tier = VALID_TIERS.includes(resp.data.tier) ? resp.data.tier : 'free';
          setBackendProfile({ role, tier });
        }
      } catch (err) {
        console.warn('[auth-context] profile sync failed:', err);
      }
    };

    syncProfile();
  }, [isLoaded, isSignedIn, clerkUser]);

  // Reset sync flag on sign-out
  useEffect(() => {
    if (!isSignedIn) {
      syncAttempted.current = false;
      setBackendProfile(null);
    }
  }, [isSignedIn]);

  // Map Clerk user → our User type
  const user: User | null =
    isLoaded && isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          username:
            clerkUser.username ||
            clerkUser.fullName ||
            clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
          role: backendProfile?.role || 'user',
          tier: backendProfile?.tier || 'free',
          createdAt: clerkUser.createdAt
            ? new Date(clerkUser.createdAt).toISOString()
            : new Date().toISOString(),
          emailVerified: !!clerkUser.primaryEmailAddress?.verification?.status,
        }
      : null;

  const state: AuthState = {
    user,
    token: null, // Clerk manages tokens internally via getToken()
    isAuthenticated: !!isSignedIn,
    isLoading: !isLoaded,
  };

  return {
    ...state,

    // login/signup redirect to Clerk hosted pages
    login: async () => {
      openSignIn();
    },

    signup: async () => {
      openSignUp();
    },

    logout: () => {
      signOut({ redirectUrl: '/' });
    },

    refreshUser: async () => {
      // Re-fetch backend profile to get updated role/tier
      syncAttempted.current = false;
      try {
        const resp = await authClient.get(API_ENDPOINTS.clerkMe);
        if (resp.data?.role || resp.data?.tier) {
          const role = VALID_ROLES.includes(resp.data.role) ? resp.data.role : 'user';
          const tier = VALID_TIERS.includes(resp.data.tier) ? resp.data.tier : 'free';
          setBackendProfile({ role, tier });
        }
      } catch (err) {
        console.warn('[auth-context] profile refresh failed:', err);
      }
    },
  };
};

/* -------------------------------------------------------------------------- */
/*  Provider (pass-through — ClerkProvider is in layout.tsx)                   */
/* -------------------------------------------------------------------------- */

/**
 * AuthProvider is now a no-op pass-through.
 * ClerkProvider in layout.tsx handles everything.
 * Kept for backward compatibility if any component renders <AuthProvider>.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};
