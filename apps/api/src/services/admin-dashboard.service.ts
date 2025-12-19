/**
 * Admin Dashboard Analytics Service
 */

import { prisma } from '../utils/prisma';

export class AdminDashboardService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's stats
    const [
      todayRevenue,
      todayOrderCount,
      lowStockProducts,
      topProducts,
      recentOrders,
      totalCustomers,
      totalProducts,
      totalOrders,
    ] = await Promise.all([
      // Today's revenue
      prisma.orders.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['processing', 'shipped', 'completed'],
          },
        },
        _sum: { totalAmount: true },
      }),

      // Today's order count
      prisma.orders.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Low stock products (stock <= 10)
      prisma.products.findMany({
        where: {
          stock: { lte: 10 },
          isActive: true,
        },
        orderBy: { stock: 'asc' },
        take: 10,
      }),

      // Top selling products (last 30 days)
      this.getTopSellingProducts(30, 5),

      // Recent orders
      prisma.orders.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          guestEmail: true,
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
      }),

      // Total customers
      prisma.users.count(),

      // Total products
      prisma.products.count(),

      // Total orders
      prisma.orders.count(),
    ]);

    // Recent customers with their order history
    const recentCustomers = await prisma.users.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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
      },
    });

    return {
      todayStats: {
        revenue: todayRevenue._sum.totalAmount || 0,
        orderCount: todayOrderCount,
      },
      overallStats: {
        totalCustomers,
        totalProducts,
        totalOrders,
      },
      lowStockProducts,
      topProducts,
      recentOrders,
      recentCustomers,
    };
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(days: number = 30, limit: number = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orderItems = await prisma.order_items.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = orderItems.map((item) => item.productId);
    const products = await prisma.products.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    // Combine the data
    const topProducts = orderItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product,
        totalSold: item._sum.quantity || 0,
        orderCount: item._count._all,
      };
    });

    return topProducts;
  }

  /**
   * Get revenue over time
   */
  async getRevenueOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.orders.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          in: ['processing', 'shipped', 'completed'],
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date
    const revenueByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(order.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format
    const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return revenueData.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus() {
    const statusCounts = await prisma.orders.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));
  }

  /**
   * Get customer growth over time
   */
  async getCustomerGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.users.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date
    const usersByDate = users.reduce((acc, user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format with cumulative count
    const growthData = Object.entries(usersByDate).map(([date, count]) => ({
      date,
      newCustomers: count,
    }));

    return growthData.sort((a, b) => a.date.localeCompare(b.date));
  }
}
