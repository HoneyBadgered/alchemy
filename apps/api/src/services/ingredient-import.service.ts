/**
 * Ingredient Import Service
 * 
 * Handles CSV and JSON import for bulk ingredient uploads
 */

import { parse } from 'csv-parse/sync';
import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import type { IngredientCategory, TeaType } from '@alchemy/types';

const GRAMS_PER_OUNCE = 28.3495;

const VALID_CATEGORIES: IngredientCategory[] = [
  'base',
  'flowers',
  'herbs',
  'fruit',
  'spice',
  'sweet',
  'essence',
  'specialty',
];

const VALID_TEA_TYPES: TeaType[] = [
  'black',
  'green',
  'oolong',
  'white',
  'tisane',
];

interface IngredientRow {
  ingredientKey: string;
  name: string;
  role?: string;
  category: string;
  teaType?: string;
  descriptionShort?: string;
  descriptionLong?: string;
  image?: string;
  latinName?: string;
  flavorNotes?: string;
  cutOrGrade?: string;
  recommendedUsageMin?: string;
  recommendedUsageMax?: string;
  steepTemperature?: string;
  steepTimeMin?: string;
  steepTimeMax?: string;
  brewNotes?: string;
  supplierId?: string;
  costPerOunce?: string;
  inventoryAmount?: string;
  minimumStockLevel?: string;
  status?: string;
  caffeineLevel?: string;
  allergens?: string;
  internalNotes?: string;
  emoji?: string;
  tags?: string;
  badges?: string;
}

export class IngredientImportService {
  /**
   * Generate CSV template for ingredient import
   */
  generateTemplate(): string {
    const headers = [
      'ingredientKey',
      'name',
      'role',
      'category',
      'teaType',
      'descriptionShort',
      'descriptionLong',
      'image',
      'latinName',
      'flavorNotes',
      'cutOrGrade',
      'recommendedUsageMin',
      'recommendedUsageMax',
      'steepTemperature',
      'steepTimeMin',
      'steepTimeMax',
      'brewNotes',
      'supplierId',
      'costPerOunce',
      'inventoryAmount',
      'minimumStockLevel',
      'status',
      'caffeineLevel',
      'allergens',
      'internalNotes',
      'emoji',
      'tags',
      'badges',
    ];

    const exampleRow = [
      'chamomile',
      'Chamomile Flowers',
      'addIn',
      'flowers',
      'tisane',
      'Calming floral tea',
      'Premium Egyptian chamomile flowers with sweet apple notes',
      'https://example.com/chamomile.jpg',
      'Matricaria chamomilla',
      'sweet,floral,apple',
      'whole flowers',
      '5',
      '10',
      '212',
      '5',
      '7',
      'Best steeped covered to preserve essential oils',
      '',
      '2.50',
      '500',
      '100',
      'active',
      'none',
      '',
      'Store in cool, dry place away from light',
      '🌼',
      'relaxing,bedtime,caffeine-free',
      'organic,premium',
    ];

    return `${headers.join(',')}\n${exampleRow.join(',')}\n`;
  }

