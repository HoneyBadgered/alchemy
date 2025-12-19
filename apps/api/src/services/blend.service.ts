/**
 * Blend Service
 * Handles saving and retrieving custom tea blends
 */

import { prisma } from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface BlendAddIn {
  ingredientId: string;
  quantity: number;
}

export interface SaveBlendParams {
  userId?: string;
  sessionId?: string;
  name?: string;
  baseTeaId: string;
  addIns: BlendAddIn[];
  productId?: string;
}

export interface GetBlendsParams {
  userId?: string;
  sessionId?: string;
}

export class BlendService {
  /**
   * Save a custom blend
   */
  async saveBlend({
    userId,
    sessionId,
    name,
    baseTeaId,
    addIns,
    productId,
  }: SaveBlendParams) {
    if (!userId && !sessionId) {
      throw new BadRequestError('Either userId or sessionId must be provided');
    }

    // Validate that at least base tea is provided
    if (!baseTeaId) {
      throw new BadRequestError('Base tea is required');
    }

    // Validate addIns array
    if (!Array.isArray(addIns)) {
      throw new BadRequestError('Add-ins must be an array');
    }

    const blend = await prisma.blends.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
        name: name || null,
        baseTeaId,
        addIns: addIns as any, // Prisma will store this as JSONB
        productId: productId || null,
      },
    });

    return blend;
  }

  /**
   * Get all blends for a user or session
   */
  async getBlends({ userId, sessionId }: GetBlendsParams) {
    if (!userId && !sessionId) {
      throw new BadRequestError('Either userId or sessionId must be provided');
    }

    const blends = await prisma.blends.findMany({
      where: userId ? { userId } : { sessionId },
      include: {
        products: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return blends;
  }

  /**
   * Get a specific blend by ID
   */
  async getBlendById(id: string, userId?: string, sessionId?: string) {
    const blend = await prisma.blends.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!blend) {
      throw new NotFoundError('Blend not found');
    }

    // Verify ownership
    if (userId && blend.userId !== userId) {
      throw new NotFoundError('Blend not found');
    }

    if (sessionId && !userId && blend.sessionId !== sessionId) {
      throw new NotFoundError('Blend not found');
    }

    return blend;
  }

  /**
   * Update a blend's name
   */
  async updateBlendName(id: string, name: string, userId?: string, sessionId?: string) {
    // First verify ownership
    await this.getBlendById(id, userId, sessionId);

    const blend = await prisma.blends.update({
      where: { id },
      data: { name },
    });

    return blend;
  }

  /**
   * Delete a blend
   */
  async deleteBlend(id: string, userId?: string, sessionId?: string) {
    // First verify ownership
    await this.getBlendById(id, userId, sessionId);

    await prisma.blends.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Link a blend to a product (when it's added to cart)
   */
  async linkBlendToProduct(id: string, productId: string, userId?: string, sessionId?: string) {
    // First verify ownership
    await this.getBlendById(id, userId, sessionId);

    const blend = await prisma.blends.update({
      where: { id },
      data: { productId },
    });

    return blend;
  }

  /**
   * Migrate guest blends to user account (after login)
   */
  async migrateGuestBlends(userId: string, sessionId: string) {
    const guestBlends = await prisma.blends.findMany({
      where: { sessionId },
    });

    if (guestBlends.length === 0) {
      return { migrated: 0 };
    }

    // Update all guest blends to belong to the user
    await prisma.blends.updateMany({
      where: { sessionId },
      data: {
        userId,
        sessionId: null, // Clear session ID after migration
      },
    });

    return { migrated: guestBlends.length };
  }
}
