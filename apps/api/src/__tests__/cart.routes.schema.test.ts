/**
 * Cart Routes Schema Validation Tests
 *
 * Tests that the cart routes correctly handle float to integer conversion
 * for quantity fields.
 */

import { z } from 'zod';

// Replicate the schema from cart.routes.ts to test in isolation
const intQuantitySchema = z.preprocess(
  (val) => (typeof val === 'number' ? Math.floor(val) : val),
  z.number().int().min(1)
);

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: intQuantitySchema.default(1),
});

const updateCartItemSchema = z.object({
  productId: z.string(),
  quantity: intQuantitySchema,
});

const addBlendToCartSchema = z.object({
  baseTeaId: z.string(),
  addIns: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: intQuantitySchema,
    })
  ),
});

describe('Cart Routes Schema Validation', () => {
  describe('addToCartSchema', () => {
    it('should accept integer quantity', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1', quantity: 2 });
      expect(result).toEqual({ productId: 'prod-1', quantity: 2 });
    });

    it('should convert float quantity to integer using floor', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1', quantity: 1.5 });
      expect(result).toEqual({ productId: 'prod-1', quantity: 1 });
    });

    it('should convert float 1.0 to integer 1', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1', quantity: 1.0 });
      expect(result).toEqual({ productId: 'prod-1', quantity: 1 });
    });

    it('should use default quantity of 1 when not provided', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1' });
      expect(result).toEqual({ productId: 'prod-1', quantity: 1 });
    });

    it('should reject quantity that floors to 0', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: 0.5 })).toThrow();
    });

    it('should reject negative quantity', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: -1 })).toThrow();
    });
  });

  describe('updateCartItemSchema', () => {
    it('should accept integer quantity', () => {
      const result = updateCartItemSchema.parse({ productId: 'prod-1', quantity: 5 });
      expect(result).toEqual({ productId: 'prod-1', quantity: 5 });
    });

    it('should convert float quantity to integer', () => {
      const result = updateCartItemSchema.parse({ productId: 'prod-1', quantity: 2.7 });
      expect(result).toEqual({ productId: 'prod-1', quantity: 2 });
    });
  });

  describe('addBlendToCartSchema', () => {
    it('should accept integer quantity in addIns', () => {
      const result = addBlendToCartSchema.parse({
        baseTeaId: 'tea-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 3 }],
      });
      expect(result).toEqual({
        baseTeaId: 'tea-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 3 }],
      });
    });

    it('should convert float quantity to integer in addIns', () => {
      const result = addBlendToCartSchema.parse({
        baseTeaId: 'tea-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 3.9 }],
      });
      expect(result).toEqual({
        baseTeaId: 'tea-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 3 }],
      });
    });
  });
});
