/**
 * Pessimistic Locking Tests
 * 
 * Tests to verify inventory locking prevents race conditions during concurrent orders
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../utils/prisma';
import { OrderService } from '../services/order.service';
import { randomUUID } from 'crypto';

describe('Pessimistic Locking for Inventory', () => {
  const orderService = new OrderService();
  let testProductId: string;
  let testUserId1: string;
  let testUserId2: string;
  let cartId1: string;
  let cartId2: string;

  beforeAll(async () => {
    // Create test product with limited stock
    const testProduct = await prisma.products.create({
      data: {
        id: randomUUID(),
        name: 'Limited Stock Test Product',
        description: 'Product for testing race conditions',
        price: 29.99,
        stock: 1, // Only 1 in stock
        isActive: true,
        category: 'test',
      },
    });
    testProductId = testProduct.id;

    // Create two test users
    testUserId1 = randomUUID();
    testUserId2 = randomUUID();

    await prisma.users.create({
      data: {
        id: testUserId1,
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'hashedpassword',
      },
    });

    await prisma.users.create({
      data: {
        id: testUserId2,
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'hashedpassword',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.order_items.deleteMany({
      where: { productId: testProductId },
    });
    await prisma.orders.deleteMany({
      where: { userId: { in: [testUserId1, testUserId2] } },
    });
    await prisma.cart_items.deleteMany({
      where: { productId: testProductId },
    });
    await prisma.carts.deleteMany({
      where: { userId: { in: [testUserId1, testUserId2] } },
    });
    await prisma.products.delete({
      where: { id: testProductId },
    });
    await prisma.users.deleteMany({
      where: { id: { in: [testUserId1, testUserId2] } },
    });
  });

  beforeEach(async () => {
    // Reset product stock
    await prisma.products.update({
      where: { id: testProductId },
      data: { stock: 1 },
    });

    // Clear any existing carts
    await prisma.cart_items.deleteMany({
      where: { productId: testProductId },
    });
    await prisma.carts.deleteMany({
      where: { userId: { in: [testUserId1, testUserId2] } },
    });

    // Create carts with the product for both users
    const cart1 = await prisma.carts.create({
      data: {
        id: randomUUID(),
        userId: testUserId1,
        sessionId: null,
      },
    });
    cartId1 = cart1.id;

    const cart2 = await prisma.carts.create({
      data: {
        id: randomUUID(),
        userId: testUserId2,
        sessionId: null,
      },
    });
    cartId2 = cart2.id;

    await prisma.cart_items.create({
      data: {
        id: randomUUID(),
        cartId: cartId1,
        productId: testProductId,
        quantity: 1,
      },
    });

    await prisma.cart_items.create({
      data: {
        id: randomUUID(),
        cartId: cartId2,
        productId: testProductId,
        quantity: 1,
      },
    });
  });

  it('should prevent race conditions with pessimistic locking', async () => {
    // Simulate two concurrent order attempts for the same product
    const order1Promise = orderService.placeOrder({
      userId: testUserId1,
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
      },
      shippingMethod: 'standard',
    });

    const order2Promise = orderService.placeOrder({
      userId: testUserId2,
      shippingAddress: {
        street: '456 Test Ave',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
      },
      shippingMethod: 'standard',
    });

    // Wait for both promises
    const results = await Promise.allSettled([order1Promise, order2Promise]);

    // Exactly one should succeed, one should fail
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // The failure should be due to insufficient stock
    const failedResult = failures[0] as PromiseRejectedResult;
    expect(failedResult.reason.message).toContain('Insufficient stock');

    // Verify stock is now 0
    const updatedProduct = await prisma.products.findUnique({
      where: { id: testProductId },
    });
    expect(updatedProduct?.stock).toBe(0);

    // Verify only one order was created
    const orders = await prisma.orders.findMany({
      where: {
        userId: { in: [testUserId1, testUserId2] },
      },
    });
    expect(orders.length).toBe(1);
  });

  it('should handle multiple products with mixed stock levels', async () => {
    // Create second product with more stock
    const product2 = await prisma.products.create({
      data: {
        id: randomUUID(),
        name: 'High Stock Product',
        description: 'Product with plenty of stock',
        price: 19.99,
        stock: 10,
        isActive: true,
        category: 'test',
      },
    });

    // Add second product to both carts
    await prisma.cart_items.createMany({
      data: [
        {
          id: randomUUID(),
          cartId: cartId1,
          productId: product2.id,
          quantity: 1,
        },
        {
          id: randomUUID(),
          cartId: cartId2,
          productId: product2.id,
          quantity: 1,
        },
      ],
    });

    // Both orders should succeed for product2, but race for product1
    const [result1, result2] = await Promise.allSettled([
      orderService.placeOrder({
        userId: testUserId1,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        shippingMethod: 'standard',
      }),
      orderService.placeOrder({
        userId: testUserId2,
        shippingAddress: {
          street: '456 Test Ave',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        shippingMethod: 'standard',
      }),
    ]);

    // One should fail due to limited stock product
    expect(result1.status === 'fulfilled' ? 1 : 0 + result2.status === 'fulfilled' ? 1 : 0).toBe(1);

    // Verify product2 stock decreased by 1 (only one order succeeded)
    const updatedProduct2 = await prisma.products.findUnique({
      where: { id: product2.id },
    });
    expect(updatedProduct2?.stock).toBe(9);

    // Cleanup
    await prisma.cart_items.deleteMany({
      where: { productId: product2.id },
    });
    await prisma.products.delete({
      where: { id: product2.id },
    });
  });
});
