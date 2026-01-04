/**
 * Admin Blend Service
 * Business logic for creating products from blends
 */

import { prisma } from '../utils/prisma';
import { cuid } from '../utils/cuid';

interface BlendIngredient {
  ingredientId: string;
  quantity: number;
}

interface CreateBlendProductInput {
  name: string;
  description?: string;
  baseTeaId: string;
  addIns: BlendIngredient[];
  size?: number;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  zones?: string[];
  tags?: string[];
  stock?: number;
  isActive?: boolean;
}

interface ConvertBlendInput {
  blendId: string;
  price: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  category?: string;
  zones?: string[];
  tags?: string[];
  stock?: number;
  isActive?: boolean;
}

interface GetBlendsFilter {
  page: number;
  perPage: number;
  hasProduct?: boolean;
}

export class AdminBlendService {
  /**
   * Create a new product from a blend recipe
   */
  async createProductFromBlend(data: CreateBlendProductInput) {
    // Validate that base tea and add-ins exist
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: data.baseTeaId },
    });

    if (!baseTea) {
      throw new Error(`Base tea with ID ${data.baseTeaId} not found`);
    }

    // Validate all add-in ingredients
    const ingredientIds = data.addIns.map(a => a.ingredientId);
    const ingredients = await prisma.ingredients.findMany({
      where: { id: { in: ingredientIds } },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new Error('One or more add-in ingredients not found');
    }

    // Create product and blend in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.products.create({
        data: {
          id: cuid(),
          name: data.name,
          description: data.description || `Custom blend with ${baseTea.name}`,
          price: data.price,
          imageUrl: data.imageUrl || null,
          images: data.images || [],
          category: data.category || 'Custom Blends',
          zones: data.zones || [],
          tags: data.tags || ['custom', 'blend'],
          stock: data.stock ?? 0,
          isActive: data.isActive ?? true,
          updatedAt: new Date(),
        },
      });

      // Create the blend record linked to the product
      const blend = await tx.blends.create({
        data: {
          id: cuid(),
          name: data.name,
          baseTeaId: data.baseTeaId,
          addIns: data.addIns,
          size: data.size || 2,
          productId: product.id,
        },
      });

      return { product, blend };
    });

    return result;
  }

  /**
   * Convert an existing blend to a product
   */
  async convertBlendToProduct(blendId: string, data: ConvertBlendInput) {
    // Get the blend
    const blend = await prisma.blends.findUnique({
      where: { id: blendId },
      include: {
        users: true,
      },
    });

    if (!blend) {
      throw new Error('Blend not found');
    }

    if (blend.productId) {
      throw new Error('Blend is already linked to a product');
    }

    // Get base tea for description
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: blend.baseTeaId },
    });

    const productName = data.name || blend.name || `Custom Blend`;
    const productDescription = data.description || `Custom blend with ${baseTea?.name || 'tea'}`;

    // Create product and link to blend
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          id: cuid(),
          name: productName,
          description: productDescription,
          price: data.price,
          imageUrl: data.imageUrl || null,
          images: data.images || [],
          category: data.category || 'Custom Blends',
          zones: data.zones || [],
          tags: data.tags || ['custom', 'blend'],
          stock: data.stock ?? 0,
          isActive: data.isActive ?? true,
          updatedAt: new Date(),
        },
      });

      // Link blend to product
      const updatedBlend = await tx.blends.update({
        where: { id: blendId },
        data: {
          productId: product.id,
          name: productName,
        },
      });

      return { product, blend: updatedBlend };
    });

    return result;
  }

  /**
   * Get all blends with pagination and filtering
   */
  async getAllBlends(filters: GetBlendsFilter) {
    const { page, perPage, hasProduct } = filters;
    const skip = (page - 1) * perPage;

    const where = hasProduct !== undefined
      ? { productId: hasProduct ? { not: null } : null }
      : {};

    const [blends, total] = await Promise.all([
      prisma.blends.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          products: {
            select: {
              id: true,
              name: true,
              price: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.blends.count({ where }),
    ]);

    // Enrich blends with ingredient details
    const enrichedBlends = await Promise.all(
      blends.map(async (blend) => {
        // Get base tea
        const baseTea = await prisma.ingredients.findUnique({
          where: { id: blend.baseTeaId },
          select: { id: true, name: true, category: true },
        });

        // Get add-in ingredients
        const addIns = blend.addIns as BlendIngredient[];
        const addInIds = addIns.map(a => a.ingredientId);
        const addInIngredients = await prisma.ingredients.findMany({
          where: { id: { in: addInIds } },
          select: { id: true, name: true, category: true },
        });

        // Map add-ins with their details
        const addInsWithDetails = addIns.map(addIn => {
          const ingredient = addInIngredients.find(i => i.id === addIn.ingredientId);
          return {
            ingredientId: addIn.ingredientId,
            quantity: addIn.quantity,
            name: ingredient?.name || 'Unknown',
            category: ingredient?.category || 'Unknown',
          };
        });

        return {
          ...blend,
          baseTea,
          addInsWithDetails,
        };
      })
    );

    return {
      blends: enrichedBlends,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get blend details with full ingredient information
   */
  async getBlendWithIngredients(blendId: string) {
    const blend = await prisma.blends.findUnique({
      where: { id: blendId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        products: true,
      },
    });

    if (!blend) {
      throw new Error('Blend not found');
    }

    // Get base tea details
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: blend.baseTeaId },
    });

    // Get add-in ingredients details
    const addIns = blend.addIns as BlendIngredient[];
    const addInIds = addIns.map(a => a.ingredientId);
    const addInIngredients = await prisma.ingredients.findMany({
      where: { id: { in: addInIds } },
    });

    // Map quantities to ingredients
    const addInsWithDetails = addIns.map(addIn => {
      const ingredient = addInIngredients.find(i => i.id === addIn.ingredientId);
      return {
        ...addIn,
        ingredient,
      };
    });

    return {
      ...blend,
      baseTea,
      addInsWithDetails,
    };
  }

  /**
   * Calculate the cost to produce a blend based on ingredient costs
   */
  async calculateBlendCost(data: { baseTeaId: string; addIns: BlendIngredient[] }) {
    // Get base tea
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: data.baseTeaId },
    });

    if (!baseTea) {
      throw new Error('Base tea not found');
    }

    // Get all add-in ingredients
    const addInIds = data.addIns.map(a => a.ingredientId);
    const ingredients = await prisma.ingredients.findMany({
      where: { id: { in: addInIds } },
    });

    // Calculate cost (assuming quantities are in grams and costPerGram is set)
    let totalCost = 0;
    const breakdown: Array<{
      ingredientId: string;
      name: string;
      quantity: number;
      costPerGram: number | null;
      cost: number;
    }> = [];

    // Add base tea cost (assume standard serving size, e.g., 5g)
    const baseQuantity = 5; // grams
    const baseCost = baseTea.costPerGram ? Number(baseTea.costPerGram) * baseQuantity : 0;
    totalCost += baseCost;
    
    breakdown.push({
      ingredientId: baseTea.id,
      name: baseTea.name,
      quantity: baseQuantity,
      costPerGram: baseTea.costPerGram ? Number(baseTea.costPerGram) : null,
      cost: baseCost,
    });

    // Add add-in costs
    for (const addIn of data.addIns) {
      const ingredient = ingredients.find(i => i.id === addIn.ingredientId);
      if (ingredient) {
        const cost = ingredient.costPerGram ? Number(ingredient.costPerGram) * addIn.quantity : 0;
        totalCost += cost;
        
        breakdown.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          quantity: addIn.quantity,
          costPerGram: ingredient.costPerGram ? Number(ingredient.costPerGram) : null,
          cost,
        });
      }
    }

    // Calculate suggested retail price (e.g., 3x cost markup)
    const suggestedPrice = totalCost * 3;

    return {
      totalCost: Number(totalCost.toFixed(2)),
      suggestedPrice: Number(suggestedPrice.toFixed(2)),
      breakdown,
    };
  }

  /**
   * Update a blend's composition
   */
  async updateBlend(
    id: string,
    data: {
      baseTeaId: string;
      addIns: BlendIngredient[];
      name?: string;
    }
  ) {
    // Validate that base tea exists
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: data.baseTeaId },
    });

    if (!baseTea) {
      throw new Error(`Base tea with ID ${data.baseTeaId} not found`);
    }

    // Validate all add-in ingredients
    const ingredientIds = data.addIns.map(a => a.ingredientId);
    const ingredients = await prisma.ingredients.findMany({
      where: { id: { in: ingredientIds } },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new Error('One or more add-in ingredients not found');
    }

    // Update the blend
    const blend = await prisma.blends.update({
      where: { id },
      data: {
        baseTeaId: data.baseTeaId,
        addIns: data.addIns,
        name: data.name,
        updatedAt: new Date(),
      },
      include: {
        products: true,
        users: true,
      },
    });

    return blend;
  }
}
