/**
 * Zone Import Service
 * 
 * Handles CSV and JSON import for bulk zone uploads
 */

import { parse } from 'csv-parse/sync';
import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';

interface ZoneRow {
  name: string;
  slug: string;
  tagline: string;
  theme: string;
  gradient: string;
  bgGradient: string;
  accentColor: string;
  heroImageUrl?: string;
  buttonImageUrl?: string;
  defaultFilters: string; // JSON string
  subTabs: string; // JSON string
  sortOrder?: string;
  isActive?: string;
}

export class ZoneImportService {
  /**
   * Generate CSV template for zone import
   */
  generateTemplate(): string {
    const headers = [
      'name',
      'slug',
      'tagline',
      'theme',
      'gradient',
      'bgGradient',
      'accentColor',
      'heroImageUrl',
      'buttonImageUrl',
      'defaultFilters',
      'subTabs',
      'sortOrder',
      'isActive',
    ];

    const exampleRow = [
      'The Hearthhouse',
      'hearthhouse',
      'Dark, smoky, grounding',
      'Where warmth gathers and stories linger',
      'from-amber-900 via-orange-800 to-red-900',
      'from-stone-950 via-stone-900 to-stone-950',
      'amber',
      'https://example.com/hearthhouse-hero.jpg',
      'https://example.com/hearthhouse-button.jpg',
      '{"flavorProfile":["smoky","roasted"],"caffeineLevel":["medium","high"]}',
      '[{"id":"all","label":"All","bias":null},{"id":"deep","label":"Deep","bias":["smoky","roasted","earthy"]}]',
      '1',
      'true',
    ];

    return `${headers.join(',')}\n${exampleRow.join(',')}\n`;
  }

  /**
   * Validate slug format (URL-safe)
   */
  private isValidSlug(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  /**
   * Validate Tailwind gradient classes
   */
  private isValidGradient(gradient: string): boolean {
    // Basic validation for Tailwind gradient format
    return gradient.startsWith('from-') && gradient.includes('to-');
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
      }) as ZoneRow[];

      if (records.length === 0) {
        errors.push('CSV file is empty');
        return { valid: false, errors };
      }

