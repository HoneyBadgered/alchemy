/**
 * Admin Ingredient Management Service
 * 
 * Manages ingredient configurations including full CRUD operations,
 * inventory tracking, and computed fields. Stores data in PostgreSQL.
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import type { IngredientCategory } from '@alchemy/core';
import {
  INGREDIENTS,
  DEFAULT_BASE_AMOUNT,
  DEFAULT_INCREMENT_AMOUNT,
} from '@alchemy/core';

// Constants for gram conversion
const GRAMS_PER_OUNCE = 28.3495;

export interface IngredientFilters {
  page?: number;
  perPage?: number;
  category?: IngredientCategory | string;
  isBase?: boolean;
  search?: string;
  caffeineLevel?: string;
  status?: string;
  lowStock?: boolean;
  supplierId?: string;
  sortBy?: 'name' | 'category' | 'stock' | 'cost' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateIngredientInput {
  name: string;
  role?: string;
  category: string;
  descriptionShort?: string;
  descriptionLong?: string;
  image?: string;
  
  // Flavor & Use
  flavorNotes?: string[];
  cutOrGrade?: string;
  recommendedUsageMin?: number;
  recommendedUsageMax?: number;
  pairings?: string[];
  
  // Brewing
  steepTemperature?: number;
  steepTimeMin?: number;
  steepTimeMax?: number;
  brewNotes?: string;
  
  // Inventory & Costing
  supplierId?: string;
  costPerOunce?: number;
  inventoryAmount?: number;
  minimumStockLevel?: number;
  status?: string;
  
  // Safety
  caffeineLevel?: string;
  allergens?: string[];
  internalNotes?: string;
  
  // Legacy fields
  emoji?: string;
  tags?: string[];
  badges?: string[];
  isBase?: boolean;
  baseAmount?: number;
  incrementAmount?: number;
}

export interface UpdateIngredientInput extends Partial<CreateIngredientInput> {}

/**
 * Calculate cost per gram from cost per ounce
 */
function calculateCostPerGram(costPerOunce: number | undefined | null): number | null {
  if (costPerOunce === null || costPerOunce === undefined) return null;
  return Number((costPerOunce / GRAMS_PER_OUNCE).toFixed(4));
}

/**
 * Calculate inventory status based on current amount and minimum level
 */
function calculateInventoryStatus(amount: number, minimumLevel: number): string {
  if (amount <= 0) return 'outOfStock';
  if (amount <= minimumLevel) return 'active'; // will show low stock badge
  return 'active';
}

