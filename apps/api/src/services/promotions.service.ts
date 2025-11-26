/**
 * Promotions Service
 * Handles discount codes and promotional functionality
 */

import { prisma } from '../utils/prisma';

export interface ValidateCouponInput {
  code: string;
  subtotal: number;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  validFrom: Date;
  validUntil?: Date;
}

export class PromotionsService {
  /**
   * Validate and calculate discount for a coupon code
   */
  async validateCoupon(input: ValidateCouponInput) {
    const { code, subtotal } = input;

    const coupon = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new Error('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new Error('This coupon is no longer active');
    }

    const now = new Date();

    // Check validity period
    if (now < coupon.validFrom) {
      throw new Error('This coupon is not yet valid');
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      throw new Error('This coupon has expired');
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new Error('This coupon has reached its usage limit');
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new Error(`Minimum order amount of $${Number(coupon.minOrderAmount).toFixed(2)} required`);
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      discountAmount = subtotal * (Number(coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(Number(coupon.discountValue), subtotal);
    }

    return {
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount: Math.round(discountAmount * 100) / 100,
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    };
  }

  /**
   * Get all active coupons (for admin)
   */
  async getActiveCoupons() {
    const now = new Date();

    return prisma.discountCode.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
        validFrom: { lte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get products on sale (with compareAtPrice)
   */
  async getSaleProducts(params: { page?: number; perPage?: number } = {}) {
    const { page = 1, perPage = 20 } = params;
    const skip = (page - 1) * perPage;

    const where = {
      isActive: true,
      compareAtPrice: { not: null },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate discount percentages
    const productsWithDiscounts = products.map((product) => {
      const originalPrice = Number(product.compareAtPrice);
      const currentPrice = Number(product.price);
      const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

      return {
        ...product,
        discountPercent,
        savings: Math.round((originalPrice - currentPrice) * 100) / 100,
      };
    });

    return {
      products: productsWithDiscounts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Check if a product is on sale
   */
  async isProductOnSale(productId: string): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { compareAtPrice: true, price: true },
    });

    if (!product || !product.compareAtPrice) {
      return false;
    }

    return Number(product.compareAtPrice) > Number(product.price);
  }

  /**
   * Get stock status for a product
   */
  getStockStatus(stock: number, lowStockThreshold: number = 5, trackInventory: boolean = true): {
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    label: string;
    available: number;
  } {
    if (!trackInventory) {
      return {
        status: 'in_stock',
        label: 'In Stock',
        available: 999,
      };
    }

    if (stock <= 0) {
      return {
        status: 'out_of_stock',
        label: 'Sold Out',
        available: 0,
      };
    }

    if (stock <= lowStockThreshold) {
      return {
        status: 'low_stock',
        label: `Low Stock - Only ${stock} left`,
        available: stock,
      };
    }

    return {
      status: 'in_stock',
      label: 'In Stock',
      available: stock,
    };
  }
}