  /**
   * Validate CSV content
   */
  async validateCSV(csvContent: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as IngredientRow[];

      if (records.length === 0) {
        errors.push('CSV file is empty');
        return { valid: false, errors };
      }

      // Validate each row
      records.forEach((row, index) => {
        const rowNum = index + 2; // +2 for header and 0-index

        // Required fields
        if (!row.name || row.name.trim() === '') {
          errors.push(`Row ${rowNum}: Name is required`);
        }
        if (!row.category || row.category.trim() === '') {
          errors.push(`Row ${rowNum}: Category is required`);
        }

        // Validate category
        if (row.category && !VALID_CATEGORIES.includes(row.category as IngredientCategory)) {
          errors.push(`Row ${rowNum}: Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
        }

        // Validate teaType (optional)
        if (row.teaType && row.teaType.trim() !== '' && !VALID_TEA_TYPES.includes(row.teaType as TeaType)) {
          errors.push(`Row ${rowNum}: teaType must be one of: ${VALID_TEA_TYPES.join(', ')}`);
        }

        // Validate role
        if (row.role && !['base', 'addIn', 'either'].includes(row.role)) {
          errors.push(`Row ${rowNum}: Role must be 'base', 'addIn', or 'either'`);
        }

        // Validate numbers
        if (row.recommendedUsageMin && isNaN(Number(row.recommendedUsageMin))) {
          errors.push(`Row ${rowNum}: recommendedUsageMin must be a number`);
        }
        if (row.recommendedUsageMax && isNaN(Number(row.recommendedUsageMax))) {
          errors.push(`Row ${rowNum}: recommendedUsageMax must be a number`);
        }
        if (row.steepTemperature && isNaN(Number(row.steepTemperature))) {
          errors.push(`Row ${rowNum}: steepTemperature must be a number`);
        }
        if (row.steepTimeMin && isNaN(Number(row.steepTimeMin))) {
          errors.push(`Row ${rowNum}: steepTimeMin must be a number`);
        }
        if (row.steepTimeMax && isNaN(Number(row.steepTimeMax))) {
          errors.push(`Row ${rowNum}: steepTimeMax must be a number`);
        }
        if (row.costPerOunce && isNaN(Number(row.costPerOunce))) {
          errors.push(`Row ${rowNum}: costPerOunce must be a number`);
        }
        if (row.inventoryAmount && isNaN(Number(row.inventoryAmount))) {
          errors.push(`Row ${rowNum}: inventoryAmount must be a number`);
        }
        if (row.minimumStockLevel && isNaN(Number(row.minimumStockLevel))) {
          errors.push(`Row ${rowNum}: minimumStockLevel must be a number`);
        }

        // Validate status
        if (row.status && !['active', 'archived', 'outOfStock'].includes(row.status)) {
          errors.push(`Row ${rowNum}: status must be 'active', 'archived', or 'outOfStock'`);
        }

        // Validate caffeine level
        if (row.caffeineLevel && !['none', 'low', 'medium', 'high'].includes(row.caffeineLevel)) {
          errors.push(`Row ${rowNum}: caffeineLevel must be 'none', 'low', 'medium', or 'high'`);
        }

        // Validate image URL if provided
        if (row.image && row.image.trim() !== '') {
          try {
            new URL(row.image);
          } catch {
            errors.push(`Row ${rowNum}: image must be a valid URL`);
          }
        }
      });

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`CSV parsing error: ${(error as Error).message}`);
      return { valid: false, errors };
    }
  }

  /**
   * Import ingredients from CSV
   */
  async importFromCSV(csvContent: string): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    try {
      // First validate
      const validation = await this.validateCSV(csvContent);
      if (!validation.valid) {
        return { success: false, imported: 0, updated: 0, errors: validation.errors };
      }

      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as IngredientRow[];

      // Process each row
      for (const row of records) {
        try {
          // Parse arrays
          const flavorNotes = row.flavorNotes
            ? row.flavorNotes.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const allergens = row.allergens
            ? row.allergens.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const tags = row.tags
            ? row.tags.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          const badges = row.badges
            ? row.badges.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

          // Calculate cost per gram
          const costPerOunce = row.costPerOunce ? Number(row.costPerOunce) : null;
          const costPerGram = costPerOunce ? Number((costPerOunce / GRAMS_PER_OUNCE).toFixed(4)) : null;

          // Prepare ingredient data
          const ingredientData: Prisma.ingredientsCreateInput = {
            ingredientKey: row.ingredientKey,
            name: row.name,
            role: row.role || 'addIn',
            category: row.category,
            teaType: row.teaType && row.teaType.trim() !== '' ? row.teaType : null,
            descriptionShort: row.descriptionShort || null,
            descriptionLong: row.descriptionLong || null,
            image: row.image || null,
            latinName: row.latinName || null,
            flavorNotes,
            cutOrGrade: row.cutOrGrade || null,
            recommendedUsageMin: row.recommendedUsageMin ? Number(row.recommendedUsageMin) : null,
            recommendedUsageMax: row.recommendedUsageMax ? Number(row.recommendedUsageMax) : null,
            steepTemperature: row.steepTemperature ? Number(row.steepTemperature) : null,
            steepTimeMin: row.steepTimeMin ? Number(row.steepTimeMin) : null,
            steepTimeMax: row.steepTimeMax ? Number(row.steepTimeMax) : null,
            brewNotes: row.brewNotes || null,
            supplierId: row.supplierId && row.supplierId.trim() !== '' ? row.supplierId : null,
            costPerOunce,
            costPerGram,
            inventoryAmount: row.inventoryAmount ? Number(row.inventoryAmount) : 0,
            minimumStockLevel: row.minimumStockLevel ? Number(row.minimumStockLevel) : 0,
            status: row.status || 'active',
            caffeineLevel: row.caffeineLevel || 'none',
            allergens,
            internalNotes: row.internalNotes || null,
            emoji: row.emoji || null,
            tags,
            badges,
          };

          // Check if ingredient exists by ingredientKey + role
          const existing = await prisma.ingredients.findFirst({
            where: { 
              ingredientKey: row.ingredientKey,
              role: row.role || 'addIn'
            },
          });

          if (existing) {
            // Update existing ingredient
            await prisma.ingredients.update({
              where: { id: existing.id },
              data: ingredientData,
            });
            updated++;
          } else {
            // Create new ingredient
            await prisma.ingredients.create({
              data: ingredientData,
            });
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import "${row.name}": ${(error as Error).message}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        updated,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [`Import failed: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Validate JSON ingredient data
   */
  validateJSONIngredient(ingredient: any, index: number): { valid: boolean; error?: string } {
    // Required fields
    if (!ingredient.ingredientKey || typeof ingredient.ingredientKey !== 'string' || ingredient.ingredientKey.trim() === '') {
      return { valid: false, error: `Ingredient ${index}: ingredientKey is required` };
    }
    if (!ingredient.name || typeof ingredient.name !== 'string' || ingredient.name.trim() === '') {
      return { valid: false, error: `Ingredient ${index}: Name is required` };
    }
    if (!ingredient.category || typeof ingredient.category !== 'string') {
      return { valid: false, error: `Ingredient ${index}: Category is required` };
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(ingredient.category as IngredientCategory)) {
      return { valid: false, error: `Ingredient ${index}: Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
    }

    // Validate teaType if provided
    if (ingredient.teaType && !VALID_TEA_TYPES.includes(ingredient.teaType as TeaType)) {
      return { valid: false, error: `Ingredient ${index}: teaType must be one of: ${VALID_TEA_TYPES.join(', ')}` };
    }

    // Validate role
    if (ingredient.role && !['base', 'addIn', 'either'].includes(ingredient.role)) {
      return { valid: false, error: `Ingredient ${index}: Role must be 'base', 'addIn', or 'either'` };
    }

    // Validate numbers
    const numberFields = ['recommendedUsageMin', 'recommendedUsageMax', 'steepTemperature', 
                          'steepTimeMin', 'steepTimeMax', 'costPerOunce', 'inventoryAmount', 'minimumStockLevel'];
    for (const field of numberFields) {
      if (ingredient[field] !== undefined && ingredient[field] !== null && isNaN(Number(ingredient[field]))) {
        return { valid: false, error: `Ingredient ${index}: ${field} must be a number` };
      }
    }

    // Validate status
    if (ingredient.status && !['active', 'archived', 'outOfStock'].includes(ingredient.status)) {
      return { valid: false, error: `Ingredient ${index}: status must be 'active', 'archived', or 'outOfStock'` };
    }

    // Validate caffeine level
    if (ingredient.caffeineLevel && !['none', 'low', 'medium', 'high'].includes(ingredient.caffeineLevel)) {
      return { valid: false, error: `Ingredient ${index}: caffeineLevel must be 'none', 'low', 'medium', or 'high'` };
    }

    // Validate arrays
    const arrayFields = ['flavorNotes', 'allergens', 'tags', 'badges'];
    for (const field of arrayFields) {
      if (ingredient[field] !== undefined && !Array.isArray(ingredient[field])) {
        return { valid: false, error: `Ingredient ${index}: ${field} must be an array` };
      }
    }

    return { valid: true };
  }

  /**
   * Import ingredients from JSON array
   */
  async importFromJSON(ingredients: any[]): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    try {
      // Validate input
      if (!Array.isArray(ingredients)) {
        return {
          success: false,
          imported: 0,
          updated: 0,
          errors: ['Invalid input: expected an array of ingredients'],
        };
      }

      // Validate all ingredients first
      for (let i = 0; i < ingredients.length; i++) {
        const validation = this.validateJSONIngredient(ingredients[i], i + 1);
        if (!validation.valid) {
          errors.push(validation.error!);
        }
      }

      if (errors.length > 0) {
        return { success: false, imported: 0, updated: 0, errors };
      }

      // Process each ingredient
      for (const ingredient of ingredients) {
        try {
          // Calculate cost per gram
          const costPerOunce = ingredient.costPerOunce ? Number(ingredient.costPerOunce) : null;
          const costPerGram = costPerOunce ? Number((costPerOunce / GRAMS_PER_OUNCE).toFixed(4)) : null;

          // Prepare ingredient data
          const ingredientData: Prisma.ingredientsCreateInput = {
            ingredientKey: ingredient.ingredientKey,
            name: ingredient.name,
            role: ingredient.role || 'addIn',
            category: ingredient.category,
            teaType: ingredient.teaType || null,
            descriptionShort: ingredient.descriptionShort || null,
            descriptionLong: ingredient.descriptionLong || null,
            image: ingredient.image || null,
            latinName: ingredient.latinName || null,
            flavorNotes: ingredient.flavorNotes || [],
            cutOrGrade: ingredient.cutOrGrade || null,
            recommendedUsageMin: ingredient.recommendedUsageMin ? Number(ingredient.recommendedUsageMin) : null,
            recommendedUsageMax: ingredient.recommendedUsageMax ? Number(ingredient.recommendedUsageMax) : null,
            steepTemperature: ingredient.steepTemperature ? Number(ingredient.steepTemperature) : null,
            steepTimeMin: ingredient.steepTimeMin ? Number(ingredient.steepTimeMin) : null,
            steepTimeMax: ingredient.steepTimeMax ? Number(ingredient.steepTimeMax) : null,
            brewNotes: ingredient.brewNotes || null,
            supplierId: ingredient.supplierId || null,
            costPerOunce,
            costPerGram,
            inventoryAmount: ingredient.inventoryAmount ? Number(ingredient.inventoryAmount) : 0,
            minimumStockLevel: ingredient.minimumStockLevel ? Number(ingredient.minimumStockLevel) : 0,
            status: ingredient.status || 'active',
            caffeineLevel: ingredient.caffeineLevel || 'none',
            allergens: ingredient.allergens || [],
            internalNotes: ingredient.internalNotes || null,
            emoji: ingredient.emoji || null,
            tags: ingredient.tags || [],
            badges: ingredient.badges || [],
            adminTags: ingredient.adminTags || null,
          };

          // Check if ingredient exists by ingredientKey + role
          const existing = await prisma.ingredients.findFirst({
            where: { 
              ingredientKey: ingredient.ingredientKey,
              role: ingredient.role || 'addIn'
            },
          });

          if (existing) {
            // Update existing ingredient
            await prisma.ingredients.update({
              where: { id: existing.id },
              data: ingredientData,
            });
            updated++;
          } else {
            // Create new ingredient
            await prisma.ingredients.create({
              data: ingredientData,
            });
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import "${ingredient.name}": ${(error as Error).message}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        updated,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [`Import failed: ${(error as Error).message}`],
      };
    }
  }
}
