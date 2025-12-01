/**
 * Admin Layout Component Tests
 * Tests that the admin layout properly waits for hydration before checking auth state
 */

import { render, screen } from '@testing-library/react';
import AdminLayout from '../layout';
import { useAuthStore } from '@/store/authStore';

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// User type for testing
interface TestUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: string;
}

// Helper to create a test admin user
const createTestAdminUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'admin-1',
  email: 'admin@example.com',
  username: 'adminuser',
  role: 'admin',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create a test regular user
const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

interface MockAuthContext {
  user: TestUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.Mock;
  register: jest.Mock;
  logout: jest.Mock;
  refreshAuth: jest.Mock;
}

// Factory function to create fresh mock auth context
const createMockAuthContext = (overrides: Partial<MockAuthContext> = {}): MockAuthContext => ({
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

describe('AdminLayout', () => {
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

  describe('hydration states', () => {
    it('should show loading spinner when hasHydrated is false', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestAdminUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      // Should show loading spinner while hydrating, not content
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should NOT redirect to login before hydration completes', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: false,
        user: null,
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      // Should NOT redirect before hydration
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show loading spinner when isLoading is true', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isLoading: true,
        user: createTestAdminUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      // Should show loading spinner while checking auth
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('authentication checks after hydration', () => {
    it('should render admin content when admin user is authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestAdminUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(screen.getByText('🧪 Alchemy Admin')).toBeInTheDocument();
    });

    it('should redirect to login when not authenticated and hydrated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: false,
        user: null,
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /table when non-admin user is authenticated', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/table');
    });

    it('should show access denied message for non-admin users', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('Access denied. Redirecting...')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('admin user interface', () => {
    it('should display admin username in header', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestAdminUser({ username: 'superadmin' }),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('superadmin')).toBeInTheDocument();
    });

    it('should display navigation links', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestAdminUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('📊 Dashboard')).toBeInTheDocument();
      expect(screen.getByText('📦 Products')).toBeInTheDocument();
      expect(screen.getByText('🌿 Ingredients')).toBeInTheDocument();
      expect(screen.getByText('📋 Orders')).toBeInTheDocument();
    });

    it('should have a logout button', () => {
      useAuthStore.setState({ hasHydrated: true });
      mockAuthContext = createMockAuthContext({
        isAuthenticated: true,
        user: createTestAdminUser(),
      });

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible loading spinner with role and aria-label', () => {
      useAuthStore.setState({ hasHydrated: false });
      mockAuthContext = createMockAuthContext();

      render(
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
    });
  });
});
