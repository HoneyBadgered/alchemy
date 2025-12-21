/**
 * Order Service
 * Handles order creation and retrieval for customers
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { 
  BadRequestError, 
  NotFoundError, 
  InsufficientStockError, 
  OrderValidationError 
} from '../utils/errors';

/**
 * Generate a unique order ID in the format: ALC-YYMMDD-XXXX
 * Example: ALC-251221-A3F9
 */
function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate 4 random alphanumeric characters (uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  
  return `ALC-${year}${month}${day}-${randomPart}`;
}

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

    let cart: Awaited<ReturnType<typeof prisma.carts.findFirst>> | null = null;

    try {
      // Get user's cart
      cart = await prisma.carts.findFirst({
        where: userId ? { userId } : { sessionId },
        include: {
          cart_items: {
            include: {
              products: true,
            },
          },
        },
      });

      if (!cart || cart.cart_items.length === 0) {
        throw new BadRequestError('Cart is empty');
      }

      // Validate all products are available and have sufficient stock BEFORE transaction
      const stockValidation: Array<{ productName: string; issue: string }> = [];
      for (const item of cart.cart_items) {
        if (!item.products.isActive) {
          stockValidation.push({
            productName: item.products.name,
            issue: 'no longer available',
          });
        }
        if (item.products.stock < item.quantity) {
          stockValidation.push({
            productName: item.products.name,
            issue: `insufficient stock (requested: ${item.quantity}, available: ${item.products.stock})`,
          });
        }
      }

      if (stockValidation.length > 0) {
        throw new InsufficientStockError('Stock validation failed', { issues: stockValidation });
      }

      // Calculate order totals
      const subtotal = cart.cart_items.reduce((sum: number, item: CartItemWithProduct) => {
        return sum + Number(item.products.price) * item.quantity;
      }, 0);

      let shippingCost = 0;
      if (shippingMethod) {
        const shippingMethodData = await prisma.shipping_methods.findUnique({
          where: { name: shippingMethod },
        });
        if (shippingMethodData && shippingMethodData.isActive) {
          shippingCost = Number(shippingMethodData.price);
        }
      }

      // Calculate tax (simplified - could be enhanced with region-based tax)
      let taxAmount = 0;
      const taxRate = await prisma.tax_rates.findFirst({
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
        const discount = await prisma.discount_codes.findUnique({
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

      // Create order and update inventory in a transaction with proper error handling
      const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Double-check stock levels inside transaction to prevent race conditions
        for (const item of cart.cart_items) {
          const currentProduct = await tx.products.findUnique({
            where: { id: item.productId },
            select: { stock: true, isActive: true },
          });

          if (!currentProduct || !currentProduct.isActive) {
            throw new OrderValidationError(`Product ${item.products.name} is no longer available`);
          }

          if (currentProduct.stock < item.quantity) {
            throw new InsufficientStockError(
              `Insufficient stock for ${item.products.name}`,
              { 
                productId: item.productId,
                requested: item.quantity,
                available: currentProduct.stock,
              }
            );
          }
        }

        // Create order
        const newOrder = await tx.orders.create({
          data: {
            id: generateOrderId(),
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
            updatedAt: new Date(),
            order_items: {
            create: cart.cart_items.map((item: CartItemWithProduct) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              quantity: item.quantity,
              price: item.products.price,
            })),
          },
        },
        include: {
          order_items: {
            include: {
              products: true,
            },
          },
        },
      });

      // Update product inventory
      for (const item of cart.cart_items) {
        await tx.products.update({
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
        await tx.discount_codes.update({
          where: { id: validDiscountCode.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Create initial status log
      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'pending',
          changedBy: userId || null,
          notes: userId ? 'Order placed' : 'Guest order placed',
        },
      });

      // Clear the cart
      await tx.cart_items.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    }, {
      maxWait: 5000, // Max 5 seconds to acquire a connection
      timeout: 15000, // Max 15 seconds for transaction
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });

      return order;

    } catch (error) {
      // Log the error for monitoring
      console.error('Order placement failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        sessionId,
        cartId: cart?.id,
      });

      // Re-throw known ApiErrors
      if (error instanceof BadRequestError || 
          error instanceof InsufficientStockError || 
          error instanceof OrderValidationError) {
        throw error;
      }

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') {
          throw new OrderValidationError('Transaction conflict - please try again');
        }
        if (error.code === 'P2025') {
          throw new NotFoundError('One or more items no longer exist');
        }
      }

      // Wrap unknown errors
      throw new BadRequestError(
        'Failed to place order. Please try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get user's order history
   */
  async getOrders(userId: string, filters: OrderListFilters = {}) {
    const { page = 1, perPage = 20, status } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.ordersWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          order_items: {
            include: {
              products: true,
            },
          },
        },
      }),
      prisma.orders.count({ where }),
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
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}
