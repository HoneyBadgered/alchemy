/**
 * Homepage Tests
 */

import { render, screen } from '@testing-library/react';
import HomePage from '../page';

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

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth context to unauthenticated state
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isLoading = false;
  });

  describe('for unauthenticated users', () => {
    it('should render the homepage title', () => {
      render(<HomePage />);
      expect(screen.getByText(/The Alchemy Table/)).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<HomePage />);
      expect(screen.getByText(/A gamified e-commerce platform/)).toBeInTheDocument();
    });

    it('should render Sign Up link', () => {
      render(<HomePage />);
      const signUpLink = screen.getByRole('link', { name: /Sign Up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });

    it('should render Sign In link', () => {
      render(<HomePage />);
      const signInLink = screen.getByRole('link', { name: /Sign In/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render feature highlights', () => {
      render(<HomePage />);
      expect(screen.getByText(/Create unique blends/)).toBeInTheDocument();
      expect(screen.getByText(/Gamified experience/)).toBeInTheDocument();
      expect(screen.getByText(/Shop for premium ingredients/)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when auth is loading', () => {
      mockAuthContext.isLoading = true;
      render(<HomePage />);
      expect(screen.getByText(/Loading.../)).toBeInTheDocument();
    });
  });

  describe('for authenticated users', () => {
    it('should redirect regular users to /table', () => {
      mockAuthContext.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isLoading = false;

      render(<HomePage />);
      
      expect(mockPush).toHaveBeenCalledWith('/table');
    });

    it('should redirect admin users to /admin/dashboard', () => {
      mockAuthContext.user = {
        id: 'admin-1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isLoading = false;

      render(<HomePage />);
      
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
