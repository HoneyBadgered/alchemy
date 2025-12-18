/**
 * Admin Product Management Service
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

export interface ProductFilters {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock?: number;
  isActive?: boolean;
}

export class AdminProductService {
  /**
   * Get paginated list of products with filtering
   */
  async getProducts(filters: ProductFilters) {
    const {
      page = 1,
      perPage = 20,
      search,
      category,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.productsWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
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

  /**
   * Get single product by ID
   */
  async getProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductInput) {
    const product = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        images: data.images || [],
        category: data.category,
        tags: data.tags || [],
        stock: data.stock ?? 0,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductInput) {
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return product;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    await prisma.product.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle product visibility
   */
  async toggleProductVisibility(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });

    return updated;
  }

  /**
   * Get product categories
   */
  async getCategories() {
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null },
      },
    });

    return products
      .map((p) => p.category)
      .filter((c): c is string => c !== null)
      .sort();
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10) {
    const products = await prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true,
      },
      orderBy: { stock: 'asc' },
    });

    return products;
  }
}
