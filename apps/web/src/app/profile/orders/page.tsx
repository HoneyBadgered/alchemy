'use client';

/**
 * Profile Order History Page
 * 
 * Enhanced order history with reorder functionality, download receipts,
 * and dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/store/authStore';
import { orderApi, type Order } from '@/lib/order-api';
import { useCart } from '@/contexts/CartContext';
import BottomNavigation from '@/components/BottomNavigation';

function OrderHistoryContent() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const { accessToken } = useAuthStore();
  const { addToCart } = useCart();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [reordering, setReordering] = useState<string | null>(null);
  const [reorderModalOrder, setReorderModalOrder] = useState<Order | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: async () => {
      try {
        return await orderApi.getOrders(accessToken!, { page, perPage: 10, status: statusFilter });
      } catch (err) {
        // If we get a 401, try refreshing the token
        if (err instanceof Error && err.message.includes('401')) {
          await refreshAuth();
          // Refetch will happen automatically due to query invalidation
          throw err;
        }
        throw err;
      }
    },
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      // Retry once for 401 errors (after token refresh)
      if (error instanceof Error && error.message.includes('401')) {
        return failureCount < 1;
      }
      return false;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/50 text-green-300 border-green-600/50';
      case 'pending':
        return 'bg-amber-900/50 text-amber-300 border-amber-600/50';
      case 'processing':
        return 'bg-blue-900/50 text-blue-300 border-blue-600/50';
      case 'shipped':
        return 'bg-purple-900/50 text-purple-300 border-purple-600/50';
      case 'cancelled':
        return 'bg-red-900/50 text-red-300 border-red-600/50';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚗️';
      case 'shipped':
        return '📦';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const handleReorder = async (order: Order) => {
    setReorderModalOrder(order);
  };

  const confirmReorder = async () => {
    if (!reorderModalOrder) return;

    setReordering(reorderModalOrder.id);
    setReorderModalOrder(null);
    
    try {
      // Add all items from the order to cart
      for (const item of reorderModalOrder.order_items) {
        await addToCart(item.productId, item.quantity);
      }
      router.push('/cart');
    } catch {
      alert('Failed to add items to cart. Some items may no longer be available.');
    } finally {
      setReordering(null);
    }
  };

  const handleDownloadReceipt = async (orderId: string) => {
    if (!accessToken) return;
    
    try {
      // Fetch the receipt HTML with authentication
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      // If 401, try refreshing token and retry once
      if (response.status === 401) {
        console.log('Receipt fetch unauthorized, refreshing token...');
        const refreshed = await refreshAuth();
        if (refreshed) {
          const newToken = useAuthStore.getState().accessToken;
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/receipt`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          });
        }
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch receipt';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.error('Receipt error response:', errorText);
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const html = await response.text();
      
      // Open receipt in new window
      const receiptWindow = window.open('', '_blank');
      if (receiptWindow) {
        receiptWindow.document.write(html);
        receiptWindow.document.close();
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const statusOptions = [
    { value: undefined, label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📦</span>
            Order History
          </h1>
          <p className="text-purple-200/70 mt-1">Chronicles of your alchemical acquisitions</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusOptions.map((option) => (
              <button
                key={option.value || 'all'}
                onClick={() => {
                  setStatusFilter(option.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  statusFilter === option.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-300 text-lg">Summoning your order history...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-6 text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <p className="text-red-300">Failed to load orders. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {data && data.orders.length === 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-6xl mb-4 block">📦</span>
            <h2 className="text-2xl font-bold text-white mb-2">No Orders Yet</h2>
            <p className="text-purple-300/70 mb-6">
              Your chronicle of acquisitions is empty. Begin your alchemical journey!
            </p>
            <Link
              href="/shop"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse the Apothecary
            </Link>
          </div>
        )}

        {/* Orders List */}
        {data && data.orders.length > 0 && (
          <div className="space-y-4">
            {data.orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300"
              >
                {/* Order Header */}
                <div className="p-5 border-b border-purple-500/20">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{getStatusIcon(order.status)}</span>
                        <h3 className="text-white font-semibold">Order #{order.id}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-purple-300/60 text-sm">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-purple-300/60 text-sm">
                        {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-5 bg-slate-900/30">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {order.order_items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-16 h-16 bg-slate-700/50 rounded-lg overflow-hidden border border-purple-500/20"
                        title={item.products.name}
                      >
                        {item.products.imageUrl ? (
                          <img
                            src={item.products.imageUrl}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🧪
                          </div>
                        )}
                      </div>
                    ))}
                    {order.order_items.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center border border-purple-500/20">
                        <span className="text-purple-300 text-sm font-medium">
                          +{order.order_items.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="p-5 flex flex-wrap gap-3 border-t border-purple-500/10">
                  <button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleReorder(order)}
                    disabled={reordering === order.id}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {reordering === order.id ? 'Adding to Cart...' : '🔄 Reorder'}
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(order.id)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                  >
                    📄 Download Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800/60 text-purple-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/60 border border-purple-500/20 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-purple-300 font-medium">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="px-4 py-2 bg-slate-800/60 text-purple-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/60 border border-purple-500/20 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Reorder Confirmation Modal */}
      {reorderModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 border border-purple-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔄</div>
              <h2 className="text-2xl font-bold text-purple-200 mb-2">
                Reorder Items?
              </h2>
              <p className="text-purple-300/80">
                Add {reorderModalOrder.order_items.length} {reorderModalOrder.order_items.length === 1 ? 'item' : 'items'} from this order to your cart?
              </p>
            </div>

            {/* Order Items Preview */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              {reorderModalOrder.order_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-purple-500/20 last:border-0">
                  <div className="flex-1">
                    <span className="text-purple-200 text-sm block">{item.products?.name || 'Unknown Product'}</span>
                    <span className="text-purple-400/60 text-xs">${Number(item.price).toFixed(2)} each</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-300 text-sm font-semibold block">×{item.quantity}</span>
                    <span className="text-purple-200 text-xs">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-purple-500/30">
                <span className="text-purple-200 font-semibold">Total</span>
                <span className="text-purple-200 font-bold text-lg">
                  ${reorderModalOrder.order_items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setReorderModalOrder(null)}
                className="flex-1 px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 text-purple-300 rounded-lg font-semibold transition-colors border border-purple-500/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmReorder}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/30"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}

export default function ProfileOrdersPage() {
  return (
    <ProtectedRoute>
      <OrderHistoryContent />
    </ProtectedRoute>
  );
}