export class AdminIngredientService {
  /**
   * Get all ingredients with optional filtering, search, and pagination
   */
  async getIngredients(filters: IngredientFilters = {}) {
    const {
      page = 1,
      perPage = 50,
      category,
      isBase,
      search,
      caffeineLevel,
      status,
      lowStock,
      supplierId,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filters;

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.IngredientWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { descriptionShort: { contains: search, mode: 'insensitive' } },
        { descriptionLong: { contains: search, mode: 'insensitive' } },
        { flavorNotes: { hasSome: [search] } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isBase !== undefined) {
      where.isBase = isBase;
    }

    if (caffeineLevel) {
      where.caffeineLevel = caffeineLevel;
    }

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Note: lowStock filter is handled after fetching since Prisma doesn't support field comparison
    // The where clause filtering is done in the post-fetch processing below

    // Build orderBy
    let orderBy: Prisma.IngredientOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'stock':
        orderBy = { inventoryAmount: sortOrder };
        break;
      case 'cost':
        orderBy = { costPerOunce: sortOrder };
        break;
      default:
        orderBy = { [sortBy]: sortOrder };
    }

    // Get ingredients and total count
    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          pairsWith: {
            include: {
              targetIngredient: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  emoji: true,
                },
              },
            },
          },
        },
      }),
      prisma.ingredient.count({ where }),
    ]);

    // Filter for low stock if needed (since Prisma doesn't support field comparison)
    let filteredIngredients = ingredients;
    if (lowStock) {
      filteredIngredients = ingredients.filter(
        (ing) => Number(ing.inventoryAmount) <= Number(ing.minimumStockLevel)
      );
    }

    // Transform pairings for easier consumption
    const transformedIngredients = filteredIngredients.map((ing) => {
      const { pairsWith, ...rest } = ing;
      return {
        ...rest,
        pairings: pairsWith.map((p) => p.targetIngredient),
      };
    });

    return {
      ingredients: transformedIngredients,
      pagination: {
        page,
        perPage,
        total: lowStock ? filteredIngredients.length : total,
        totalPages: Math.ceil((lowStock ? filteredIngredients.length : total) / perPage),
      },
    };
  }

  /**
   * Get a single ingredient by ID
   */
  async getIngredient(id: string) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        supplier: true,
        pairsWith: {
          include: {
            targetIngredient: {
              select: {
                id: true,
                name: true,
                category: true,
                emoji: true,
              },
            },
          },
        },
        pairedBy: {
          include: {
            sourceIngredient: {
              select: {
                id: true,
                name: true,
                category: true,
                emoji: true,
              },
            },
          },
        },
      },
    });

    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    // Transform pairings
    return {
      ...ingredient,
      pairings: ingredient.pairsWith.map((p) => p.targetIngredient),
      pairedBy: ingredient.pairedBy.map((p) => p.sourceIngredient),
    };
  }

  /**
   * Get all add-ins (non-base ingredients)
   */
  async getAddIns() {
    const result = await this.getIngredients({ isBase: false, perPage: 1000 });
    return result.ingredients;
  }

  /**
   * Create a new ingredient
   */
  async createIngredient(data: CreateIngredientInput) {
    // Calculate costPerGram if costPerOunce is provided
    const costPerGram = calculateCostPerGram(data.costPerOunce);
    
    // Determine initial status based on inventory
    const inventoryAmount = data.inventoryAmount ?? 0;
    const minimumStockLevel = data.minimumStockLevel ?? 0;
    const calculatedStatus = data.status || calculateInventoryStatus(inventoryAmount, minimumStockLevel);

    const ingredient = await prisma.ingredient.create({
      data: {
        name: data.name,
        role: data.role || 'addIn',
        category: data.category,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        image: data.image,
        
        flavorNotes: data.flavorNotes || [],
        cutOrGrade: data.cutOrGrade,
        recommendedUsageMin: data.recommendedUsageMin,
        recommendedUsageMax: data.recommendedUsageMax,
        
        steepTemperature: data.steepTemperature,
        steepTimeMin: data.steepTimeMin,
        steepTimeMax: data.steepTimeMax,
        brewNotes: data.brewNotes,
        
        supplierId: data.supplierId,
        costPerOunce: data.costPerOunce,
        costPerGram,
        inventoryAmount,
        minimumStockLevel,
        status: calculatedStatus,
        
        caffeineLevel: data.caffeineLevel || 'none',
        allergens: data.allergens || [],
        internalNotes: data.internalNotes,
        
        emoji: data.emoji,
        tags: data.tags || [],
        badges: data.badges || [],
        isBase: data.isBase ?? false,
        baseAmount: data.baseAmount,
        incrementAmount: data.incrementAmount,
      },
      include: {
        supplier: true,
      },
    });

    // Handle pairings if provided
    if (data.pairings && data.pairings.length > 0) {
      await this.updatePairings(ingredient.id, data.pairings);
    }

    return this.getIngredient(ingredient.id);
  }

  /**
   * Update an existing ingredient
   */
  async updateIngredient(id: string, data: UpdateIngredientInput) {
    // Check if ingredient exists
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Ingredient not found');
    }

    // Calculate costPerGram if costPerOunce is updated
    const costPerGram = data.costPerOunce !== undefined 
      ? calculateCostPerGram(data.costPerOunce) 
      : undefined;

    // Determine status if inventory fields are updated
    let calculatedStatus: string | undefined;
    if (data.inventoryAmount !== undefined || data.minimumStockLevel !== undefined) {
      const inventoryAmount = data.inventoryAmount ?? Number(existing.inventoryAmount);
      
      // Only auto-calculate status if not explicitly setting to archived
      if (data.status !== 'archived') {
        if (inventoryAmount <= 0) {
          calculatedStatus = 'outOfStock';
        } else if (data.status) {
          calculatedStatus = data.status;
        }
      } else {
        calculatedStatus = data.status;
      }
    } else if (data.status) {
      calculatedStatus = data.status;
    }

    // Build update data, excluding pairings (handled separately)
    const { pairings, ...updateData } = data;
    
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...updateData,
        ...(costPerGram !== undefined && { costPerGram }),
        ...(calculatedStatus && { status: calculatedStatus }),
      },
      include: {
        supplier: true,
      },
    });

    // Handle pairings if provided
    if (pairings !== undefined) {
      await this.updatePairings(id, pairings);
    }

    return this.getIngredient(ingredient.id);
  }

  /**
   * Update pairings for an ingredient
   */
  private async updatePairings(ingredientId: string, pairingIds: string[]) {
    // Remove existing pairings
    await prisma.ingredientPairing.deleteMany({
      where: { sourceIngredientId: ingredientId },
    });

    // Create new pairings
    if (pairingIds.length > 0) {
      await prisma.ingredientPairing.createMany({
        data: pairingIds.map((targetId) => ({
          sourceIngredientId: ingredientId,
          targetIngredientId: targetId,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Archive an ingredient (soft delete)
   */
  async archiveIngredient(id: string) {
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { status: 'archived' },
    });
    return ingredient;
  }

  /**
   * Unarchive an ingredient
   */
  async unarchiveIngredient(id: string) {
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Ingredient not found');
    }

    // Determine new status based on inventory
    const newStatus = calculateInventoryStatus(
      Number(existing.inventoryAmount),
      Number(existing.minimumStockLevel)
    );

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { status: newStatus },
    });
    return ingredient;
  }

  /**
   * Delete an ingredient (hard delete)
   */
  async deleteIngredient(id: string) {
    await prisma.ingredient.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Get available ingredient categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await prisma.ingredient.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const existingCategories = categories.map((c) => c.category).filter(Boolean);
    
    // Include default categories even if no ingredients exist for them
    const defaultCategories = ['base', 'floral', 'fruit', 'herbal', 'herb', 'spice', 'special', 'tea', 'sweetener'];
    
    return [...new Set([...existingCategories, ...defaultCategories])].sort();
  }

  /**
   * Get all suppliers
   */
  async getSuppliers() {
    return prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get low stock ingredients
   */
  async getLowStockIngredients() {
    const ingredients = await prisma.ingredient.findMany({
      where: {
        status: { not: 'archived' },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { inventoryAmount: 'asc' },
    });

    // Filter for low stock (at or below minimum level)
    return ingredients.filter(
      (ing) => Number(ing.inventoryAmount) <= Number(ing.minimumStockLevel)
    );
  }

  /**
   * Get default values for reference (backwards compatibility)
   */
  getDefaults(): { baseAmount: number; incrementAmount: number } {
    return {
      baseAmount: DEFAULT_BASE_AMOUNT,
      incrementAmount: DEFAULT_INCREMENT_AMOUNT,
    };
  }

  /**
   * Seed database with ingredients from core package (for initial setup)
   */
  async seedFromCore() {
    const existingCount = await prisma.ingredient.count();
    if (existingCount > 0) {
      return { message: 'Ingredients already exist, skipping seed', count: existingCount };
    }

    const coreIngredients = INGREDIENTS;
    
    for (const ing of coreIngredients) {
      await prisma.ingredient.create({
        data: {
          name: ing.name,
          role: ing.isBase ? 'base' : 'addIn',
          category: ing.category,
          descriptionShort: ing.description,
          emoji: ing.emoji,
          tags: ing.tags || [],
          badges: ing.badges || [],
          isBase: ing.isBase ?? false,
          baseAmount: ing.baseAmount,
          incrementAmount: ing.incrementAmount,
          status: 'active',
          caffeineLevel: ing.isBase ? 'medium' : 'none',
        },
      });
    }

    return { message: 'Seeded ingredients from core package', count: coreIngredients.length };
  }

  /**
   * Get ingredient usage in blends/recipes (for reference checking)
   */
  async getIngredientUsage(id: string) {
    // This would check Recipe.ingredients JSON field
    // For now, return empty as implementation depends on how recipes store ingredients
    const recipes = await prisma.recipe.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        ingredients: true,
      },
    });

    // Filter recipes that contain this ingredient
    const usedInRecipes = recipes.filter((recipe) => {
      const ingredientsList = recipe.ingredients as Array<{ ingredientId: string }>;
      return ingredientsList?.some((ing) => ing.ingredientId === id);
    });

    return {
      recipeCount: usedInRecipes.length,
      recipes: usedInRecipes.map((r) => ({ id: r.id, name: r.name })),
    };
  }
}
