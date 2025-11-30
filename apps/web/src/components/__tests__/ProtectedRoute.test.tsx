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

// Factory function to create fresh mock auth context
const createMockAuthContext = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshAuth: jest.fn(),
  ...overrides,
});

// Mock auth context holder
let mockAuthContext = createMockAuthContext();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Helper to create a test user
const createTestUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user' as const,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to fresh mock auth context
    mockAuthContext = createMockAuthContext();
    
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
      mockAuthContext = createMockAuthContext({ isLoading: true });
      
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner, not content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading spinner when hasHydrated is false', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestUser(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner while hydrating, not content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('authentication checks', () => {
    it('should render children when authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestUser(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({ isAuthenticated: false });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({ isAuthenticated: false });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not redirect before hydration completes', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext = createMockAuthContext({ isAuthenticated: false });

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
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: null, // This is the bug scenario
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner, not crash on user.username
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('requireAuth=false', () => {
    it('should render children when requireAuth is false regardless of auth state', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({ isAuthenticated: false });

      render(
        <ProtectedRoute requireAuth={false}>
          <div>Public Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('should not redirect when requireAuth is false', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({ isAuthenticated: false });

      render(
        <ProtectedRoute requireAuth={false}>
          <div>Public Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible loading spinner with role and aria-label', () => {
      mockAuthContext = createMockAuthContext({ isLoading: true });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
    });
  });
});
