/**
 * Purchase History Service ("Apothecary Shelf")
 * Handles purchase memory, history, and personalized recommendations
 */

import { prisma } from '../utils/prisma';

export interface PurchaseHistoryItem {
  productId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string | null;
  price: number;
  totalQuantityPurchased: number;
  totalSpent: number;
  firstPurchaseDate: Date;
  lastPurchaseDate: Date;
  purchaseCount: number;
  averageRating: number | null;
  userReview: {
    rating: number;
    title: string | null;
    content: string | null;
  } | null;
}

export interface PurchaseFrequencyMetrics {
  productId: string;
  name: string;
  averageDaysBetweenPurchases: number;
  lastPurchaseDate: Date;
  daysSinceLastPurchase: number;
  suggestedReorderDate: Date;
}

export class PurchaseHistoryService {
  /**
   * Get user's purchase history (Apothecary Shelf)
   */
  async getPurchaseHistory(
    userId: string,
    params: { page?: number; perPage?: number; category?: string } = {}
  ) {
    const { page = 1, perPage = 20, category } = params;
    const skip = (page - 1) * perPage;

    // Get all completed orders for the user
    const orders = await prisma.orders.findMany({
      where: {
        userId,
        status: { in: ['paid', 'processing', 'shipped', 'completed'] },
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                category: true,
                price: true,
                averageRating: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user reviews
    const reviews = await prisma.reviews.findMany({
      where: { userId },
      select: {
        productId: true,
        rating: true,
        title: true,
        content: true,
      },
    });

    type ReviewType = typeof reviews[number];
    const reviewMap = new Map<string, ReviewType>(reviews.map((r: any) => [r.productId, r]));

    // Aggregate purchase data by product
    const productPurchases = new Map<string, {
      products: typeof orders[0]['order_items'][0]['products'];
      totalQuantity: number;
      totalSpent: number;
      purchaseDates: Date[];
    }>();

    for (const order of orders) {
      for (const item of order.order_items) {
        const existing = productPurchases.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalSpent += Number(item.price) * item.quantity;
          existing.purchaseDates.push(order.createdAt);
        } else {
          productPurchases.set(item.productId, {
            products: item.products,
            totalQuantity: item.quantity,
            totalSpent: Number(item.price) * item.quantity,
            purchaseDates: [order.createdAt],
          });
        }
      }
    }

    // Convert to array and filter by category if needed
    // Note: Orders are sorted by createdAt desc, so purchaseDates[0] is most recent
    let purchaseHistory: PurchaseHistoryItem[] = Array.from(productPurchases.entries())
      .map(([productId, data]) => {
        const review = reviewMap.get(productId);
        // purchaseDates are in desc order (newest first) since orders are sorted desc
        const sortedDates = [...data.purchaseDates].sort((a, b) => a.getTime() - b.getTime());
        return {
          productId,
          name: data.product.name,
          description: data.product.description,
          imageUrl: data.product.imageUrl,
          category: data.product.category,
          price: Number(data.product.price),
          totalQuantityPurchased: data.totalQuantity,
          totalSpent: data.totalSpent,
          firstPurchaseDate: sortedDates[0],
          lastPurchaseDate: sortedDates[sortedDates.length - 1],
          purchaseCount: data.purchaseDates.length,
          averageRating: data.product.averageRating ? Number(data.product.averageRating) : null,
          userReview: review
            ? {
                rating: review.rating,
                title: review.title,
                content: review.content,
              }
            : null,
        };
      })
      .sort((a, b) => b.lastPurchaseDate.getTime() - a.lastPurchaseDate.getTime());

    if (category) {
      purchaseHistory = purchaseHistory.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    const total = purchaseHistory.length;
    const paginatedHistory = purchaseHistory.slice(skip, skip + perPage);

    return {
      order_items: paginatedHistory,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get purchase frequency metrics for products
   */
  async getPurchaseFrequencyMetrics(userId: string): Promise<PurchaseFrequencyMetrics[]> {
    // Get all completed orders for the user
    const orders = await prisma.orders.findMany({
      where: {
        userId,
        status: { in: ['paid', 'processing', 'shipped', 'completed'] },
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate purchase dates by product
    const productPurchaseDates = new Map<string, { name: string; dates: Date[] }>();

    for (const order of orders) {
      for (const item of order.order_items) {
        const existing = productPurchaseDates.get(item.productId);
        if (existing) {
          existing.dates.push(order.createdAt);
        } else {
          productPurchaseDates.set(item.productId, {
            name: item.products.name,
            dates: [order.createdAt],
          });
        }
      }
    }

    // Calculate frequency metrics for products purchased more than once
    const metrics: PurchaseFrequencyMetrics[] = [];
    const now = new Date();

    for (const [productId, data] of productPurchaseDates.entries()) {
      if (data.dates.length < 2) continue;

      // Calculate average days between purchases
      let totalDaysBetween = 0;
      for (let i = 1; i < data.dates.length; i++) {
        const diff = data.dates[i].getTime() - data.dates[i - 1].getTime();
        totalDaysBetween += diff / (1000 * 60 * 60 * 24);
      }
      const averageDaysBetween = totalDaysBetween / (data.dates.length - 1);

      const lastPurchaseDate = data.dates[data.dates.length - 1];
      const daysSinceLastPurchase = Math.floor(
        (now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Suggest reorder date
      const suggestedReorderDate = new Date(lastPurchaseDate);
      suggestedReorderDate.setDate(suggestedReorderDate.getDate() + Math.round(averageDaysBetween));

      metrics.push({
        productId,
        name: data.name,
        averageDaysBetweenPurchases: Math.round(averageDaysBetween),
        lastPurchaseDate,
        daysSinceLastPurchase,
        suggestedReorderDate,
      });
    }

    // Sort by days overdue (suggested date in the past first)
    return metrics.sort((a, b) => {
      const overdueA = now.getTime() - a.suggestedReorderDate.getTime();
      const overdueB = now.getTime() - b.suggestedReorderDate.getTime();
      return overdueB - overdueA;
    });
  }

  /**
   * Get personalized recommendations based on purchase history
   */
  async getRecommendations(userId: string, limit: number = 10) {
    // Get user's purchase history
    const orders = await prisma.orders.findMany({
      where: {
        userId,
        status: { in: ['paid', 'processing', 'shipped', 'completed'] },
      },
      include: {
        order_items: true,
      },
    });

    const purchasedProductIds = new Set(
      orders.flatMap((o) => o.order_items.map((i) => i.productId))
    );

    // Get categories the user has purchased from
    const purchasedProducts = await prisma.products.findMany({
      where: {
        id: { in: Array.from(purchasedProductIds) },
      },
      select: { category: true },
    });

    const preferredCategories = [...new Set(
      purchasedProducts.map((p) => p.category).filter(Boolean)
    )] as string[];

    // Get recommendations: products from preferred categories not yet purchased
    const recommendations = await prisma.products.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(purchasedProductIds) },
        category: { in: preferredCategories },
        stock: { gt: 0 },
      },
      orderBy: [
        { averageRating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        category: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    // If not enough from preferred categories, add top-rated products
    if (recommendations.length < limit) {
      const additional = await prisma.products.findMany({
        where: {
          isActive: true,
          id: { notIn: [...purchasedProductIds, ...recommendations.map((r) => r.id)] },
          stock: { gt: 0 },
        },
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' },
        ],
        take: limit - recommendations.length,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          category: true,
          averageRating: true,
          reviewCount: true,
        },
      });
      recommendations.push(...additional);
    }

    return recommendations.map((p) => ({
      ...p,
      price: Number(p.price),
      averageRating: p.averageRating ? Number(p.averageRating) : null,
    }));
  }

  /**
   * Get purchase statistics for a user
   */
  async getPurchaseStats(userId: string) {
    const orders = await prisma.orders.findMany({
      where: {
        userId,
        status: { in: ['paid', 'processing', 'shipped', 'completed'] },
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalItems = orders.reduce(
      (sum, o) => sum + o.order_items.reduce((itemSum, i) => itemSum + i.quantity, 0),
      0
    );

    const uniqueProducts = new Set(
      orders.flatMap((o) => o.order_items.map((i) => i.productId))
    );

    // Find favorite category using already-included product data
    const categoryCount = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.order_items) {
        const category = item.product?.category;
        if (category) {
          categoryCount.set(
            category,
            (categoryCount.get(category) || 0) + item.quantity
          );
        }
      }
    }

    let favoriteCategory: string | null = null;
    let maxCount = 0;
    for (const [category, count] of categoryCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = category;
      }
    }

    return {
      totalOrders,
      totalSpent,
      totalItemsPurchased: totalItems,
      uniqueProductsPurchased: uniqueProducts.size,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      favoriteCategory,
    };
  }

  /**
   * Get reorder data for an order
   */
  async getReorderData(userId: string, orderId: string) {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                isActive: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const reorderItems = order.order_items.map((item) => ({
      productId: item.productId,
      name: item.products.name,
      quantity: item.quantity,
      originalPrice: Number(item.price),
      currentPrice: Number(item.products.price),
      priceChanged: Number(item.price) !== Number(item.products.price),
      imageUrl: item.products.imageUrl,
      isAvailable: item.products.isActive && item.products.stock >= item.quantity,
      availableStock: item.products.stock,
    }));

    const allAvailable = reorderItems.every((item) => item.isAvailable);

    return {
      orderId: order.id,
      originalOrderDate: order.createdAt,
      order_items: reorderItems,
      allItemsAvailable: allAvailable,
      estimatedTotal: reorderItems.reduce(
        (sum, item) => sum + item.currentPrice * item.quantity,
        0
      ),
    };
  }
}
