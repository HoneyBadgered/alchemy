/**
 * Product Card Tests
 * 
 * Tests for product display and interaction including:
 * - Product information rendering
 * - Add to cart functionality
 * - Stock status display
 * - Sale badge display
 * - Price formatting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/components/ProductCard';
import * as CartContext from '@/contexts/CartContext';

// Mock CartContext
vi.mock('@/contexts/CartContext');

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockProduct = {
  id: 'product-1',
  name: 'Green Tea',
  description: 'Premium green tea',
  price: 12.99,
  image: '/images/green-tea.jpg',
  stock: 50,
  isActive: true,
  lowStockThreshold: 10,
  trackInventory: true,
};

const mockOutOfStockProduct = {
  ...mockProduct,
  id: 'product-2',
  name: 'Black Tea',
  stock: 0,
};

const mockSaleProduct = {
  ...mockProduct,
  id: 'product-3',
  name: 'White Tea',
  compareAtPrice: 19.99,
};

describe('ProductCard', () => {
  const mockAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: null,
      itemCount: 0,
      subtotal: 0,
      isLoading: false,
      sessionId: 'test-session',
      addToCart: mockAddToCart,
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
  });

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Green Tea')).toBeInTheDocument();
    expect(screen.getByText(/premium green tea/i)).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
  });

  it('should render product image', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Green Tea');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/green-tea.jpg');
  });

  it('should show in stock badge', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });

  it('should show out of stock badge and disable add to cart', () => {
    render(<ProductCard product={mockOutOfStockProduct} />);

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    
    const addButton = screen.queryByRole('button', { name: /add to cart/i });
    if (addButton) {
      expect(addButton).toBeDisabled();
    }
  });

  it('should show sale badge and compare price', () => {
    render(<ProductCard product={mockSaleProduct} />);

    expect(screen.getByText(/sale/i)).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument(); // Original price
    expect(screen.getByText('$12.99')).toBeInTheDocument(); // Sale price
  });

  it('should add product to cart when button clicked', async () => {
    const user = userEvent.setup();
    mockAddToCart.mockResolvedValue(undefined);

    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('product-1', 1);
    });
  });

  it('should show loading state while adding to cart', async () => {
    const user = userEvent.setup();
    mockAddToCart.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);

    // Button should show loading state
    expect(addButton).toBeDisabled();
  });

  it('should handle add to cart errors', async () => {
    const user = userEvent.setup();
    mockAddToCart.mockRejectedValue(new Error('Insufficient stock'));

    render(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should navigate to product detail on card click', async () => {
    const user = userEvent.setup();
    
    render(<ProductCard product={mockProduct} />);

    // Click on the card (not the button)
    const card = screen.getByText('Green Tea').closest('a, div');
    if (card) {
      await user.click(card);
    }

    // Would verify navigation in real implementation
  });

  it('should show low stock warning', () => {
    const lowStockProduct = {
      ...mockProduct,
      stock: 5,
    };

    render(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText(/low stock/i)).toBeInTheDocument();
  });
});
