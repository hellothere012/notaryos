import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '../types';
import { authClient, publicClient, API_ENDPOINTS, setAuthToken, getAuthToken, clearAuthTokens, hasAuthToken } from '../config/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getAuthToken(),
    isAuthenticated: false,
    isLoading: true,
  });

  // Fetch current user
  const refreshUser = useCallback(async () => {
    if (!hasAuthToken()) {
      setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    try {
      const response = await authClient.get(API_ENDPOINTS.me);
      const user = response.data.user || response.data;

      setState(prev => ({
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

  // Initialize auth state
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await publicClient.post(API_ENDPOINTS.login, {
        username: credentials.email,
        password: credentials.password,
      });

      const { access_token, token_type, user } = response.data;

      setAuthToken(access_token);

      setState({
        user: user || null,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // If user wasn't in login response, fetch it
      if (!user) {
        await refreshUser();
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));

      const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  };

  // Signup
  const signup = async (data: SignupData): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await publicClient.post(API_ENDPOINTS.signup, {
        email: data.email,
        password: data.password,
        username: data.username || data.email.split('@')[0],
      });

      // If signup returns token, auto-login
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
        // Signup successful but requires email verification
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));

      const message = error.response?.data?.detail || error.response?.data?.message || 'Signup failed';
      throw new Error(message);
    }
  };

  // Logout
  const logout = useCallback(() => {
    clearAuthTokens();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
