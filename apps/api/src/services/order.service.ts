/**
 * Order Service
 * Handles order creation and retrieval for customers
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';

export interface PlaceOrderInput {
  userId?: string;
  sessionId?: string;
  guestEmail?: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod?: string;
  customerNotes?: string;
  discountCode?: string;
}

export interface OrderListFilters {
  page?: number;
  perPage?: number;
  status?: string;
}

interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    price: number | Prisma.Decimal;
    stock: number;
    isActive: boolean;
  };
}

export class OrderService {
  /**
   * Place an order from the user's or guest's cart
   */
  async placeOrder(input: PlaceOrderInput) {
    const { userId, sessionId, guestEmail, shippingAddress, shippingMethod, customerNotes, discountCode } = input;

    // Get user's cart
    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate all products are available and have sufficient stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new Error(`Product ${item.product.name} is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name}`);
      }
    }

    // Calculate order totals
    const subtotal = cart.items.reduce((sum: number, item: CartItemWithProduct) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    let shippingCost = 0;
    if (shippingMethod) {
      const shippingMethodData = await prisma.shippingMethod.findUnique({
        where: { name: shippingMethod },
      });
      if (shippingMethodData && shippingMethodData.isActive) {
        shippingCost = Number(shippingMethodData.price);
      }
    }

    // Calculate tax (simplified - could be enhanced with region-based tax)
    let taxAmount = 0;
    const taxRate = await prisma.taxRate.findFirst({
      where: { 
        region: shippingAddress?.state || 'Global',
        isActive: true,
      },
    });
    if (taxRate) {
      taxAmount = subtotal * Number(taxRate.rate);
    }

    // Apply discount if provided
    let discountAmount = 0;
    let validDiscountCode = null;
    if (discountCode) {
      const discount = await prisma.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (discount && discount.isActive) {
        const now = new Date();
        const isValid = 
          now >= discount.validFrom && 
          (!discount.validUntil || now <= discount.validUntil) &&
          (!discount.maxUses || discount.usedCount < discount.maxUses) &&
          (!discount.minOrderAmount || subtotal >= Number(discount.minOrderAmount));

        if (isValid) {
          validDiscountCode = discount;
          if (discount.discountType === 'percentage') {
            discountAmount = subtotal * (Number(discount.discountValue) / 100);
          } else {
            discountAmount = Number(discount.discountValue);
          }
        }
      }
    }

    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Create order and update inventory in a transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: userId || null,
          guestEmail: guestEmail || null,
          sessionId: sessionId || null,
          status: 'pending',
          totalAmount,
          shippingMethod,
          shippingCost,
          taxAmount,
          discountCode: validDiscountCode?.code,
          discountAmount,
          customerNotes,
          items: {
            create: cart.items.map((item: CartItemWithProduct) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product inventory
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update discount code usage if applicable
      if (validDiscountCode) {
        await tx.discountCode.update({
          where: { id: validDiscountCode.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Create initial status log
      await tx.orderStatusLog.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'pending',
          changedBy: userId || null,
          notes: userId ? 'Order placed' : 'Guest order placed',
        },
      });

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * Get user's order history
   */
  async getOrders(userId: string, filters: OrderListFilters = {}) {
    const { page = 1, perPage = 20, status } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.OrderWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a single order by ID (for the authenticated user)
   */
  async getOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }
}
