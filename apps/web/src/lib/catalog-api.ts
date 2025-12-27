/**
 * Catalog API Client - Extended with reviews, wishlist, and recommendations
 */

import type {
  Product,
  Review,
  ReviewsResponse,
  WishlistItem,
  WishlistResponse,
  CouponValidation,
  RecommendedProduct,
  StockStatus,
} from '@alchemy/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  lowStockThreshold: number;
  averageRating?: number;
  reviewCount: number;
  category?: string;
  relationType?: string;
}

// API Client
export const catalogApi = {
  /**
   * Get product reviews
   */
  async getProductReviews(
    productId: string,
    params?: { page?: number; perPage?: number; sort?: string }
  ): Promise<ReviewsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
    if (params?.sort) searchParams.set('sort', params.sort);

    const response = await fetch(
      `${API_URL}/products/${productId}/reviews?${searchParams.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    return response.json();
  },

  /**
   * Create a review
   */
  async createReview(
    data: {
      productId: string;
      rating: number;
      title?: string;
      content?: string;
    },
    token: string
  ): Promise<Review> {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    return response.json();
  },

  /**
   * Get user's own review for a product
   */
  async getMyReview(productId: string, token: string): Promise<Review | null> {
    const response = await fetch(`${API_URL}/reviews/my/${productId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch review');
    }

    return response.json();
  },

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    data: { rating?: number; title?: string; content?: string },
    token: string
  ): Promise<Review> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return response.json();
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }
  },

  /**
   * Get wishlist
   */
  async getWishlist(
    token: string,
    params?: { page?: number; perPage?: number }
  ): Promise<WishlistResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());

    const response = await fetch(`${API_URL}/wishlist?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }

    return response.json();
  },

  /**
   * Add to wishlist
   */
  async addToWishlist(productId: string, token: string): Promise<WishlistItem> {
    const response = await fetch(`${API_URL}/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to wishlist');
    }

    return response.json();
  },

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(productId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove from wishlist');
    }
  },

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(productId: string, token: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/wishlist/check/${productId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isInWishlist;
  },

  /**
   * Get wishlist count
   */
  async getWishlistCount(token: string): Promise<number> {
    const response = await fetch(`${API_URL}/wishlist/count`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count;
  },

  /**
   * Validate coupon code
   */
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    const response = await fetch(`${API_URL}/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code, subtotal }),
    });

    return response.json();
  },

  /**
   * Get product recommendations
   */
  async getRecommendations(
    productId: string,
    limit?: number
  ): Promise<{ products: RecommendedProduct[] }> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', limit.toString());

    const response = await fetch(
      `${API_URL}/products/${productId}/recommendations?${searchParams.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }

    return response.json();
  },

  /**
   * Get cart upsells
   */
  async getCartUpsells(
    productIds: string[],
    limit?: number
  ): Promise<{ products: RecommendedProduct[] }> {
    const searchParams = new URLSearchParams();
    searchParams.set('productIds', productIds.join(','));
    if (limit) searchParams.set('limit', limit.toString());

    const response = await fetch(`${API_URL}/cart/upsells?${searchParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch upsells');
    }

    return response.json();
  },

  /**
   * Get sale products
   */
  async getSaleProducts(params?: {
    page?: number;
    perPage?: number;
  }): Promise<{ products: Product[]; pagination: object }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());

    const response = await fetch(`${API_URL}/promotions/sale?${searchParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sale products');
    }

    return response.json();
  },
};
