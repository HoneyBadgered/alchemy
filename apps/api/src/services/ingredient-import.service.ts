/**
 * Ingredient Import Service
 * 
 * Handles CSV import and validation for bulk ingredient uploads
 */

import { parse } from 'csv-parse/sync';
import { prisma } from '../utils/prisma';

const GRAMS_PER_OUNCE = 28.3495;

interface IngredientRow {
  name: string;
  role?: string;
  category: string;
  descriptionShort?: string;
  descriptionLong?: string;
  image?: string;
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
  isBase?: string;
  baseAmount?: string;
  incrementAmount?: string;
}

export class IngredientImportService {
  /**
   * Generate CSV template for ingredient import
   */
  generateTemplate(): string {
    const headers = [
      'name',
      'role',
      'category',
      'descriptionShort',
      'descriptionLong',
      'image',
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
      'isBase',
      'baseAmount',
      'incrementAmount',
    ];

    const exampleRow = [
      'Chamomile Flowers',
      'addIn',
      'Herbal',
      'Calming floral tea',
      'Premium Egyptian chamomile flowers with sweet apple notes',
      'https://example.com/chamomile.jpg',
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
      'false',
      '',
      '',
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
        if (row.baseAmount && isNaN(Number(row.baseAmount))) {
          errors.push(`Row ${rowNum}: baseAmount must be a number`);
        }
        if (row.incrementAmount && isNaN(Number(row.incrementAmount))) {
          errors.push(`Row ${rowNum}: incrementAmount must be a number`);
        }

        // Validate status
        if (row.status && !['active', 'archived', 'outOfStock'].includes(row.status)) {
          errors.push(`Row ${rowNum}: status must be 'active', 'archived', or 'outOfStock'`);
        }

        // Validate caffeine level
        if (row.caffeineLevel && !['none', 'low', 'medium', 'high'].includes(row.caffeineLevel)) {
          errors.push(`Row ${rowNum}: caffeineLevel must be 'none', 'low', 'medium', or 'high'`);
        }

        // Validate boolean
        if (row.isBase && !['true', 'false', ''].includes(row.isBase.toLowerCase())) {
          errors.push(`Row ${rowNum}: isBase must be 'true' or 'false'`);
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
          const ingredientData: any = {
            name: row.name,
            role: row.role || 'addIn',
            category: row.category,
            descriptionShort: row.descriptionShort || null,
            descriptionLong: row.descriptionLong || null,
            image: row.image || null,
            flavorNotes,
            cutOrGrade: row.cutOrGrade || null,
            recommendedUsageMin: row.recommendedUsageMin ? Number(row.recommendedUsageMin) : null,
            recommendedUsageMax: row.recommendedUsageMax ? Number(row.recommendedUsageMax) : null,
            steepTemperature: row.steepTemperature ? Number(row.steepTemperature) : null,
            steepTimeMin: row.steepTimeMin ? Number(row.steepTimeMin) : null,
            steepTimeMax: row.steepTimeMax ? Number(row.steepTimeMax) : null,
            brewNotes: row.brewNotes || null,
            supplierId: row.supplierId || null,
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
            isBase: row.isBase ? row.isBase.toLowerCase() === 'true' : false,
            baseAmount: row.baseAmount ? Number(row.baseAmount) : null,
            incrementAmount: row.incrementAmount ? Number(row.incrementAmount) : null,
          };

          // Check if ingredient exists by name
          const existing = await prisma.ingredients.findFirst({
            where: { name: row.name },
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
}
