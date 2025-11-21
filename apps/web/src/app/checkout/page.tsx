'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuthStore } from '@/store/authStore';
import { orderApi, type ShippingAddress } from '@/lib/order-api';
import { paymentApi } from '@/lib/payment-api';
import BottomNavigation from '@/components/BottomNavigation';
import StripePayment from '@/components/StripePayment';

type CheckoutStep = 'shipping' | 'payment' | 'processing';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, subtotal, isLoading: cartLoading, clearCart } = useCart();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  const [customerNotes, setCustomerNotes] = useState('');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login?redirect=/checkout');
    return null;
  }

  // Redirect if cart is empty
  if (!cartLoading && itemCount === 0) {
    router.push('/cart');
    return null;
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Step 1: Create the order
      const order = await orderApi.placeOrder(
        {
          shippingAddress: shippingInfo,
          customerNotes: customerNotes || undefined,
        },
        accessToken
      );

      setOrderId(order.id);

      // Step 2: Create payment intent
      const paymentIntent = await paymentApi.createPaymentIntent(
        { orderId: order.id },
        accessToken
      );

      setPaymentClientSecret(paymentIntent.clientSecret);
      setCurrentStep('payment');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setCurrentStep('processing');
    
    // Clear the cart
    await clearCart();
    
    // Redirect to order confirmation
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      shippingInfo.firstName &&
      shippingInfo.lastName &&
      shippingInfo.addressLine1 &&
      shippingInfo.city &&
      shippingInfo.state &&
      shippingInfo.zipCode &&
      shippingInfo.country
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Checkout</h1>
          <p className="text-sm text-gray-600 mt-1">Complete your order</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {cartLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-900 text-lg">Loading...</div>
          </div>
        )}

        {!cartLoading && cart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step Indicator */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className={`flex items-center ${currentStep === 'shipping' ? 'text-purple-600' : currentStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'shipping' ? 'bg-purple-600 text-white' : currentStep === 'payment' || currentStep === 'processing' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      1
                    </div>
                    <span className="ml-2 font-semibold">Shipping</span>
                  </div>
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                  <div className={`flex items-center ${currentStep === 'payment' ? 'text-purple-600' : currentStep === 'processing' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-purple-600 text-white' : currentStep === 'processing' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      2
                    </div>
                    <span className="ml-2 font-semibold">Payment</span>
                  </div>
                </div>
              </div>

              {/* Shipping Form */}
              {currentStep === 'shipping' && (
                <form onSubmit={handleShippingSubmit}>
                  {/* Shipping Address */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.addressLine1}
                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.addressLine2}
                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        value={shippingInfo.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Order Notes (Optional)</h2>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any special instructions for your order?"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
                  >
                    {isSubmitting ? 'Creating Order...' : 'Continue to Payment'}
                  </button>
                </form>
              )}

              {/* Payment Form */}
              {currentStep === 'payment' && paymentClientSecret && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Complete your purchase securely with Stripe
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <StripePayment
                    clientSecret={paymentClientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <button
                    type="button"
                    onClick={() => setCurrentStep('shipping')}
                    className="w-full mt-4 text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Back to Shipping
                  </button>
                </div>
              )}

              {/* Processing State */}
              {currentStep === 'processing' && (
                <div className="bg-white rounded-xl shadow-md p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
                    <p className="text-gray-600">Please wait while we confirm your payment</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × ${Number(item.product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold">TBD</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-semibold">TBD</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-purple-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="w-full mt-6 text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
