/**
 * Admin Order Management Service
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { OrderNotificationService } from './order-notification.service';
import { PaymentService } from './payment.service';

export interface OrderFilters {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'totalAmount' | 'status' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateOrderStatusInput {
  status: string;
  notes?: string;
}

export interface MarkAsShippedInput {
  trackingNumber: string;
  carrierName: string;
  shippedAt?: Date;
  notes?: string;
}

export class AdminOrderService {
  private notificationService: OrderNotificationService;
  private paymentService: PaymentService;

  constructor() {
    this.notificationService = new OrderNotificationService();
    this.paymentService = new PaymentService();
  }

  /**
   * Get paginated list of orders with filtering
   */
  async getOrders(filters: OrderFilters) {
    const {
      page = 1,
      perPage = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = filters;

    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.ordersWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { users: { email: { contains: search, mode: 'insensitive' } } },
        { users: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Get orders and total count
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order_items: {
            include: {
              products: true,
            },
          },
          order_status_logs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
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
   * Get single order by ID with full details
   */
  async getOrder(id: string) {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            user_profiles: true,
          },
        },
        order_items: {
          include: {
            products: {
              include: {
                blends: {
                  select: {
                    id: true,
                    name: true,
                    baseTeaId: true,
                    addIns: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
        order_status_logs: {
          include: {
            users: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Enrich blend data with ingredient and base tea details
    for (const item of order.order_items) {
      if (item.products.blends && item.products.blends.length > 0) {
        for (const blend of item.products.blends) {
          // Fetch base tea details - try products table first, then ingredients table
          let baseTea = await prisma.products.findUnique({
            where: { id: blend.baseTeaId },
            select: {
              id: true,
              name: true,
              description: true,
            },
          });

          // If not found in products, try ingredients table
          if (!baseTea) {
            const baseIngredient = await prisma.ingredients.findUnique({
              where: { id: blend.baseTeaId },
              select: {
                id: true,
                name: true,
                descriptionLong: true,
              },
            });
            if (baseIngredient) {
              baseTea = {
                id: baseIngredient.id,
                name: baseIngredient.name,
                description: baseIngredient.descriptionLong,
              };
            }
          }

          // Fetch ingredient details
          const addIns = blend.addIns as Array<{ ingredientId: string; quantity: number }>;
          const ingredientIds = addIns.map((a) => a.ingredientId);
          const ingredients = await prisma.ingredients.findMany({
            where: { id: { in: ingredientIds } },
            select: {
              id: true,
              name: true,
              category: true,
            },
          });

          // Map ingredients to their quantities
          const enrichedAddIns = addIns.map((addIn) => {
            const ingredient = ingredients.find((i) => i.id === addIn.ingredientId);
            return {
              ingredientId: addIn.ingredientId,
              quantity: addIn.quantity,
              ingredient: ingredient || null,
            };
          });

          // Calculate base tea quantity based on blend size
          // Typical ratio: for 2oz blend (56g total), base tea is usually 40-45g, rest is add-ins
          const blendSize = (blend as any).size || 2; // Size in ounces
          const totalGrams = blendSize * 28; // Convert oz to grams (1oz ≈ 28g)
          const addInsTotal = addIns.reduce((sum, a) => sum + a.quantity, 0);
          const baseTeaQuantity = Math.max(0, totalGrams - addInsTotal);

          // Add enriched data to blend
          (blend as any).baseTea = baseTea;
          (blend as any).baseTeaQuantity = baseTeaQuantity;
          (blend as any).enrichedAddIns = enrichedAddIns;
        }
      }
    }

    return order;
  }

  /**
   * Update order status and log the change
   */
  async updateOrderStatus(orderId: string, userId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const fromStatus = order.status;
    const toStatus = input.status;

    // Update order and create status log in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { status: toStatus },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order_items: {
            include: {
              products: true,
            },
          },
        },
      });

      // Create status log
      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          fromStatus,
          toStatus,
          changedBy: userId,
          notes: input.notes,
        },
      });

      return updatedOrder;
    });

    // Send notification emails based on status change
    if (toStatus === 'shipped') {
      try {
        const customerEmail = result.guestEmail || result.users?.email;
        if (customerEmail) {
          console.log(`Status changed to 'shipped' for order ${orderId}, but no tracking info provided via updateOrderStatus`);
          console.warn(`Order ${orderId} marked as shipped without tracking number. Use POST /admin/orders/:id/ship endpoint for full shipping details.`);
        }
      } catch (error) {
        console.error(`Note: Order ${orderId} marked as shipped via status update (no email sent):`, error);
      }
    } else if (toStatus === 'delivered') {
      try {
        const customerEmail = result.guestEmail || result.users?.email;
        if (customerEmail) {
          console.log(`Sending delivery notification to ${customerEmail} for order ${orderId}`);
          await this.notificationService.sendDeliveryNotification(orderId, customerEmail);
          console.log(`Successfully sent delivery notification for order ${orderId}`);
        } else {
          console.warn(`No customer email found for order ${orderId} - cannot send delivery notification`);
        }
      } catch (error) {
        console.error(`Failed to send delivery notification for order ${orderId}:`, error);
      }
    }

    return result;
  }

  /**
   * Mark order as shipped with tracking information
   */
  async markAsShipped(orderId: string, userId: string, input: MarkAsShippedInput) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            email: true,
            username: true,
          },
        },
        order_items: {
          include: {
            products: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate order can be shipped
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error(`Order is already ${order.status}`);
    }

    if (order.status === 'cancelled') {
      throw new Error('Cannot ship a cancelled order');
    }

    const fromStatus = order.status;
    const shippedAt = input.shippedAt || new Date();

    // Update order and create status log in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update order with shipping details
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'shipped',
          trackingNumber: input.trackingNumber,
          carrierName: input.carrierName,
          shippedAt,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order_items: {
            include: {
              products: true,
            },
          },
        },
      });

      // Create status log
      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          fromStatus,
          toStatus: 'shipped',
          changedBy: userId,
          notes: input.notes || `Shipped via ${input.carrierName}. Tracking: ${input.trackingNumber}`,
        },
      });

      return updatedOrder;
    });

    // Send shipping notification email
    try {
      const customerEmail = order.guestEmail || order.users?.email;
      if (customerEmail) {
        console.log(`Sending shipping notification to ${customerEmail} for order ${orderId}`);
        await this.notificationService.sendShippingNotification({
          orderId: order.id,
          customerEmail,
          customerName: order.users?.username,
          totalAmount: Number(order.totalAmount),
          items: order.order_items.map((item) => ({
            productName: item.products.name,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          trackingNumber: input.trackingNumber,
          carrierName: input.carrierName,
          shippedAt,
        });
        console.log(`Successfully sent shipping notification for order ${orderId}`);
      } else {
        console.warn(`No customer email found for order ${orderId} - cannot send shipping notification`);
      }
    } catch (error) {
      console.error(`Failed to send shipping notification for order ${orderId}:`, error);
      // Don't fail the operation if email fails
    }

    return result;
  }

  /**
   * Mark order as delivered
   */
  async markAsDelivered(orderId: string, userId: string, notes?: string) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'delivered') {
      throw new Error('Order is already delivered');
    }

    const fromStatus = order.status;
    const deliveredAt = new Date();

    // Update order and create status log in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          deliveredAt,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order_items: {
            include: {
              products: true,
            },
          },
        },
      });

      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          fromStatus,
          toStatus: 'delivered',
          changedBy: userId,
          notes: notes || 'Order delivered',
        },
      });

      return updatedOrder;
    });

    // Send delivery notification email
    try {
      const customerEmail = order.guestEmail || order.users?.email;
      if (customerEmail) {
        console.log(`Sending delivery notification to ${customerEmail} for order ${orderId}`);
        await this.notificationService.sendDeliveryNotification(orderId, customerEmail);
        console.log(`Successfully sent delivery notification for order ${orderId}`);
      } else {
        console.warn(`No customer email found for order ${orderId} - cannot send delivery notification`);
      }
    } catch (error) {
      console.error(`Failed to send delivery notification for order ${orderId}:`, error);
    }

    return result;
  }

  /**
   * Get order status logs
   */
  async getOrderStatusLogs(orderId: string) {
    const logs = await prisma.order_status_logs.findMany({
      where: { orderId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(dateFrom?: string, dateTo?: string) {
    const where: Prisma.ordersWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [
      totalOrders,
      totalRevenue,
      statusCounts,
      averageOrderValue,
    ] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.orders.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.orders.aggregate({
        where,
        _avg: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageOrderValue: averageOrderValue._avg.totalAmount || 0,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get recent customers
   */
  async getRecentCustomers(limit: number = 10) {
    const customers = await prisma.users.findMany({
      where: {
        orders: {
          some: {},
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return customers;
  }

  /**
   * Export orders to CSV format
   */
  async exportOrdersToCSV(filters: OrderFilters): Promise<string> {
    const {
      status,
      search,
      dateFrom,
      dateTo,
    } = filters;

    // Build where clause (no pagination for export)
    const where: Prisma.ordersWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { users: { email: { contains: search, mode: 'insensitive' } } },
        { users: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch all matching orders
    const orders = await prisma.orders.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        order_items: {
          include: {
            products: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Build CSV headers
    const headers = [
      'Order ID',
      'Order Date',
      'Customer Email',
      'Customer Name',
      'Status',
      'Items Count',
      'Product Names',
      'Subtotal',
      'Shipping Cost',
      'Tax',
      'Total Amount',
      'Payment Status',
      'Shipping Name',
      'Shipping Address',
      'Shipping City',
      'Shipping State',
      'Shipping ZIP',
      'Shipping Country',
      'Tracking Number',
      'Carrier',
      'Notes',
    ];

    // Build CSV rows
    const rows = orders.map((order: any) => {
      const productNames = order.order_items
        .map((item: any) => `${item.products.name} (x${item.quantity})`)
        .join('; ');

      return [
        order.id,
        order.createdAt.toISOString(),
        order.users?.email || order.guestEmail || 'Guest',
        order.users?.username || 'Guest',
        order.status,
        order.order_items.length.toString(),
        `"${productNames}"`,
        '', // subtotal - not a direct field
        order.shippingCost?.toString() || '0',
        order.taxAmount?.toString() || '0',
        order.totalAmount.toString(),
        order.stripePaymentStatus || 'pending',
        '', // fullName - not available
        '', // address - not available
        '', // city - not available
        '', // state - not available
        '', // postalCode - not available
        '', // country - not available
        order.trackingNumber || '',
        order.carrierName || '',
        `"${order.customerNotes || ''}"`,
      ];
    });

    // Combine headers and rows
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, userId: string, reason?: string, refundAmount?: number) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate order can be cancelled
    if (order.status === 'cancelled' || order.status === 'refunded') {
      throw new Error(`Order is already ${order.status}`);
    }

    if (order.status === 'delivered') {
      throw new Error('Cannot cancel delivered orders. Please process a refund instead.');
    }

    // Process refund if payment was made and refund amount specified
    let refundProcessed = false;
    if (order.stripePaymentId && refundAmount && refundAmount > 0) {
      try {
        await this.paymentService.createRefund(
          orderId,
          refundAmount,
          'requested_by_customer',
          userId,
          reason || 'Order cancelled'
        );
        refundProcessed = true;
      } catch (error) {
        console.error('Failed to process refund during cancellation:', error);
        // Continue with cancellation even if refund fails
      }
    }

    // Update order status in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          order_items: {
            include: {
              products: true,
            },
          },
        },
      });

      // Create status log
      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          fromStatus: order.status,
          toStatus: 'cancelled',
          changedBy: userId,
          notes: reason || (refundProcessed ? `Cancelled with refund of $${refundAmount}` : 'Order cancelled'),
          createdAt: new Date(),
        },
      });

      return updatedOrder;
    });

    // Send cancellation notification
    if (order.users?.email) {
      try {
        // TODO: Add sendOrderCancelled method to OrderNotificationService
        // await this.notificationService.sendOrderCancelled(order.users.email, {
        //   orderId: order.id,
        //   refundAmount: refundProcessed ? refundAmount : undefined,
        // });
        console.log('Order cancellation notification would be sent here');
      } catch (error) {
        console.error('Failed to send cancellation notification:', error);
      }
    }

    return result;
  }
}
