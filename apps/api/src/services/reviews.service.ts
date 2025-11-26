/**
 * Reviews Service
 * Handles product reviews and ratings
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';

export interface CreateReviewInput {
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  content?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

export interface GetReviewsParams {
  page?: number;
  perPage?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export class ReviewsService {
  /**
   * Create a new review for a product
   */
  async createReview(input: CreateReviewInput) {
    const { userId, productId, rating, title, content } = input;

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

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

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    // Check if user has purchased this product (verified review)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: {
            in: ['paid', 'processing', 'shipped', 'completed'],
          },
        },
      },
    });

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title || null,
        content: content || null,
        isVerified: !!hasPurchased,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Update product's average rating and review count
    await this.updateProductRating(productId);

    return review;
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, params: GetReviewsParams = {}) {
    const { page = 1, perPage = 10, sort = 'newest' } = params;
    const skip = (page - 1) * perPage;

    // Determine sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const where = {
      productId,
      isApproved: true,
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        isApproved: true,
      },
      _count: {
        rating: true,
      },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      distribution[r.rating] = r._count.rating;
    });

    return {
      reviews,
      ratingDistribution: distribution,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a user's review for a specific product
   */
  async getUserReview(userId: string, productId: string) {
    return prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: string, userId: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('You can only edit your own reviews');
    }

    // Validate rating if provided
    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
        throw new Error('Rating must be an integer between 1 and 5');
      }
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: input.rating,
        title: input.title !== undefined ? input.title : undefined,
        content: input.content !== undefined ? input.content : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Update product's average rating if rating changed
    if (input.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product's average rating
    await this.updateProductRating(review.productId);

    return { success: true };
  }

  /**
   * Update product's cached average rating and review count
   */
  private async updateProductRating(productId: string) {
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
        reviewCount: stats._count.rating,
      },
    });
  }
}
