/**
 * Reviews Service
 * Handles product reviews and ratings
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import sanitizeHtml from 'sanitize-html';

// Sanitization config for review content
const sanitizeConfig = {
  allowedTags: [], // No HTML tags allowed, plain text only
  allowedAttributes: {},
  disallowedTagsMode: 'discard' as const,
};

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
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    // Sanitize user input to prevent XSS attacks
    const sanitizedTitle = title ? sanitizeHtml(title, sanitizeConfig).trim() : undefined;
    const sanitizedContent = content ? sanitizeHtml(content, sanitizeConfig).trim() : undefined;

    // Check if product exists and is active
    const product = await prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestError('Product is not available');
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.reviews.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('You have already reviewed this product');
    }

    // Check if user has purchased this product (verified review)
    const hasPurchased = await prisma.order_items.findFirst({
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
    const review = await prisma.reviews.create({
      data: {
        userId,
        productId,
        rating,
        title: sanitizedTitle || null,
        content: sanitizedContent || null,
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
    let orderBy: Prisma.reviewsOrderByWithRelationInput;
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
      prisma.reviews.findMany({
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
      prisma.reviews.count({ where }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.reviews.groupBy({
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
    return prisma.reviews.findUnique({
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
    const review = await prisma.reviews.findUnique({
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

    // Sanitize user input to prevent XSS attacks
    const sanitizedTitle = input.title ? sanitizeHtml(input.title, sanitizeConfig).trim() : undefined;
    const sanitizedContent = input.content ? sanitizeHtml(input.content, sanitizeConfig).trim() : undefined;

    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        rating: input.rating,
        title: sanitizedTitle !== undefined ? sanitizedTitle : undefined,
        content: sanitizedContent !== undefined ? sanitizedContent : undefined,
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
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    await prisma.reviews.delete({
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
    const stats = await prisma.reviews.aggregate({
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

    await prisma.products.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
        reviewCount: stats._count.rating,
      },
    });
  }
}
