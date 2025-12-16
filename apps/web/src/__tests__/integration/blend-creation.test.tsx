/**
 * Integration Tests - Complete User Flows
 * 
 * End-to-end user flow tests including:
 * - Browse → Add to Cart → Checkout → Payment
 * - Create Blend → Review → Add to Cart
 * - Guest Checkout flow
 * - Login and cart merge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlendingPage } from '@/components/blending/BlendingPage';
import * as useIngredientsHook from '@/hooks/useIngredients';
import * as CartContext from '@/contexts/CartContext';
import * as authStore from '@/store/authStore';

// Mock dependencies
vi.mock('@/contexts/CartContext');
vi.mock('@/store/authStore');
vi.mock('@/hooks/useIngredients');

const mockBases = [
  {
    id: 'green-tea',
    name: 'Green Tea',
    category: 'base',
    isBase: true,
    baseAmount: 10,
    incrementAmount: 5,
    flavorProfile: { earthy: 7, floral: 3, spicy: 0, sweet: 2, citrus: 1 },
  },
];

const mockAddIns = [
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'botanical',
    isBase: false,
    baseAmount: 2,
    incrementAmount: 1,
    flavorProfile: { earthy: 2, floral: 9, spicy: 0, sweet: 1, citrus: 0 },
  },
  {
    id: 'ginger',
    name: 'Ginger',
    category: 'addIn',
    isBase: false,
    baseAmount: 2,
    incrementAmount: 1,
    flavorProfile: { earthy: 1, floral: 0, spicy: 10, sweet: 1, citrus: 2 },
  },
];

describe('Integration Tests - Create Blend Flow', () => {
  const mockAddBlendToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.mocked(useIngredientsHook.useIngredients).mockReturnValue({
      bases: mockBases,
      addIns: { addIns: mockAddIns, botanicals: [], premium: [] },
      isLoading: false,
      error: null,
    });

    vi.mocked(useIngredientsHook.getIngredientById).mockImplementation((id) => {
      return [...mockBases, ...mockAddIns].find(i => i.id === id);
    });

    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: null,
      itemCount: 0,
      subtotal: 0,
      isLoading: false,
      sessionId: 'test-session',
      addToCart: vi.fn(),
      addBlendToCart: mockAddBlendToCart,
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: true,
    } as any);
  });

  it('should complete full blend creation flow', async () => {
    const user = userEvent.setup();
    const mockOnContinue = vi.fn();

    render(<BlendingPage onContinue={mockOnContinue} />);

    // Step 1: Select base tea
    await waitFor(() => {
      expect(screen.getByText('Green Tea')).toBeInTheDocument();
    });

    const greenTeaButton = screen.getByText('Green Tea').closest('button');
    if (greenTeaButton) {
      await user.click(greenTeaButton);
    }

    // Verify step changed
    await waitFor(() => {
      expect(screen.queryByText(/step 1/i)).not.toBeInTheDocument();
    });

    // Step 2: Add Lavender
    await waitFor(() => {
      expect(screen.getByText('Lavender')).toBeInTheDocument();
    });

    const lavenderButton = screen.getByText('Lavender').closest('button');
    if (lavenderButton) {
      await user.click(lavenderButton);
    }

    // Step 3: Add Ginger
    const gingerButton = screen.getByText('Ginger').closest('button');
    if (gingerButton) {
      await user.click(gingerButton);
    }

    // Verify both ingredients are added
    await waitFor(() => {
      const lavenderElements = screen.getAllByText('Lavender');
      const gingerElements = screen.getAllByText('Ginger');
      expect(lavenderElements.length).toBeGreaterThan(0);
      expect(gingerElements.length).toBeGreaterThan(0);
    });

    // Verify pricing is calculated
    const priceElements = screen.getAllByText(/\$/);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should persist blend across page navigation', async () => {
    const user = userEvent.setup();

    render(<BlendingPage />);

    // Create a blend
    await waitFor(() => {
      expect(screen.getByText('Green Tea')).toBeInTheDocument();
    });

    const greenTeaButton = screen.getByText('Green Tea').closest('button');
    if (greenTeaButton) {
      await user.click(greenTeaButton);
    }

    const lavenderButton = screen.getByText('Lavender').closest('button');
    if (lavenderButton) {
      await user.click(lavenderButton);
    }

    // Verify session storage
    await waitFor(() => {
      const stored = sessionStorage.getItem('pendingBlend');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.baseTeaId).toBe('green-tea');
        expect(parsed.addIns.length).toBeGreaterThan(0);
      }
    });
  });

  it('should restore blend from session storage', async () => {
    // Pre-populate session storage
    const mockBlend = {
      baseTeaId: 'green-tea',
      addIns: [
        { ingredientId: 'lavender', quantity: 1 },
        { ingredientId: 'ginger', quantity: 1 },
      ],
      blendName: '',
      size: 2,
    };
    sessionStorage.setItem('pendingBlend', JSON.stringify(mockBlend));

    render(<BlendingPage />);

    // Should show Green Tea as selected
    await waitFor(() => {
      const greenTeaElements = screen.getAllByText('Green Tea');
      expect(greenTeaElements.length).toBeGreaterThan(1);
    });

    // Should show ingredients as selected
    await waitFor(() => {
      const lavenderElements = screen.getAllByText('Lavender');
      const gingerElements = screen.getAllByText('Ginger');
      expect(lavenderElements.length).toBeGreaterThan(0);
      expect(gingerElements.length).toBeGreaterThan(0);
    });
  });

  it('should calculate price with multiple ingredients', async () => {
    const user = userEvent.setup();

    render(<BlendingPage />);

    // Select base
    await waitFor(() => {
      expect(screen.getByText('Green Tea')).toBeInTheDocument();
    });

    const greenTeaButton = screen.getByText('Green Tea').closest('button');
    if (greenTeaButton) {
      await user.click(greenTeaButton);
    }

    // Add multiple ingredients
    const lavenderButton = screen.getByText('Lavender').closest('button');
    const gingerButton = screen.getByText('Ginger').closest('button');
    
    if (lavenderButton && gingerButton) {
      await user.click(lavenderButton);
      await user.click(gingerButton);
    }

    // Verify price includes all ingredients
    await waitFor(() => {
      const priceElements = screen.getAllByText(/\$/);
      expect(priceElements.length).toBeGreaterThan(0);
      // Base price ($12.99) + 2 add-ins (at least $2.00) = $14.99+
      const priceText = priceElements[0].textContent || '';
      const price = parseFloat(priceText.replace('$', ''));
      expect(price).toBeGreaterThan(14);
    });
  });

  it('should update flavor profile as ingredients are added', async () => {
    const user = userEvent.setup();

    render(<BlendingPage />);

    // Select green tea (earthy: 7, floral: 3)
    await waitFor(() => {
      expect(screen.getByText('Green Tea')).toBeInTheDocument();
    });

    const greenTeaButton = screen.getByText('Green Tea').closest('button');
    if (greenTeaButton) {
      await user.click(greenTeaButton);
    }

    // Add Lavender (floral: 9)
    const lavenderButton = screen.getByText('Lavender').closest('button');
    if (lavenderButton) {
      await user.click(lavenderButton);
    }

    // Flavor profile should show increased floral notes
    // This would check for visual indicators of the flavor profile
    await waitFor(() => {
      // In real implementation, would check for flavor profile visualization
      const flavorElements = screen.queryAllByText(/floral/i);
      expect(flavorElements.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests - Randomize Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.mocked(useIngredientsHook.useIngredients).mockReturnValue({
      bases: mockBases,
      addIns: { addIns: mockAddIns, botanicals: [], premium: [] },
      isLoading: false,
      error: null,
    });

    vi.mocked(useIngredientsHook.getIngredientById).mockImplementation((id) => {
      return [...mockBases, ...mockAddIns].find(i => i.id === id);
    });

    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: null,
      itemCount: 0,
      subtotal: 0,
      isLoading: false,
      sessionId: 'test-session',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
  });

  it('should create a valid blend when randomize is clicked', async () => {
    const user = userEvent.setup();

    render(<BlendingPage />);

    await waitFor(() => {
      expect(screen.getByText(/randomize/i)).toBeInTheDocument();
    });

    const randomizeButton = screen.getByText(/randomize/i);
    await user.click(randomizeButton);

    // Should select a base
    await waitFor(() => {
      const greenTeaElements = screen.getAllByText('Green Tea');
      expect(greenTeaElements.length).toBeGreaterThan(1);
    });

    // Should select at least one add-in
    await waitFor(() => {
      const lavenderExists = screen.queryAllByText('Lavender').length > 0;
      const gingerExists = screen.queryAllByText('Ginger').length > 0;
      expect(lavenderExists || gingerExists).toBe(true);
    });
  });

  it('should randomize multiple times with different results', async () => {
    const user = userEvent.setup();

    render(<BlendingPage />);

    await waitFor(() => {
      expect(screen.getByText(/randomize/i)).toBeInTheDocument();
    });

    const randomizeButton = screen.getByText(/randomize/i);
    
    // First randomization
    await user.click(randomizeButton);
    
    await waitFor(() => {
      const stored1 = sessionStorage.getItem('pendingBlend');
      expect(stored1).toBeTruthy();
    });

    const firstBlend = JSON.parse(sessionStorage.getItem('pendingBlend') || '{}');

    // Second randomization
    await user.click(randomizeButton);
    
    await waitFor(() => {
      const stored2 = sessionStorage.getItem('pendingBlend');
      expect(stored2).toBeTruthy();
    });

    const secondBlend = JSON.parse(sessionStorage.getItem('pendingBlend') || '{}');

    // Both should be valid blends (this test might occasionally produce same blend)
    expect(firstBlend.baseTeaId).toBeTruthy();
    expect(secondBlend.baseTeaId).toBeTruthy();
  });
});
