'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '@/types';
import {
  authClient,
  publicClient,
  API_ENDPOINTS,
  setAuthToken,
  getAuthToken,
  clearAuthTokens,
  hasAuthToken,
} from '@/lib/api-client';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AuthContextType extends AuthState {
  /** Authenticate with email + password and persist the session token. */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Create a new account. Auto-logs in when the API returns a token. */
  signup: (data: SignupData) => Promise<void>;
  /** Clear session token and reset auth state. */
  logout: () => void;
  /** Re-fetch the current user profile from the API. */
  refreshUser: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * AuthProvider -- cookie-based token management for Next.js App Router.
 *
 * Key differences from the CRA (localStorage) version:
 *
 * 1. Tokens are stored in document.cookie instead of localStorage.
 *    - Cookies survive SSR hydration without mismatch because the server
 *      can read them on the initial request (if middleware is added later).
 *    - SameSite=Lax + Secure flags are applied in production.
 *
 * 2. All browser-only APIs (document, window) are guarded with
 *    `typeof window !== 'undefined'` so this module can be safely imported
 *    in server contexts without crashing.
 *
 * 3. The Axios interceptors and token helpers are imported from
 *    `@/lib/api-client` which applies the same SSR guards.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: typeof window !== 'undefined' ? getAuthToken() : null,
    isAuthenticated: false,
    isLoading: true,
  });

  /* ------------------------------------------------------------------ */
  /*  Refresh current user                                               */
  /* ------------------------------------------------------------------ */

  const refreshUser = useCallback(async () => {
    if (!hasAuthToken()) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }));
      return;
    }

    try {
      const response = await authClient.get(API_ENDPOINTS.me);
      const user: User = response.data.user || response.data;

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      clearAuthTokens();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /** Bootstrap auth state on mount. */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /* ------------------------------------------------------------------ */
  /*  Login                                                              */
  /* ------------------------------------------------------------------ */

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await publicClient.post(API_ENDPOINTS.login, {
        username: credentials.email,
        password: credentials.password,
      });

      const { access_token, user } = response.data;

      setAuthToken(access_token);

      setState({
        user: user || null,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // If the user object was not included in the login response, fetch it.
      if (!user) {
        await refreshUser();
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Login failed';
      throw new Error(message);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Signup                                                             */
  /* ------------------------------------------------------------------ */

  const signup = async (data: SignupData): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await publicClient.post(API_ENDPOINTS.signup, {
        email: data.email,
        password: data.password,
        username: data.username || data.email.split('@')[0],
      });

      // Auto-login when the API returns a token on signup.
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
        setState({
          user: response.data.user || null,
          token: response.data.access_token,
          isAuthenticated: true,
          isLoading: false,
        });

        if (!response.data.user) {
          await refreshUser();
        }
      } else {
        // Signup successful but may require email verification.
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, isLoading: false }));

      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Signup failed';
      throw new Error(message);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Logout                                                             */
  /* ------------------------------------------------------------------ */

  const logout = useCallback(() => {
    clearAuthTokens();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Convenience hook for consuming auth state and actions.
 * Must be called within an <AuthProvider>.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
