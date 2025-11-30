/**
 * ProtectedRoute Component Tests
 */

import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the auth context
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshAuth: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth context to unauthenticated state
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isLoading = false;
    
    // Reset store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: true, // Default to hydrated for most tests
    });
  });

  describe('loading states', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockAuthContext.isLoading = true;
      
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner, not content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading spinner when hasHydrated is false', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner while hydrating, not content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('authentication checks', () => {
    it('should render children when authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = false;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = false;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not redirect before hydration completes', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext.isAuthenticated = false;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('edge case: authenticated but user is null', () => {
    it('should show loading spinner when isAuthenticated is true but user is null', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = null; // This is the bug scenario

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner, not crash on user.username
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('requireAuth=false', () => {
    it('should render children when requireAuth is false regardless of auth state', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = false;

      render(
        <ProtectedRoute requireAuth={false}>
          <div>Public Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('should not redirect when requireAuth is false', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext.isAuthenticated = false;

      render(
        <ProtectedRoute requireAuth={false}>
          <div>Public Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
