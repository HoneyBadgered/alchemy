'use client';

/**
 * Admin Orders Management Page
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  guestEmail?: string | null;
  trackingNumber?: string | null;
  carrierName?: string | null;
  shippedAt?: string | null;
  user: {
    username: string;
    email: string;
  } | null;
  order_items: Array<{
    products: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface ShippingFormData {
  trackingNumber: string;
  carrierName: string;
  notes?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [shippingForm, setShippingForm] = useState<ShippingFormData>({
    trackingNumber: '',
    carrierName: 'USPS',
    notes: '',
  });
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState<'duplicate' | 'fraudulent' | 'requested_by_customer'>('requested_by_customer');
  const [refundNotes, setRefundNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRefundAmount, setCancelRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { accessToken, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && accessToken) {
      fetchOrders();
    }
  }, [filterStatus, searchQuery, dateFrom, dateTo, accessToken, hasHydrated]);

  const fetchOrders = async () => {
    try {
      const url = new URL('http://localhost:3000/admin/orders');
      if (filterStatus) {
        url.searchParams.append('status', filterStatus);
      }
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }
      if (dateFrom) {
        url.searchParams.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        url.searchParams.append('dateTo', dateTo);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!selectedOrder || !shippingForm.trackingNumber || !shippingForm.carrierName) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/admin/orders/${selectedOrder.id}/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingForm),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as shipped');
      }

      // Close modal and refresh orders
      setShowShippingModal(false);
      setSelectedOrder(null);
      setShippingForm({
        trackingNumber: '',
        carrierName: 'USPS',
        notes: '',
      });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to mark as shipped:', err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openShippingModal = (order: Order) => {
    setSelectedOrder(order);
    setShowShippingModal(true);
    setShippingForm({
      trackingNumber: '',
      carrierName: 'USPS',
      notes: '',
    });
  };

  const handleExportCSV = async () => {
    if (!accessToken) return;

    setExporting(true);
    try {
      const url = new URL('http://localhost:3000/admin/orders/export');
      if (filterStatus) {
        url.searchParams.append('status', filterStatus);
      }
      if (dateFrom) {
        url.searchParams.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        url.searchParams.append('dateTo', dateTo);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/admin/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason,
          refundAmount: cancelRefundAmount ? parseFloat(cancelRefundAmount) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel order');
      }

      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
      setCancelRefundAmount('');
      await fetchOrders();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!selectedOrder || !refundAmount) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/admin/orders/${selectedOrder.id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason,
          notes: refundNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to process refund');
      }

      setShowRefundModal(false);
      setSelectedOrder(null);
      setRefundAmount('');
      setRefundReason('requested_by_customer');
      setRefundNotes('');
      await fetchOrders();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage customer orders</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📊 {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Process Refund</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order #{selectedOrder.id} - Total: ${Number(selectedOrder.totalAmount).toFixed(2)}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedOrder.totalAmount)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ${Number(selectedOrder.totalAmount).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select reason...</option>
                  <option value="requested_by_customer">Requested by Customer</option>
                  <option value="duplicate">Duplicate Payment</option>
                  <option value="fraudulent">Fraudulent Transaction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Additional details about this refund..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedOrder(null);
                  setRefundAmount('');
                  setRefundReason('');
                  setRefundNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRefundOrder}
                disabled={submitting || !refundAmount || !refundReason || parseFloat(refundAmount) <= 0}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order #{selectedOrder.id} - Total: ${Number(selectedOrder.totalAmount).toFixed(2)}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This will cancel the order. You can optionally process a refund at the same time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Explain why this order is being cancelled..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Number(selectedOrder.totalAmount)}
                  value={cancelRefundAmount}
                  onChange={(e) => setCancelRefundAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Leave empty to cancel without refund"
                />
                {cancelRefundAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Will refund ${parseFloat(cancelRefundAmount).toFixed(2)} to customer
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                  setCancelReason('');
                  setCancelRefundAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={submitting || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order ID, email, username..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.username || order.guestEmail || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email || order.guestEmail || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border-0 ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        {order.status !== 'shipped' && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                          <button
                            onClick={() => openShippingModal(order)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                          >
                            📦 Ship
                          </button>
                        )}
                        {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setRefundAmount(Number(order.totalAmount).toString());
                              setShowRefundModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                          >
                            💰 Refund
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'refunded' && order.status !== 'delivered' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setCancelRefundAmount(Number(order.totalAmount).toString());
                              setShowCancelModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.carrierName}: {order.trackingNumber}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Modal */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mark Order as Shipped
              </h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono text-sm font-semibold">{selectedOrder.id}</p>
                <p className="text-sm text-gray-600 mt-2">Customer</p>
                <p className="text-sm font-medium">{selectedOrder.user?.email || selectedOrder.guestEmail}</p>
                <p className="text-sm text-gray-600 mt-2">Total</p>
                <p className="text-sm font-semibold">${Number(selectedOrder.totalAmount).toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier *
                  </label>
                  <select
                    id="carrier"
                    value={shippingForm.carrierName}
                    onChange={(e) => setShippingForm({ ...shippingForm, carrierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number *
                  </label>
                  <input
                    id="tracking"
                    type="text"
                    value={shippingForm.trackingNumber}
                    onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={shippingForm.notes}
                    onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Add any shipping notes..."
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowShippingModal(false);
                    setSelectedOrder(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsShipped}
                  disabled={submitting || !shippingForm.trackingNumber || !shippingForm.carrierName}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Shipping...' : 'Mark as Shipped'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
