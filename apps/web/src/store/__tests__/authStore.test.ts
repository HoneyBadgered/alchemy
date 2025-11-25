/**
 * Auth Store Tests
 */

import { useAuthStore } from '../authStore';
import type { User } from '../authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should set user and access token', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-access-token';

      useAuthStore.getState().setAuth(mockUser, mockToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist auth state to localStorage', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-access-token';

      useAuthStore.getState().setAuth(mockUser, mockToken);

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user).toEqual(mockUser);
        expect(parsed.state.accessToken).toBe(mockToken);
        expect(parsed.state.isAuthenticated).toBe(true);
      }
    });
  });

  describe('clearAuth', () => {
    it('should clear authentication state', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      // Set auth first
      useAuthStore.getState().setAuth(mockUser, 'token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Clear auth
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear auth from localStorage', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      // Set auth first
      useAuthStore.getState().setAuth(mockUser, 'token');

      // Clear auth
      useAuthStore.getState().clearAuth();

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user).toBeNull();
        expect(parsed.state.accessToken).toBeNull();
        expect(parsed.state.isAuthenticated).toBe(false);
      }
    });
  });

  describe('updateUser', () => {
    it('should update user information', () => {
      const initialUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      useAuthStore.getState().setAuth(initialUser, 'token');

      const updatedUser: User = {
        ...initialUser,
        emailVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      useAuthStore.getState().updateUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user?.emailVerified).toBe(true);
      expect(state.user?.profile?.firstName).toBe('Test');
      expect(state.user?.profile?.lastName).toBe('User');
    });

    it('should persist updated user to localStorage', () => {
      const initialUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };

      useAuthStore.getState().setAuth(initialUser, 'token');

      const updatedUser: User = {
        ...initialUser,
        emailVerified: true,
      };

      useAuthStore.getState().updateUser(updatedUser);

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user.emailVerified).toBe(true);
      }
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should not persist loading state to localStorage', () => {
      useAuthStore.getState().setLoading(true);

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // isLoading should not be in persisted state
        expect(parsed.state.isLoading).toBeUndefined();
      }
    });
  });

  describe('persistence and hydration', () => {
    it('should persist auth state across sessions', () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-access-token';

      // Set auth
      useAuthStore.getState().setAuth(mockUser, mockToken);

      // Check that it's persisted
      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user).toEqual(mockUser);
        expect(parsed.state.accessToken).toBe(mockToken);
        expect(parsed.state.isAuthenticated).toBe(true);
      }
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set corrupted data
      localStorage.setItem('auth-storage', 'invalid-json');

      // Should not throw and should use default state
      expect(() => {
        useAuthStore.getState();
      }).not.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
