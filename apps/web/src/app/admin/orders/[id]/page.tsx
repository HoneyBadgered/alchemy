'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface CustomBlend {
  id: string;
  name: string | null;
  baseTeaId: string;
  size: number;
  addIns: Array<{
    ingredientId: string;
    quantity: number;
  }>;
  baseTea?: {
    id: string;
    name: string;
    description: string | null;
  };
  baseTeaQuantity?: number;
  enrichedAddIns?: Array<{
    ingredientId: string;
    quantity: number;
    ingredient: {
      id: string;
      name: string;
      category: string;
    } | null;
  }>;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: string;
  products: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    blends: CustomBlend[];
  };
  product_variants: {
    id: string;
    name: string;
    size: number | null;
    price: string;
  } | null;
}

interface StatusLog {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  notes: string | null;
  createdAt: string;
  users: {
    id: string;
    username: string | null;
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  sessionId: string | null;
  guestEmail: string | null;
  status: string;
  totalAmount: string;
  shippingAddress: any;
  trackingNumber: string | null;
  carrierName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  stripePaymentId: string | null;
  stripePaymentStatus: string | null;
  customerNotes: string | null;
  createdAt: string;
  users: {
    id: string;
    email: string;
    username: string | null;
  } | null;
  order_items: OrderItem[];
  order_status_logs: StatusLog[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }

    fetchOrderDetails();
  }, [params.id, accessToken]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportOrderDetails = () => {
    if (!order) return;

    const exportData = {
      orderNumber: order.orderNumber,
      customer: order.users?.email || order.guestEmail,
      status: order.status,
      totalAmount: `$${Number(order.totalAmount).toFixed(2)}`,
      createdAt: new Date(order.createdAt).toLocaleString(),
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      carrierName: order.carrierName,
      items: order.order_items.map((item) => {
        const baseItem = {
          product: item.products.name,
          quantity: item.quantity,
          price: `$${Number(item.price).toFixed(2)}`,
        };

        if (item.products.blends && item.products.blends.length > 0) {
          const blend = item.products.blends[0];
          return {
            ...baseItem,
            customBlend: {
              name: blend.name || 'Custom Blend',
              baseTea: blend.baseTea?.name || blend.baseTeaId,
              ingredients: (blend.enrichedAddIns || blend.addIns).map((ing: any) => ({
                ingredient: ing.ingredient?.name || `Ingredient ${ing.ingredientId}`,
                quantity: `${ing.quantity}g`,
                category: ing.ingredient?.category,
              })),
            },
          };
        }

        return baseItem;
      }),
      customerNotes: order.customerNotes,
      statusHistory: order.order_status_logs.map((log) => ({
        from: log.fromStatus,
        to: log.toStatus,
        changedBy: log.users?.username || 'System',
        date: new Date(log.createdAt).toLocaleString(),
        notes: log.notes,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.orderNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Order not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Orders
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Order {order.orderNumber}
            </h1>
          </div>
          <button
            onClick={exportOrderDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Details
          </button>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Email:</span>{' '}
                {order.users?.email || order.guestEmail}
              </p>
              {order.users?.username && (
                <p>
                  <span className="font-medium">Username:</span> {order.users.username}
                </p>
              )}
              <p>
                <span className="font-medium">Customer Type:</span>{' '}
                {order.userId ? 'Registered' : 'Guest'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Status</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded ${
                    order.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'delivered'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </p>
              <p>
                <span className="font-medium">Total:</span> $
                {Number(order.totalAmount).toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Ordered:</span>{' '}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              {order.stripePaymentStatus && (
                <p>
                  <span className="font-medium">Payment Status:</span>{' '}
                  {order.stripePaymentStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {(order.shippingAddress || order.trackingNumber) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            {order.shippingAddress && (
              <div className="mb-4">
                <p className="font-medium mb-2">Address:</p>
                <p>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
              </div>
            )}
            {order.trackingNumber && (
              <div>
                <p>
                  <span className="font-medium">Carrier:</span> {order.carrierName}
                </p>
                <p>
                  <span className="font-medium">Tracking:</span> {order.trackingNumber}
                </p>
                {order.shippedAt && (
                  <p>
                    <span className="font-medium">Shipped:</span>{' '}
                    {new Date(order.shippedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">
                      {item.products.name}
                      {item.product_variants && (
                        <span className="ml-2 text-sm text-purple-600 font-semibold">
                          ({item.product_variants.name})
                        </span>
                      )}
                    </h3>
                    {item.products.description && (
                      <p className="text-sm text-gray-600">{item.products.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${Number(item.price).toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      = ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Custom Blend Recipe */}
                {item.products.blends && item.products.blends.length > 0 && (
                  <div className="mt-3 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      🧪 Custom Blend Recipe: {item.products.blends[0].name || 'Unnamed Blend'}
                    </h4>
                    <p className="text-sm text-purple-800 mb-3">
                      <span className="font-medium">Total Size:</span> {item.products.blends[0].size || 2}oz ({(item.products.blends[0].size || 2) * 28}g)
                    </p>
                    <div className="bg-white rounded p-3 mb-2">
                      <p className="text-sm font-medium text-purple-900 mb-2">Recipe:</p>
                      <div className="space-y-1">
                        {/* Base Tea */}
                        <div className="text-sm text-purple-800 ml-2">
                          <span className="font-medium">
                            {item.products.blends[0].baseTea?.name || item.products.blends[0].baseTeaId}
                          </span>
                          {item.products.blends[0].baseTeaQuantity !== undefined && (
                            <span className="text-purple-600 ml-2">
                              - {Math.round(item.products.blends[0].baseTeaQuantity)}g (base tea)
                            </span>
                          )}
                        </div>
                        {/* Add-ins */}
                        {(item.products.blends[0].enrichedAddIns || item.products.blends[0].addIns).map((ing: any, idx: number) => (
                          <div key={idx} className="text-sm text-purple-800 ml-2">
                            <span className="font-medium">
                              {ing.ingredient?.name || `Ingredient ${ing.ingredientId}`}
                            </span>
                            <span className="text-purple-600 ml-2">
                              - {ing.quantity}g
                              {ing.ingredient?.category && (
                                <span className="text-purple-500 ml-1">
                                  ({ing.ingredient.category})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Customer Notes */}
        {order.customerNotes && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Customer Notes</h2>
            <p className="text-gray-700">{order.customerNotes}</p>
          </div>
        )}

        {/* Status History */}
        {order.order_status_logs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Status History</h2>
            <div className="space-y-3">
              {order.order_status_logs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {log.fromStatus} → {log.toStatus}
                      </p>
                      {log.notes && <p className="text-sm text-gray-600">{log.notes}</p>}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                      <p>by {log.users?.username || 'System'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
