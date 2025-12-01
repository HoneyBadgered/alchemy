'use client';

/**
 * Admin Dashboard Overview
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
  todayStats: {
    revenue: number;
    orderCount: number;
  };
  overallStats: {
    totalCustomers: number;
    totalProducts: number;
    totalOrders: number;
  };
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      price: number;
    };
    totalSold: number;
  }>;
  recentOrders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    guestEmail?: string | null;
    user: {
      username: string;
    } | null;
  }>;
  recentCustomers: Array<{
    id: string;
    username: string;
    email: string;
    createdAt: string;
    _count: {
      orders: number;
    };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && accessToken) {
      fetchDashboardData();
    }
  }, [accessToken, hasHydrated]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        <p className="font-semibold">Error loading dashboard</p>
        <p className="text-sm">{error || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome to the admin dashboard</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Today's Revenue</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            ${stats.todayStats.revenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Today's Orders</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {stats.todayStats.orderCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Customers</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">
            {stats.overallStats.totalCustomers}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {stats.overallStats.totalOrders}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">⚠️ Low Stock Alerts</h2>
          </div>
          <div className="p-6">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">All products are well stocked</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    <span className="text-sm font-bold text-red-600">{product.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🏆 Top Selling Products</h2>
          </div>
          <div className="p-6">
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data available</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-600">${Number(item.product.price).toFixed(2)}</div>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{item.totalSold} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📋 Recent Orders</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {order.user?.username || order.guestEmail || 'Guest'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">👥 Recent Customers</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.recentCustomers.slice(0, 5).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{customer.username}</div>
                    <div className="text-xs text-gray-600">{customer.email}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {customer._count.orders} {customer._count.orders === 1 ? 'order' : 'orders'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
