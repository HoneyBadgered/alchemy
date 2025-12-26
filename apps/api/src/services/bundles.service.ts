/**
 * Bundles Service
 * Handles product bundles, upsells, and recommendations
 */

import { prisma } from '../utils/prisma';

export interface CreateBundleInput {
  name: string;
  description?: string;
  discount: number;
  productIds: string[];
}

export interface AddRelatedProductInput {
  sourceProductId: string;
  relatedProductId: string;
  relationType: 'upsell' | 'cross-sell' | 'recommendation';
  sortOrder?: number;
}

export class BundlesService {
  /**
   * Get all active bundles
   */
  async getBundles(params: { page?: number; perPage?: number } = {}) {
    const { page = 1, perPage = 20 } = params;
    const skip = (page - 1) * perPage;

    const where = { isActive: true };

    const [bundles, total] = await Promise.all([
      prisma.product_bundles.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          bundle_items: {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  compareAtPrice: true,
                  imageUrl: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
      prisma.product_bundles.count({ where }),
    ]);

    // Calculate bundle prices
    const bundlesWithPrices = bundles.map((bundle: any) => {
      const originalPrice = bundle.bundle_items.reduce((sum: number, item: any) => {
        return sum + Number(item.products.price) * item.quantity;
      }, 0);

      const discountAmount = originalPrice * (Number(bundle.discount) / 100);
      const bundlePrice = Math.round((originalPrice - discountAmount) * 100) / 100;

      return {
        ...bundle,
        originalPrice: Math.round(originalPrice * 100) / 100,
        bundlePrice,
        savings: Math.round(discountAmount * 100) / 100,
      };
    });

    return {
      bundles: bundlesWithPrices,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a specific bundle
   */
  async getBundle(bundleId: string) {
    const bundle = await prisma.product_bundles.findUnique({
      where: { id: bundleId },
      include: {
        bundle_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                compareAtPrice: true,
                imageUrl: true,
                images: true,
                stock: true,
                isActive: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new Error('Bundle not found');
    }

    // Calculate prices
    const originalPrice = bundle.bundle_items.reduce((sum: number, item: any) => {
      return sum + Number(item.products.price) * item.quantity;
    }, 0);

    const discountAmount = originalPrice * (Number(bundle.discount) / 100);
    const bundlePrice = Math.round((originalPrice - discountAmount) * 100) / 100;

    return {
      ...bundle,
      originalPrice: Math.round(originalPrice * 100) / 100,
      bundlePrice,
      savings: Math.round(discountAmount * 100) / 100,
    };
  }

  /**
   * Get related products for a product (upsells, cross-sells, recommendations)
   */
  async getRelatedProducts(productId: string, relationType?: string) {
    const where: {
      sourceProductId: string;
      relatedProduct: { isActive: boolean };
      relationType?: string;
    } = {
      sourceProductId: productId,
      relatedProduct: { isActive: true },
    };

    if (relationType) {
      where.relationType = relationType;
    }

    const relations = await prisma.product_relations.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        products_product_relations_relatedProductIdToproducts: {
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
            category: true,
          },
        },
      },
    });

    return relations.map((r: any) => ({
      ...r.products_product_relations_relatedProductIdToproducts,
      relationType: r.relationType,
    }));
  }

  /**
   * Get "You May Also Like" recommendations
   * Returns a mix of related products and category-based suggestions
   */
  async getRecommendations(productId: string, limit: number = 4) {
    // First, try to get explicit recommendations
    const explicitRecommendations = await this.getRelatedProducts(productId, 'recommendation');

    if (explicitRecommendations.length >= limit) {
      return explicitRecommendations.slice(0, limit);
    }

    // Get the current product's category
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { category: true },
    });

    // Fill with category-based recommendations
    const remaining = limit - explicitRecommendations.length;
    const excludeIds = [productId, ...explicitRecommendations.map((p) => p.id)];

    const categoryRecommendations = await prisma.products.findMany({
      where: {
        id: { notIn: excludeIds },
        isActive: true,
        category: product?.category,
      },
      take: remaining,
      orderBy: [
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
      ],
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
        category: true,
      },
    });

    // If still not enough, get popular products from any category
    const stillRemaining = remaining - categoryRecommendations.length;
    let popularProducts: typeof categoryRecommendations = [];

    if (stillRemaining > 0) {
      const allExcludeIds = [...excludeIds, ...categoryRecommendations.map((p) => p.id)];
      popularProducts = await prisma.products.findMany({
        where: {
          id: { notIn: allExcludeIds },
          isActive: true,
        },
        take: stillRemaining,
        orderBy: [
          { reviewCount: 'desc' },
          { averageRating: 'desc' },
        ],
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
          category: true,
        },
      });
    }

    return [
      ...explicitRecommendations,
      ...categoryRecommendations.map((p) => ({ ...p, relationType: 'category' })),
      ...popularProducts.map((p) => ({ ...p, relationType: 'popular' })),
    ];
  }

  /**
   * Get upsell products for cart
   */
  async getCartUpsells(productIds: string[], limit: number = 4) {
    // Get all upsells for products in cart
    const upsells = await prisma.product_relations.findMany({
      where: {
        sourceProductId: { in: productIds },
        relationType: 'upsell',
        relatedProductId: { notIn: productIds }, // Don't suggest items already in cart
        products_product_relations_relatedProductIdToproducts: { isActive: true },
      },
      include: {
        products_product_relations_relatedProductIdToproducts: {
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
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });

    return upsells.map((u: any) => u.products_product_relations_relatedProductIdToproducts);
  }
}
