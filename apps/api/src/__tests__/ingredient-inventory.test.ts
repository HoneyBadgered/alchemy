/**
 * Ingredient Inventory Tracking Tests
 * 
 * Tests ingredient inventory decrements when blend products are ordered.
 * Validates that blends cannot be created or ordered when ingredient stock is insufficient.
 * Tests pessimistic locking prevents concurrent blend orders from overselling ingredients.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../utils/prisma';
import { OrderService } from '../services/order.service';
import { CartService } from '../services/cart.service';

describe('Ingredient Inventory Tracking', () => {
  const orderService = new OrderService();
  const cartService = new CartService();

  let testUserId: string;
  let baseTeaId: string;
  let addIn1Id: string;
  let addIn2Id: string;

  beforeAll(async () => {
    // Create test user
    testUserId = `test-user-${Date.now()}`;

    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: 'test-hash',
      },
    });

    // Create test ingredients with inventory
    const baseTea = await prisma.ingredients.create({
      data: {
        id: `base-tea-${Date.now()}`,
        name: 'Test Green Tea',
        category: 'Green Tea',
        role: 'base',
        status: 'active',
        inventoryAmount: 100, // 100 units available
        minimumStockLevel: 10,
        baseAmount: 1,
        incrementAmount: 0.5,
      },
    });
    baseTeaId = baseTea.id;

    const addIn1 = await prisma.ingredients.create({
      data: {
        id: `addin-1-${Date.now()}`,
        name: 'Test Lavender',
        category: 'Florals',
        role: 'addIn',
        status: 'active',
        inventoryAmount: 50, // 50 units available
        minimumStockLevel: 5,
        baseAmount: 0.5,
        incrementAmount: 0.25,
      },
    });
    addIn1Id = addIn1.id;

    const addIn2 = await prisma.ingredients.create({
      data: {
        id: `addin-2-${Date.now()}`,
        name: 'Test Chamomile',
        category: 'Florals',
        role: 'addIn',
        status: 'active',
        inventoryAmount: 30, // 30 units available
        minimumStockLevel: 3,
        baseAmount: 0.5,
        incrementAmount: 0.25,
      },
    });
    addIn2Id = addIn2.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.order_items.deleteMany({ where: { orders: { userId: testUserId } } });
    await prisma.orders.deleteMany({ where: { userId: testUserId } });
    await prisma.cart_items.deleteMany({ where: { carts: { userId: testUserId } } });
    await prisma.carts.deleteMany({ where: { userId: testUserId } });
    await prisma.blends.deleteMany({ where: { userId: testUserId } });
    await prisma.products.deleteMany({ where: { category: 'custom-blend' } });
    await prisma.ingredients.deleteMany({ where: { id: { in: [baseTeaId, addIn1Id, addIn2Id] } } });
    await prisma.users.deleteMany({ where: { id: testUserId } });
  });

  beforeEach(async () => {
    // Clear cart before each test
    await prisma.cart_items.deleteMany({ where: { carts: { userId: testUserId } } });
    await prisma.carts.deleteMany({ where: { userId: testUserId } });
  });

  describe('Cart Validation', () => {
    it('should prevent adding blend to cart when base tea inventory is insufficient', async () => {
      // Set base tea inventory to 0
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 0 },
      });

      await expect(
        cartService.addBlendToCart({
          baseTeaId,
          addIns: [{ ingredientId: addIn1Id, quantity: 1 }],
          userId: testUserId,
        })
      ).rejects.toThrow(/Insufficient inventory for base tea/);

      // Restore inventory
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 100 },
      });
    });

    it('should prevent adding blend to cart when add-in inventory is insufficient', async () => {
      // Set add-in inventory to 0
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 0 },
      });

      await expect(
        cartService.addBlendToCart({
          baseTeaId,
          addIns: [{ ingredientId: addIn1Id, quantity: 2 }],
          userId: testUserId,
        })
      ).rejects.toThrow(/Insufficient inventory for ingredient/);

      // Restore inventory
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });
    });

    it('should prevent adding blend when ingredient is inactive', async () => {
      // Set add-in to inactive
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { status: 'inactive' },
      });

      await expect(
        cartService.addBlendToCart({
          baseTeaId,
          addIns: [{ ingredientId: addIn1Id, quantity: 1 }],
          userId: testUserId,
        })
      ).rejects.toThrow(/is not currently available/);

      // Restore status
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { status: 'active' },
      });
    });

    it('should allow adding blend when all ingredients have sufficient inventory', async () => {
      const result = await cartService.addBlendToCart({
        baseTeaId,
        addIns: [
          { ingredientId: addIn1Id, quantity: 2 },
          { ingredientId: addIn2Id, quantity: 1 },
        ],
        userId: testUserId,
        blendName: 'Test Blend',
      });

      expect(result).toBeDefined();
      expect(result.cart.cart_items).toHaveLength(1);
      expect(result.cart.cart_items[0].products.category).toBe('custom-blend');
    });
  });

  describe('Order Placement - Ingredient Inventory Decrements', () => {
    it('should decrement ingredient inventory when blend order is placed', async () => {
      // Reset ingredient inventory to known values
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 100 },
      });
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });
      await prisma.ingredients.update({
        where: { id: addIn2Id },
        data: { inventoryAmount: 30 },
      });

      // Add blend to cart
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [
          { ingredientId: addIn1Id, quantity: 2 },
          { ingredientId: addIn2Id, quantity: 1 },
        ],
        userId: testUserId,
        blendName: 'Relaxing Blend',
      });

      // Place order
      const order = await orderService.placeOrder({
        userId: testUserId,
        guestEmail: 'test@example.com',
      });

      expect(order).toBeDefined();
      expect(order.status).toBe('pending');

      // Verify ingredient inventory decremented
      const baseTea = await prisma.ingredients.findUnique({ where: { id: baseTeaId } });
      const addIn1 = await prisma.ingredients.findUnique({ where: { id: addIn1Id } });
      const addIn2 = await prisma.ingredients.findUnique({ where: { id: addIn2Id } });

      expect(Number(baseTea?.inventoryAmount)).toBe(99); // 100 - 1 (base tea per blend)
      expect(Number(addIn1?.inventoryAmount)).toBe(48); // 50 - 2
      expect(Number(addIn2?.inventoryAmount)).toBe(29); // 30 - 1
    });

    it('should prevent order when ingredient inventory becomes insufficient between cart and checkout', async () => {
      // Reset inventory
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 2 },
      });

      // Add blend to cart requiring 2 units
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn1Id, quantity: 2 }],
        userId: testUserId,
      });

      // Simulate another process reducing inventory to 1
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 1 },
      });

      // Attempt to place order - should fail
      await expect(
        orderService.placeOrder({
          userId: testUserId,
          guestEmail: 'test@example.com',
        })
      ).rejects.toThrow(/Insufficient ingredient inventory/);

      // Restore inventory
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });
    });

    it('should handle multiple blend products in single order', async () => {
      // Reset inventory
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 100 },
      });
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });
      await prisma.ingredients.update({
        where: { id: addIn2Id },
        data: { inventoryAmount: 30 },
      });

      // Add first blend
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn1Id, quantity: 2 }],
        userId: testUserId,
        blendName: 'Blend 1',
      });

      // Add second blend
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn2Id, quantity: 3 }],
        userId: testUserId,
        blendName: 'Blend 2',
      });

      // Place order
      const order = await orderService.placeOrder({
        userId: testUserId,
        guestEmail: 'test@example.com',
      });

      expect(order).toBeDefined();
      expect(order.order_items).toHaveLength(2);

      // Verify ingredient inventory
      const baseTea = await prisma.ingredients.findUnique({ where: { id: baseTeaId } });
      const addIn1 = await prisma.ingredients.findUnique({ where: { id: addIn1Id } });
      const addIn2 = await prisma.ingredients.findUnique({ where: { id: addIn2Id } });

      expect(Number(baseTea?.inventoryAmount)).toBe(98); // 100 - 2 (2 blends)
      expect(Number(addIn1?.inventoryAmount)).toBe(48); // 50 - 2
      expect(Number(addIn2?.inventoryAmount)).toBe(27); // 30 - 3
    });

    it('should handle blend with same ingredient used multiple times', async () => {
      // Reset inventory
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 100 },
      });
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });

      // Create blend using same base tea as add-in (edge case)
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [
          { ingredientId: addIn1Id, quantity: 2 },
          { ingredientId: addIn1Id, quantity: 3 }, // Same ingredient twice
        ],
        userId: testUserId,
        blendName: 'Double Lavender Blend',
      });

      // Place order
      const order = await orderService.placeOrder({
        userId: testUserId,
        guestEmail: 'test@example.com',
      });

      expect(order).toBeDefined();

      // Verify total deduction is sum of both uses
      const addIn1 = await prisma.ingredients.findUnique({ where: { id: addIn1Id } });
      expect(Number(addIn1?.inventoryAmount)).toBe(45); // 50 - (2 + 3)
    });
  });

  describe('Concurrent Order Race Conditions', () => {
    it('should prevent overselling ingredients with concurrent blend orders', async () => {
      // Reset inventory to only 5 units
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 5 },
      });

      // Create two users with carts containing blends that need 4 units each
      const user1Id = `race-user-1-${Date.now()}`;
      const user2Id = `race-user-2-${Date.now()}`;

      await prisma.users.create({
        data: {
          id: user1Id,
          email: `race1-${Date.now()}@example.com`,
          username: `race1${Date.now()}`,
          password: 'hash',
        },
      });

      await prisma.users.create({
        data: {
          id: user2Id,
          email: `race2-${Date.now()}@example.com`,
          username: `race2${Date.now()}`,
          password: 'hash',
        },
      });

      // Add blends to both carts
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn1Id, quantity: 4 }],
        userId: user1Id,
      });

      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn1Id, quantity: 4 }],
        userId: user2Id,
      });

      // Attempt concurrent order placement
      const results = await Promise.allSettled([
        orderService.placeOrder({ userId: user1Id, guestEmail: 'race1@example.com' }),
        orderService.placeOrder({ userId: user2Id, guestEmail: 'race2@example.com' }),
      ]);

      // Exactly one should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // Verify no overselling occurred
      const addIn1 = await prisma.ingredients.findUnique({ where: { id: addIn1Id } });
      expect(Number(addIn1?.inventoryAmount)).toBe(1); // 5 - 4 = 1

      // Cleanup
      await prisma.order_items.deleteMany({ where: { orders: { userId: { in: [user1Id, user2Id] } } } });
      await prisma.orders.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
      await prisma.cart_items.deleteMany({ where: { carts: { userId: { in: [user1Id, user2Id] } } } });
      await prisma.carts.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
      await prisma.blends.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
      await prisma.users.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
      
      // Restore inventory
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });
    });
  });

  describe('Mixed Cart (Regular Products + Blends)', () => {
    it('should correctly decrement both product stock and ingredient inventory', async () => {
      // Create a regular product
      const regularProduct = await prisma.products.create({
        data: {
          id: `regular-product-${Date.now()}`,
          name: 'Regular Tea Product',
          description: 'Pre-made tea',
          price: 15.99,
          category: 'Black Tea',
          stock: 10,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Reset ingredient inventory
      await prisma.ingredients.update({
        where: { id: baseTeaId },
        data: { inventoryAmount: 100 },
      });
      await prisma.ingredients.update({
        where: { id: addIn1Id },
        data: { inventoryAmount: 50 },
      });

      // Add regular product to cart
      await cartService.addToCart({
        productId: regularProduct.id,
        quantity: 2,
        userId: testUserId,
      });

      // Add blend to cart
      await cartService.addBlendToCart({
        baseTeaId,
        addIns: [{ ingredientId: addIn1Id, quantity: 3 }],
        userId: testUserId,
      });

      // Place order
      const order = await orderService.placeOrder({
        userId: testUserId,
        guestEmail: 'test@example.com',
      });

      expect(order).toBeDefined();
      expect(order.order_items).toHaveLength(2);

      // Verify regular product stock decremented
      const updatedProduct = await prisma.products.findUnique({ where: { id: regularProduct.id } });
      expect(updatedProduct?.stock).toBe(8); // 10 - 2

      // Verify blend ingredient inventory decremented
      const baseTea = await prisma.ingredients.findUnique({ where: { id: baseTeaId } });
      const addIn1 = await prisma.ingredients.findUnique({ where: { id: addIn1Id } });
      expect(Number(baseTea?.inventoryAmount)).toBe(99); // 100 - 1
      expect(Number(addIn1?.inventoryAmount)).toBe(47); // 50 - 3

      // Cleanup
      await prisma.products.delete({ where: { id: regularProduct.id } });
    });
  });
});
