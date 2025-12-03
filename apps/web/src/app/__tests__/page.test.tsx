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
  usePathname: () => '/',
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

// Mock the cart context for Header component
const mockCartContext = {
  cart: null,
  isLoading: false,
  itemCount: 0,
  subtotal: 0,
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  refreshCart: jest.fn(),
};

jest.mock('@/contexts/CartContext', () => ({
  useCart: () => mockCartContext,
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth context to unauthenticated state
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isLoading = false;
  });

  describe('hero section', () => {
    it('should render the homepage title', () => {
      render(<HomePage />);
      expect(screen.getByRole('heading', { level: 1, name: /The Alchemy Table/i })).toBeInTheDocument();
    });

    it('should render the hero description', () => {
      render(<HomePage />);
      expect(screen.getByText(/Craft your perfect blend with magical ingredients/i)).toBeInTheDocument();
    });

    it('should render Shop Now CTA', () => {
      render(<HomePage />);
      const shopLink = screen.getByRole('link', { name: /Shop Now/i });
      expect(shopLink).toBeInTheDocument();
      expect(shopLink).toHaveAttribute('href', '/shop');
    });

    it('should render Create Your Blend CTA in hero section', () => {
      render(<HomePage />);
      // Use getAllByRole since there are multiple links with similar text (header and hero)
      const blendLinks = screen.getAllByRole('link', { name: /Create Your Blend/i });
      expect(blendLinks.length).toBeGreaterThan(0);
      // Check that at least one links to /table
      const tableLink = blendLinks.find(link => link.getAttribute('href') === '/table');
      expect(tableLink).toBeDefined();
    });
  });

  describe('features section', () => {
    it('should render feature highlights as headings', () => {
      render(<HomePage />);
      // Use getByRole to target the h3 headings specifically
      expect(screen.getByRole('heading', { name: /Magical Ingredients/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Gamified Experience/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Custom Blends/i })).toBeInTheDocument();
    });

    it('should render the features section heading', () => {
      render(<HomePage />);
      expect(screen.getByText(/Why Choose The Alchemy Table/i)).toBeInTheDocument();
    });
  });

  describe('CTA section', () => {
    it('should render the CTA section with Sign Up link', () => {
      render(<HomePage />);
      const signUpLinks = screen.getAllByRole('link', { name: /Sign Up Free/i });
      expect(signUpLinks.length).toBeGreaterThan(0);
      expect(signUpLinks[0]).toHaveAttribute('href', '/signup');
    });

    it('should render the Explore Library link', () => {
      render(<HomePage />);
      const libraryLink = screen.getByRole('link', { name: /Explore the Library/i });
      expect(libraryLink).toBeInTheDocument();
      expect(libraryLink).toHaveAttribute('href', '/library');
    });
  });

  describe('header', () => {
    it('should render the header with logo', () => {
      render(<HomePage />);
      // Header contains the site name/logo
      const homeLinks = screen.getAllByRole('link', { name: /The Alchemy Table/i });
      expect(homeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('footer', () => {
    it('should render the footer with navigation links', () => {
      render(<HomePage />);
      // Check for footer links
      expect(screen.getByRole('link', { name: /All Products/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /FAQ/i })).toBeInTheDocument();
    });
  });
});
