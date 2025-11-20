/**
 * Catalog Service
 */

import { prisma } from '../utils/prisma';

export interface GetProductsParams {
  page?: number;
  perPage?: number;
  category?: string;
}

export class CatalogService {
  async getProducts(params: GetProductsParams = {}) {
    const { page = 1, perPage = 20, category } = params;
    const skip = (page - 1) * perPage;

    const where = {
      isActive: true,
      ...(category && { category }),
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

    return {
      products,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    return product;
  }
}
