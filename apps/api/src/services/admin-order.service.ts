/**
 * Admin Order Management Service
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';

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

export class AdminOrderService {
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
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
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
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          statusLogs: {
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
        user: {
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
            user: {
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
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Create status log
      await tx.orderStatusLog.create({
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
   * Get order status logs
   */
  async getOrderStatusLogs(orderId: string) {
    const logs = await prisma.orders.tatusLog.findMany({
      where: { orderId },
      include: {
        user: {
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
    const where: Prisma.OrderWhereInput = {};

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
}
