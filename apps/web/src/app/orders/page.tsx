'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderApi, type Order } from '@/lib/order-api';
import BottomNavigation from '@/components/BottomNavigation';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await orderApi.getOrders(accessToken);
        setOrders(data.orders);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, accessToken, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Order History</h1>
          <p className="text-sm text-gray-600 mt-1">View your past orders</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-900 text-lg">Loading orders...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your order history here!
            </p>
            <button
              onClick={() => router.push('/shop')}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Browse Products
            </button>
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-3 mb-4 overflow-x-auto">
                    {order.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden"
                      >
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🧪
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          +{order.items.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      ${Number(order.totalAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
