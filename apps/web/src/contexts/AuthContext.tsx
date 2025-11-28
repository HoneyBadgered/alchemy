'use client';

/**
 * Auth Context Provider
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useAuthStore, User } from '@/store/authStore';
import { authApi, ApiError } from '@/lib/auth-api';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (email: string, password: string, username: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    clearAuth,
    setLoading,
    updateUser,
  } = useAuthStore();

  // Check if user is still authenticated on mount
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Verify token is still valid
      authApi
        .getMe(accessToken)
        .then((user) => {
          updateUser(user);
        })
        .catch(() => {
          // Token is invalid, try to refresh
          refreshAuth();
        });
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      setLoading(true);
      try {
        const response = await authApi.login({ email, password });
        setAuth(response.user, response.accessToken);
        // If redirectTo is provided, use it; otherwise redirect based on role
        if (redirectTo) {
          router.push(redirectTo);
        } else if (response.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/table');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          throw new Error(error.message);
        }
        throw new Error('Failed to login');
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, router]
  );

  const register = useCallback(
    async (email: string, password: string, username: string, redirectTo?: string) => {
      setLoading(true);
      try {
        const response = await authApi.register({ email, password, username });
        setAuth(response.user, response.accessToken);
        // If redirectTo is provided, use it; otherwise redirect to table
        router.push(redirectTo || '/table');
      } catch (error) {
        if (error instanceof ApiError) {
          throw new Error(error.message);
        }
        throw new Error('Failed to register');
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, router]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (accessToken) {
        // Get refresh token from cookie (handled by browser)
        await authApi.logout('', accessToken);
      }
      clearAuth();
      router.push('/login');
    } catch {
      console.error('Logout failed, but clearing auth anyway');
      // Clear auth anyway
      clearAuth();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [accessToken, clearAuth, setLoading, router]);

  const refreshAuth = useCallback(async () => {
    // Refresh token is in httpOnly cookie, so we don't need to pass it
    try {
      const response = await authApi.refreshToken('');
      setAuth(response.user, response.accessToken);
    } catch {
      clearAuth();
      router.push('/login');
    }
  }, [setAuth, clearAuth, router]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
