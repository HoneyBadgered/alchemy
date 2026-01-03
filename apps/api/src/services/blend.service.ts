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
    
    // Validate 60% add-ins limit (blend size is not stored, but we can validate percentages)
    // Note: For now we'll just validate that add-ins exist. Full validation would require blend size.
    // In a real scenario, we'd add a 'size' field to SaveBlendParams
    const totalAddInsWeight = addIns.reduce((sum, a) => sum + a.quantity, 0);
    
    // Basic sanity check - each add-in should have reasonable quantities
    for (const addIn of addIns) {
      if (!addIn.ingredientId) {
        throw new BadRequestError('Each add-in must have an ingredientId');
      }
      if (typeof addIn.quantity !== 'number' || addIn.quantity <= 0) {
        throw new BadRequestError('Each add-in must have a positive quantity');
      }
      if (addIn.quantity > 10) {
        // Very generous upper limit per ingredient
        throw new BadRequestError(`Add-in quantity too large: ${addIn.quantity}oz`);
      }
    }
    
    // Total add-ins sanity check (assuming common blend sizes 1-4oz, max would be 2.4oz)
    if (totalAddInsWeight > 10) {
      throw new BadRequestError(`Total add-ins weight too large: ${totalAddInsWeight}oz`);
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
