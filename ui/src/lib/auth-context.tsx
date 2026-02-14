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
 */

import React from 'react';
import {
  useUser as useClerkUser,
  useClerk,
  useAuth as useClerkAuth,
} from '@clerk/nextjs';
import { User, AuthState } from '@/types';

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
 */
export const useAuth = (): AuthContextType => {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();

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
          role: 'user',        // Default; admin detection can be added later
          tier: 'free',        // Default; tier comes from backend sync
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
      // Clerk manages user state reactively — nothing to manually refresh
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
