'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderApi, type Order } from '@/lib/order-api';
import BottomNavigation from '@/components/BottomNavigation';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login?redirect=/orders/' + orderId);
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await orderApi.getOrder(orderId, accessToken);
        setOrder(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, accessToken, router]);

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

  const calculateSubtotal = (order: Order) => {
    return Number(order.totalAmount) - 
           (Number(order.shippingCost || 0)) - 
           (Number(order.taxAmount || 0)) + 
           (Number(order.discountAmount || 0));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
        <div className="flex justify-center items-center py-20">
          <div className="text-purple-900 text-lg">Loading order...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The order you requested could not be found.'}</p>
            <button
              onClick={() => router.push('/orders')}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              View Order History
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Order Confirmation</h1>
          <p className="text-sm text-gray-600 mt-1">Order #{order.id}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <h2 className="text-xl font-bold text-green-900 mb-1">
                Order Placed Successfully!
              </h2>
              <p className="text-green-800">
                Thank you for your order. We'll send you an email confirmation shortly.
              </p>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Order Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Order placed: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🧪
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{item.product.name}</h4>
                  {item.product.category && (
                    <p className="text-sm text-purple-600">{item.product.category}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold">
                ${calculateSubtotal(order).toFixed(2)}
              </span>
            </div>
            {order.shippingCost && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-semibold">${Number(order.shippingCost).toFixed(2)}</span>
              </div>
            )}
            {order.taxAmount && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">${Number(order.taxAmount).toFixed(2)}</span>
              </div>
            )}
            {order.discountAmount && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                <span className="font-semibold">-${Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-purple-600">${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Notes */}
        {order.customerNotes && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Order Notes</h3>
            <p className="text-gray-600">{order.customerNotes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-full font-semibold transition-colors"
          >
            View Order History
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="flex-1 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 py-3 rounded-full font-semibold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
