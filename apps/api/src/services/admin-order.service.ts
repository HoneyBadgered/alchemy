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
            profile: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        statusLogs: {
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
          orderId,
          fromStatus,
          toStatus,
          changedBy: userId,
          notes: input.notes,
        },
      });

      return updatedOrder;
    });

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
      }
    } catch (error) {
      console.error('Failed to send shipping notification:', error);
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
        await this.notificationService.sendDeliveryNotification(orderId, customerEmail);
      }
    } catch (error) {
      console.error('Failed to send delivery notification:', error);
    }

    return result;
  }

  /**
   * Get order status logs
   */
  async getOrderStatusLogs(orderId: string) {
    const logs = await prisma.orders.tatusLog.findMany({
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
        shipping_addresses: true,
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
    const rows = orders.map((order) => {
      const shippingAddr = order.shipping_addresses;
      const productNames = order.order_items
        .map((item) => `${item.products.name} (x${item.quantity})`)
        .join('; ');

      return [
        order.id,
        order.createdAt.toISOString(),
        order.users?.email || 'Guest',
        order.users?.username || order.customerName || 'Guest',
        order.status,
        order.order_items.length.toString(),
        `"${productNames}"`,
        order.subtotal?.toString() || '0',
        order.shippingCost?.toString() || '0',
        order.tax?.toString() || '0',
        order.totalAmount.toString(),
        order.paymentStatus || 'pending',
        shippingAddr?.fullName || '',
        `"${shippingAddr?.addressLine1 || ''} ${shippingAddr?.addressLine2 || ''}"`.trim(),
        shippingAddr?.city || '',
        shippingAddr?.state || '',
        shippingAddr?.postalCode || '',
        shippingAddr?.country || '',
        order.trackingNumber || '',
        order.carrierName || '',
        `"${order.notes || ''}"`,
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
        await this.notificationService.sendOrderCancelled(order.users.email, {
          orderId: order.id,
          refundAmount: refundProcessed ? refundAmount : undefined,
        });
      } catch (error) {
        console.error('Failed to send cancellation notification:', error);
      }
    }

    return result;
  }
}
