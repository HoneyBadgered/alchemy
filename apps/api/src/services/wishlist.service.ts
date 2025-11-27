/**
 * Wishlist Service
 * Handles user wishlists / save for later functionality
 */

import { prisma } from '../utils/prisma';

export interface AddToWishlistInput {
  userId: string;
  productId: string;
}

export interface GetWishlistParams {
  page?: number;
  perPage?: number;
}

export class WishlistService {
  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(input: AddToWishlistInput) {
    const { userId, productId } = input;

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new Error('Product is already in your wishlist');
    }

    // Add to wishlist
    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            compareAtPrice: true,
            imageUrl: true,
            stock: true,
            lowStockThreshold: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    });

    return item;
  }

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(userId: string, productId: string) {
    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!item) {
      throw new Error('Product not found in wishlist');
    }

    await prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return { success: true };
  }

  /**
   * Get the user's wishlist
   */
  async getWishlist(userId: string, params: GetWishlistParams = {}) {
    const { page = 1, perPage = 20 } = params;
    const skip = (page - 1) * perPage;

    const where = { userId };

    const [items, total] = await Promise.all([
      prisma.wishlistItem.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              compareAtPrice: true,
              imageUrl: true,
              images: true,
              category: true,
              stock: true,
              lowStockThreshold: true,
              isActive: true,
              averageRating: true,
              reviewCount: true,
            },
          },
        },
      }),
      prisma.wishlistItem.count({ where }),
    ]);

    // Filter out inactive products
    const activeItems = items.filter((item) => item.product.isActive);

    return {
      items: activeItems,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Check if a product is in the user's wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!item;
  }

  /**
   * Get wishlist item count for a user
   */
  async getWishlistCount(userId: string): Promise<number> {
    return prisma.wishlistItem.count({
      where: { userId },
    });
  }

  /**
   * Move item from wishlist to cart
   */
  async moveToCart(userId: string, productId: string) {
    // This will be handled by the cart service
    // First remove from wishlist
    await this.removeFromWishlist(userId, productId);
    
    return { success: true, message: 'Item removed from wishlist. Please add to cart separately.' };
  }

  /**
   * Clear all items from wishlist
   */
  async clearWishlist(userId: string) {
    await prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    return { success: true };
  }
}
