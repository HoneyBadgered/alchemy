/**
 * Blending Ingredients Service
 * 
 * Public service for fetching ingredients formatted for the blending interface.
 * Maps database ingredients to the BlendingIngredient interface.
 */

import { prisma } from '../utils/prisma';
import type { ingredients } from '@prisma/client';

export interface BlendingIngredient {
  id: string;
  name: string;
  category: string;
  description: string;
  shortTags: string[];
  emoji: string;
  isBase: boolean;
  costPerOz: number;
  tier: 'standard' | 'premium';
  flavorProfile: {
    floral: number;
    citrus: number;
    earthy: number;
    sweet: number;
    caffeine: number;
  };
  caffeineLevel: 'none' | 'low' | 'medium' | 'high';
  baseAmount?: number;
  incrementAmount?: number;
}

export interface BlendingIngredientsFilters {
  category?: string;
  isBase?: boolean;
  status?: string;
}

export class BlendingIngredientsService {
  /**
   * Map database ingredient to BlendingIngredient interface
   */
  private mapToBlendingIngredient(ingredient: ingredients): BlendingIngredient {
    // Parse flavor notes to generate flavor profile scores
    const flavorNotes = (ingredient.flavorNotes as string[]) || [];
    const flavorProfile = this.generateFlavorProfile(flavorNotes, ingredient.caffeineLevel || 'none');

    // Determine tier based on cost or category
    const tier = this.determineTier(ingredient);

    return {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      description: ingredient.descriptionShort || ingredient.descriptionLong || '',
      shortTags: this.generateShortTags(ingredient),
      emoji: ingredient.emoji || this.getDefaultEmoji(ingredient.category),
      isBase: ingredient.isBase || false,
      costPerOz: Number(ingredient.costPerOunce) || 0,
      tier,
      flavorProfile,
      caffeineLevel: (ingredient.caffeineLevel as 'none' | 'low' | 'medium' | 'high') || 'none',
      baseAmount: ingredient.baseAmount ? Number(ingredient.baseAmount) : undefined,
      incrementAmount: ingredient.incrementAmount ? Number(ingredient.incrementAmount) : undefined,
    };
  }

  /**
   * Generate flavor profile from flavor notes and caffeine level
   */
  private generateFlavorProfile(flavorNotes: string[], caffeineLevel: string): BlendingIngredient['flavorProfile'] {
    const profile = {
      floral: 0,
      citrus: 0,
      earthy: 0,
      sweet: 0,
      caffeine: 0,
    };

    // Map caffeine level to score
    const caffeineMap: Record<string, number> = {
      none: 0,
      low: 30,
      medium: 60,
      high: 90,
    };
    profile.caffeine = caffeineMap[caffeineLevel] || 0;

    // Parse flavor notes to set profile scores
    flavorNotes.forEach(note => {
      const noteLower = note.toLowerCase();
      if (noteLower.includes('floral') || noteLower.includes('flower') || noteLower.includes('rose') || noteLower.includes('jasmine')) {
        profile.floral += 20;
      }
      if (noteLower.includes('citrus') || noteLower.includes('lemon') || noteLower.includes('orange') || noteLower.includes('bergamot')) {
        profile.citrus += 20;
      }
      if (noteLower.includes('earthy') || noteLower.includes('malty') || noteLower.includes('woody') || noteLower.includes('roasted')) {
        profile.earthy += 20;
      }
      if (noteLower.includes('sweet') || noteLower.includes('honey') || noteLower.includes('vanilla') || noteLower.includes('caramel')) {
        profile.sweet += 20;
      }
    });

    // Cap values at 100
    Object.keys(profile).forEach(key => {
      profile[key as keyof typeof profile] = Math.min(profile[key as keyof typeof profile], 100);
    });

    return profile;
  }

  /**
   * Determine ingredient tier based on cost and category
   */
  private determineTier(ingredient: ingredients): 'standard' | 'premium' {
    const cost = Number(ingredient.costPerOunce) || 0;
    const category = ingredient.category.toLowerCase();

    // Premium if cost is high or category suggests premium
    if (cost > 3.0) return 'premium';
    if (category.includes('premium') || category.includes('rare') || category.includes('exotic')) {
      return 'premium';
    }

    return 'standard';
  }

  /**
   * Generate short tags from ingredient data
   */
  private generateShortTags(ingredient: ingredients): string[] {
    const tags: string[] = [];

    // Add category
    if (ingredient.category) {
      tags.push(ingredient.category);
    }

    // Add caffeine level
    if (ingredient.caffeineLevel && ingredient.caffeineLevel !== 'none') {
      tags.push(`${ingredient.caffeineLevel} caffeine`);
    }

    // Add top flavor notes (max 2)
    const flavorNotes = (ingredient.flavorNotes as string[]) || [];
    tags.push(...flavorNotes.slice(0, 2));

    // Use existing tags if available
    const existingTags = (ingredient.tags as string[]) || [];
    if (existingTags.length > 0 && tags.length < 3) {
      tags.push(...existingTags.slice(0, 3 - tags.length));
    }

    return tags.slice(0, 3); // Limit to 3 tags
  }

  /**
   * Get default emoji based on category
   */
  private getDefaultEmoji(category: string): string {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('tea') || categoryLower.includes('base')) return '🍵';
    if (categoryLower.includes('flower') || categoryLower.includes('floral')) return '🌸';
    if (categoryLower.includes('herb') || categoryLower.includes('botanical')) return '🌿';
    if (categoryLower.includes('fruit')) return '🍇';
    if (categoryLower.includes('spice')) return '✨';
    if (categoryLower.includes('root')) return '🥕';
    
    return '🌿'; // Default
  }

  /**
   * Get all blending ingredients with optional filtering
   */
  async getBlendingIngredients(filters: BlendingIngredientsFilters = {}): Promise<BlendingIngredient[]> {
    const where: any = {
      status: filters.status || 'active',
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isBase !== undefined) {
      where.isBase = filters.isBase;
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return ingredients.map(ing => this.mapToBlendingIngredient(ing));
  }

  /**
   * Get all base teas
   */
  async getBaseTeas(): Promise<BlendingIngredient[]> {
    const bases = await prisma.ingredient.findMany({
      where: {
        role: { in: ['base', 'either'] },
        status: 'active',
      },
      orderBy: { name: 'asc' },
    });

    return bases.map(base => this.mapToBlendingIngredient(base));
  }

  /**
   * Get add-ins grouped by category
   */
  async getAddIns(): Promise<{
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  }> {
    const allAddIns = await prisma.ingredient.findMany({
      where: {
        role: { in: ['addIn', 'either'] },
        status: 'active',
      },
      orderBy: { name: 'asc' },
    });

    const mapped = allAddIns.map(ing => this.mapToBlendingIngredient(ing));

    // Group by tier and category
    const addIns: BlendingIngredient[] = [];
    const botanicals: BlendingIngredient[] = [];
    const premium: BlendingIngredient[] = [];

    mapped.forEach(ingredient => {
      if (ingredient.tier === 'premium') {
        premium.push(ingredient);
      } else if (ingredient.category.toLowerCase().includes('botanical') || 
                 ingredient.category.toLowerCase().includes('flower') ||
                 ingredient.category.toLowerCase().includes('herb')) {
        botanicals.push(ingredient);
      } else {
        addIns.push(ingredient);
      }
    });

    return { addIns, botanicals, premium };
  }

  /**
   * Get single ingredient by ID
   */
  async getIngredientById(id: string): Promise<BlendingIngredient | null> {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) return null;

    return this.mapToBlendingIngredient(ingredient);
  }
}
