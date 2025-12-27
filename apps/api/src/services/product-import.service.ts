/**
 * Product Import Service
 * Handles bulk product import from CSV files
 */

import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

export interface ProductImportRow {
  name: string;
  description: string;
  price: string;
  stock?: string;
  category?: string;
  imageUrl?: string;
  images?: string;
  tags?: string;
  isActive?: string;
  compareAtPrice?: string;
  lowStockThreshold?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
}

export class ProductImportService {
  /**
   * Parse CSV content
   */
  private async parseCSV(csvContent: string): Promise<ProductImportRow[]> {
    return new Promise((resolve, reject) => {
      const records: ProductImportRow[] = [];
      
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle UTF-8 BOM
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', (err) => reject(err));
      parser.on('end', () => resolve(records));

      // Convert string to stream
      const stream = Readable.from([csvContent]);
      stream.pipe(parser);
    });
  }

  /**
   * Validate and transform a single row
   */
  private validateRow(row: ProductImportRow): { valid: boolean; data?: Prisma.productsCreateInput; error?: string } {
    // Required fields
    if (!row.name || row.name.trim() === '') {
      return { valid: false, error: 'Name is required' };
    }

    if (!row.description || row.description.trim() === '') {
      return { valid: false, error: 'Description is required' };
    }

    if (!row.price || isNaN(parseFloat(row.price))) {
      return { valid: false, error: 'Valid price is required' };
    }

    const price = parseFloat(row.price);
    if (price < 0) {
      return { valid: false, error: 'Price must be positive' };
    }

    // Parse optional fields
    const stock = row.stock ? parseInt(row.stock) : 0;
    if (isNaN(stock) || stock < 0) {
      return { valid: false, error: 'Stock must be a non-negative number' };
    }

    const isActive = row.isActive ? row.isActive.toLowerCase() === 'true' || row.isActive === '1' : true;

    // Parse images array (comma-separated URLs)
    const imagesArray = row.images 
      ? row.images.split(',').map(url => url.trim()).filter(url => url.length > 0)
      : [];

    // Parse tags array (comma-separated)
    const tagsArray = row.tags
      ? row.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Parse compareAtPrice
    let compareAtPrice = undefined;
    if (row.compareAtPrice) {
      const parsed = parseFloat(row.compareAtPrice);
      if (!isNaN(parsed) && parsed > 0) {
        compareAtPrice = parsed;
      }
    }

    // Parse lowStockThreshold
    let lowStockThreshold = 5; // Default
    if (row.lowStockThreshold) {
      const parsed = parseInt(row.lowStockThreshold);
      if (!isNaN(parsed) && parsed >= 0) {
        lowStockThreshold = parsed;
      }
    }

    // Create product data
    // Note: UUID generation could be optimized for large batches by letting
    // the database generate IDs automatically, but this maintains consistency
    // with existing product creation patterns in the codebase.
    const productData: Prisma.productsCreateInput = {
      id: crypto.randomUUID(),
      name: row.name.trim(),
      description: row.description.trim(),
      price: price,
      stock: stock,
      category: row.category && row.category.trim() !== '' ? row.category.trim() : null,
      imageUrl: row.imageUrl && row.imageUrl.trim() !== '' ? row.imageUrl.trim() : null,
      images: imagesArray,
      tags: tagsArray,
      isActive: isActive,
      compareAtPrice: compareAtPrice,
      lowStockThreshold: lowStockThreshold,
      trackInventory: true,
      updatedAt: new Date(),
    };

    return { valid: true, data: productData };
  }

  /**
   * Import products from CSV content
   */
  async importFromCSV(csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Parse CSV
      const rows = await this.parseCSV(csvContent);

      if (rows.length === 0) {
        result.errors.push({ row: 0, error: 'CSV file is empty or invalid' });
        return result;
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed
        const row = rows[i];

        const validation = this.validateRow(row);
        
        if (!validation.valid) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: validation.error || 'Validation failed',
            data: row,
          });
          continue;
        }

        // Try to create product
        try {
          await prisma.products.create({
            data: validation.data!,
          });
          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: (error as Error).message,
            data: row,
          });
        }
      }

      result.success = result.imported > 0;
      return result;

    } catch (error) {
      result.errors.push({
        row: 0,
        error: `CSV parsing error: ${(error as Error).message}`,
      });
      return result;
    }
  }

  /**
   * Generate CSV template
   */
  generateCSVTemplate(): string {
    const headers = [
      'name',
      'description',
      'price',
      'stock',
      'category',
      'imageUrl',
      'images',
      'tags',
      'isActive',
      'compareAtPrice',
      'lowStockThreshold',
    ];

    const exampleRow = [
      'Sample Product',
      'A detailed description of the product',
      '19.99',
      '50',
      'Coffee Blends',
      'https://example.com/image.jpg',
      'https://example.com/img1.jpg,https://example.com/img2.jpg',
      'coffee,blend,morning',
      'true',
      '24.99',
      '10',
    ];

    return `${headers.join(',')}\n${exampleRow.join(',')}`;
  }

  /**
   * Validate CSV format before import
   */
  async validateCSV(csvContent: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const rows = await this.parseCSV(csvContent);

      if (rows.length === 0) {
        errors.push('CSV file is empty');
        return { valid: false, errors };
      }

      // Check required columns
      const firstRow = rows[0];
      const requiredColumns = ['name', 'description', 'price'];
      
      for (const col of requiredColumns) {
        if (!(col in firstRow)) {
          errors.push(`Missing required column: ${col}`);
        }
      }

      return { valid: errors.length === 0, errors };

    } catch (error) {
      errors.push(`CSV parsing error: ${(error as Error).message}`);
      return { valid: false, errors };
    }
  }
}