      // Validate each row
      for (let index = 0; index < records.length; index++) {
        const row = records[index];
        const rowNum = index + 2; // +2 for header and 0-index

        // Required fields
        if (!row.name || row.name.trim() === '') {
          errors.push(`Row ${rowNum}: Name is required`);
        }
        if (!row.slug || row.slug.trim() === '') {
          errors.push(`Row ${rowNum}: Slug is required`);
        } else if (!this.isValidSlug(row.slug)) {
          errors.push(`Row ${rowNum}: Slug must be lowercase, alphanumeric with hyphens only (e.g., 'east-pavilion')`);
        }
        if (!row.tagline || row.tagline.trim() === '') {
          errors.push(`Row ${rowNum}: Tagline is required`);
        }
        if (!row.theme || row.theme.trim() === '') {
          errors.push(`Row ${rowNum}: Theme is required`);
        }
        if (!row.gradient || row.gradient.trim() === '') {
          errors.push(`Row ${rowNum}: Gradient is required`);
        } else if (!this.isValidGradient(row.gradient)) {
          errors.push(`Row ${rowNum}: Gradient must be valid Tailwind gradient (e.g., 'from-blue-500 to-purple-600')`);
        }
        if (!row.bgGradient || row.bgGradient.trim() === '') {
          errors.push(`Row ${rowNum}: Background gradient is required`);
        } else if (!this.isValidGradient(row.bgGradient)) {
          errors.push(`Row ${rowNum}: Background gradient must be valid Tailwind gradient`);
        }
        if (!row.accentColor || row.accentColor.trim() === '') {
          errors.push(`Row ${rowNum}: Accent color is required`);
        }

        // Validate JSON fields
        if (row.defaultFilters) {
          try {
            const filters = JSON.parse(row.defaultFilters);
            if (!filters.flavorProfile || !Array.isArray(filters.flavorProfile)) {
              errors.push(`Row ${rowNum}: defaultFilters must include flavorProfile array`);
            }
            if (!filters.caffeineLevel || !Array.isArray(filters.caffeineLevel)) {
              errors.push(`Row ${rowNum}: defaultFilters must include caffeineLevel array`);
            }
          } catch (e) {
            errors.push(`Row ${rowNum}: defaultFilters must be valid JSON`);
          }
        } else {
          errors.push(`Row ${rowNum}: defaultFilters is required`);
        }

        if (row.subTabs) {
          try {
            const tabs = JSON.parse(row.subTabs);
            if (!Array.isArray(tabs)) {
              errors.push(`Row ${rowNum}: subTabs must be an array`);
            } else {
              tabs.forEach((tab: any, tabIndex: number) => {
                if (!tab.id || !tab.label) {
                  errors.push(`Row ${rowNum}: subTabs[${tabIndex}] must have id and label`);
                }
              });
            }
          } catch (e) {
            errors.push(`Row ${rowNum}: subTabs must be valid JSON`);
          }
        } else {
          errors.push(`Row ${rowNum}: subTabs is required`);
        }

        // Validate sortOrder
        if (row.sortOrder && isNaN(Number(row.sortOrder))) {
          errors.push(`Row ${rowNum}: sortOrder must be a number`);
        }

        // Validate isActive
        if (row.isActive && !['true', 'false'].includes(row.isActive.toLowerCase())) {
          errors.push(`Row ${rowNum}: isActive must be 'true' or 'false'`);
        }

        // Validate image URLs if provided
        if (row.heroImageUrl && row.heroImageUrl.trim() !== '') {
          try {
            new URL(row.heroImageUrl);
          } catch {
            errors.push(`Row ${rowNum}: heroImageUrl must be a valid URL`);
          }
        }
        if (row.buttonImageUrl && row.buttonImageUrl.trim() !== '') {
          try {
            new URL(row.buttonImageUrl);
          } catch {
            errors.push(`Row ${rowNum}: buttonImageUrl must be a valid URL`);
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`CSV parsing error: ${(error as Error).message}`);
      return { valid: false, errors };
    }
  }

