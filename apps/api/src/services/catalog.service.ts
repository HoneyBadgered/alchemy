/**
 * Catalog Service
 */

import { prisma } from '../utils/prisma';

export interface GetProductsParams {
  page?: number;
  perPage?: number;
  category?: string;
  zone?: string;
  onSale?: boolean;
}

export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  available: number;
}

export class CatalogService {
  async getProducts(params: GetProductsParams = {}) {
    const { page = 1, perPage = 20, category, zone, onSale } = params;
    const skip = (page - 1) * perPage;

    const where: any = {
      isActive: true,
    };

    // Filter by zone if provided (checks zones JSON array)
    if (zone && zone !== 'null' && zone !== 'undefined') {
      where.zones = {
        has: zone,
      };
    } else if (category) {
      // Filter by category if zone not provided
      where.category = category;
    } else {
      // Exclude custom blends from public catalog by default
      where.category = { not: 'custom-blend' };
    }

    if (onSale) {
      where.compareAtPrice = { not: null };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.products.count({ where }),
    ]);

    // Enhance products with stock status and sale info
    const enhancedProducts = products.map((product) => ({
      ...product,
      stockStatus: this.getStockStatus(product.stock, product.lowStockThreshold, product.trackInventory),
      isOnSale: product.compareAtPrice ? Number(product.compareAtPrice) > Number(product.price) : false,
      discountPercent: product.compareAtPrice 
        ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
        : null,
    }));

    return {
      products: enhancedProducts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getProduct(id: string) {
    const product = await prisma.products.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Enhance with stock status and sale info
    return {
      ...product,
      stockStatus: this.getStockStatus(product.stock, product.lowStockThreshold, product.trackInventory),
      isOnSale: product.compareAtPrice ? Number(product.compareAtPrice) > Number(product.price) : false,
      discountPercent: product.compareAtPrice 
        ? Math.round(((Number(product.compareAtPrice) - Number(product.price)) / Number(product.compareAtPrice)) * 100)
        : null,
    };
  }

  /**
   * Get stock status for a product
   */
  getStockStatus(stock: number, lowStockThreshold: number = 5, trackInventory: boolean = true): StockStatus {
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