  /**
   * Import zones from CSV
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
      }) as ZoneRow[];

      // Process each row
      for (const row of records) {
        try {
          // Parse JSON fields
          const defaultFilters = JSON.parse(row.defaultFilters);
          const subTabs = JSON.parse(row.subTabs);

          // Prepare zone data
          const zoneData: Prisma.zonesCreateInput = {
            name: row.name,
            slug: row.slug,
            tagline: row.tagline,
            theme: row.theme,
            gradient: row.gradient,
            bgGradient: row.bgGradient,
            accentColor: row.accentColor,
            heroImageUrl: row.heroImageUrl || null,
            buttonImageUrl: row.buttonImageUrl || null,
            defaultFilters,
            subTabs,
            sortOrder: row.sortOrder ? Number(row.sortOrder) : 0,
            isActive: row.isActive ? row.isActive.toLowerCase() === 'true' : true,
          };

          // Check if zone exists by slug
          const existing = await prisma.zones.findUnique({
            where: { slug: row.slug },
          });

          if (existing) {
            // Update existing zone
            await prisma.zones.update({
              where: { id: existing.id },
              data: zoneData,
            });
            updated++;
          } else {
            // Create new zone
            await prisma.zones.create({
              data: zoneData,
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
   * Validate JSON zone data
   */
  validateJSONZone(zone: any, index: number): { valid: boolean; error?: string } {
    // Required fields
    if (!zone.name || typeof zone.name !== 'string' || zone.name.trim() === '') {
      return { valid: false, error: `Zone ${index}: Name is required` };
    }
    if (!zone.slug || typeof zone.slug !== 'string' || zone.slug.trim() === '') {
      return { valid: false, error: `Zone ${index}: Slug is required` };
    }
    if (!this.isValidSlug(zone.slug)) {
      return { valid: false, error: `Zone ${index}: Slug must be lowercase, alphanumeric with hyphens only` };
    }
    if (!zone.tagline || typeof zone.tagline !== 'string') {
      return { valid: false, error: `Zone ${index}: Tagline is required` };
    }
    if (!zone.theme || typeof zone.theme !== 'string') {
      return { valid: false, error: `Zone ${index}: Theme is required` };
    }
    if (!zone.gradient || typeof zone.gradient !== 'string') {
      return { valid: false, error: `Zone ${index}: Gradient is required` };
    }
    if (!this.isValidGradient(zone.gradient)) {
      return { valid: false, error: `Zone ${index}: Gradient must be valid Tailwind gradient` };
    }
    if (!zone.bgGradient || typeof zone.bgGradient !== 'string') {
      return { valid: false, error: `Zone ${index}: Background gradient is required` };
    }
    if (!this.isValidGradient(zone.bgGradient)) {
      return { valid: false, error: `Zone ${index}: Background gradient must be valid Tailwind gradient` };
    }
    if (!zone.accentColor || typeof zone.accentColor !== 'string') {
      return { valid: false, error: `Zone ${index}: Accent color is required` };
    }

    // Validate defaultFilters
    if (!zone.defaultFilters || typeof zone.defaultFilters !== 'object') {
      return { valid: false, error: `Zone ${index}: defaultFilters is required and must be an object` };
    }
    if (!Array.isArray(zone.defaultFilters.flavorProfile)) {
      return { valid: false, error: `Zone ${index}: defaultFilters.flavorProfile must be an array` };
    }
    if (!Array.isArray(zone.defaultFilters.caffeineLevel)) {
      return { valid: false, error: `Zone ${index}: defaultFilters.caffeineLevel must be an array` };
    }

    // Validate subTabs
    if (!zone.subTabs || !Array.isArray(zone.subTabs)) {
      return { valid: false, error: `Zone ${index}: subTabs is required and must be an array` };
    }
    for (let i = 0; i < zone.subTabs.length; i++) {
      const tab = zone.subTabs[i];
      if (!tab.id || !tab.label) {
        return { valid: false, error: `Zone ${index}: subTabs[${i}] must have id and label` };
      }
    }

    // Validate optional fields
    if (zone.sortOrder !== undefined && typeof zone.sortOrder !== 'number') {
      return { valid: false, error: `Zone ${index}: sortOrder must be a number` };
    }
    if (zone.isActive !== undefined && typeof zone.isActive !== 'boolean') {
      return { valid: false, error: `Zone ${index}: isActive must be a boolean` };
    }

    return { valid: true };
  }

  /**
   * Import zones from JSON array
   */
  async importFromJSON(zones: any[]): Promise<{
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
      if (!Array.isArray(zones)) {
        return {
          success: false,
          imported: 0,
          updated: 0,
          errors: ['Invalid input: expected an array of zones'],
        };
      }

      // Validate all zones first
      for (let i = 0; i < zones.length; i++) {
        const validation = this.validateJSONZone(zones[i], i + 1);
        if (!validation.valid) {
          errors.push(validation.error!);
        }
      }

      if (errors.length > 0) {
        return { success: false, imported: 0, updated: 0, errors };
      }

      // Process each zone
      for (const zone of zones) {
        try {
          // Prepare zone data
          const zoneData: Prisma.zonesCreateInput = {
            name: zone.name,
            slug: zone.slug,
            tagline: zone.tagline,
            theme: zone.theme,
            gradient: zone.gradient,
            bgGradient: zone.bgGradient,
            accentColor: zone.accentColor,
            heroImageUrl: zone.heroImageUrl || null,
            buttonImageUrl: zone.buttonImageUrl || null,
            defaultFilters: zone.defaultFilters,
            subTabs: zone.subTabs,
            sortOrder: zone.sortOrder || 0,
            isActive: zone.isActive !== undefined ? zone.isActive : true,
          };

          // Check if zone exists by slug
          const existing = await prisma.zones.findUnique({
            where: { slug: zone.slug },
          });

          if (existing) {
            // Update existing zone
            await prisma.zones.update({
              where: { id: existing.id },
              data: zoneData,
            });
            updated++;
          } else {
            // Create new zone
            await prisma.zones.create({
              data: zoneData,
            });
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import "${zone.name}": ${(error as Error).message}`);
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
