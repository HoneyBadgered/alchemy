'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuthStore } from '@/store/authStore';
import { orderApi, type ShippingAddress } from '@/lib/order-api';
import { paymentApi } from '@/lib/payment-api';
import BottomNavigation from '@/components/BottomNavigation';
import StripePayment from '@/components/StripePayment';

type CheckoutStep = 'shipping' | 'payment' | 'processing' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, subtotal, isLoading: cartLoading, clearCart, sessionId } = useCart();
  const { isAuthenticated, accessToken, hasHydrated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentConfigured, setPaymentConfigured] = useState<boolean | null>(null);
  const [saveInfo, setSaveInfo] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [orderSummary, setOrderSummary] = useState<{
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    total: number;
  } | null>(null);

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

  // Check if payment processing is configured when the page loads
  useEffect(() => {
    const checkPaymentConfig = async () => {
      try {
        const config = await paymentApi.getConfig();
        setPaymentConfigured(config.configured);
      } catch (err) {
        console.error('Failed to check payment configuration:', err);
        setPaymentConfigured(false);
      }
    };
    checkPaymentConfig();
  }, []);

  // Wait for auth state to be hydrated before rendering
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 flex justify-center items-center">
        <div className="text-purple-900 text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect if cart is empty (but not when processing payment or showing success - cart is cleared after successful payment)
  if (!cartLoading && itemCount === 0 && currentStep !== 'processing' && currentStep !== 'success') {
    router.push('/cart');
    return null;
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // For guest checkout, require email
      if (!isAuthenticated && !guestEmail) {
        throw new Error('Email is required for guest checkout');
      }

      // Check if payment processing is available
      // If paymentConfigured is null (still loading), re-check the config
      let isConfigured = paymentConfigured;
      if (isConfigured === null) {
        const config = await paymentApi.getConfig();
        isConfigured = config.configured;
        setPaymentConfigured(isConfigured);
      }
      
      if (!isConfigured) {
        throw new Error('Payment processing is not configured. Please contact the store administrator.');
      }

      // Step 1: Create the order
      const order = await orderApi.placeOrder(
        {
          shippingAddress: shippingInfo,
          customerNotes: customerNotes || undefined,
          guestEmail: !isAuthenticated ? guestEmail : undefined,
        },
        accessToken || undefined,
        !isAuthenticated ? sessionId : undefined
      );

      setOrderId(order.id);

      // Step 2: Create payment intent
      const paymentIntent = await paymentApi.createPaymentIntent(
        { orderId: order.id },
        accessToken || undefined,
        !isAuthenticated ? sessionId : undefined
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
    // Save order summary FIRST before changing any state
    if (cart?.cart?.cart_items && cart.cart.cart_items.length > 0) {
      setOrderSummary({
        items: cart.cart.cart_items.map(item => ({
          name: item.products.name,
          quantity: item.quantity,
          price: Number(item.products.price),
        })),
        subtotal: subtotal,
        total: subtotal, // You can add shipping/tax here if available
      });
    }
    
    setCurrentStep('processing');
    
    // Clear the cart
    await clearCart();
    
    // Show success step with order details
    setCurrentStep('success');
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
    const baseValid = (
      shippingInfo.firstName &&
      shippingInfo.lastName &&
      shippingInfo.addressLine1 &&
      shippingInfo.city &&
      shippingInfo.state &&
      shippingInfo.zipCode &&
      shippingInfo.country &&
      shippingInfo.phone
    );
    
    // For guest checkout, also require email
    if (!isAuthenticated) {
      return baseValid && guestEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
    }
    
    return baseValid;
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
        {/* Warning banner when payment is not configured */}
        {paymentConfigured === false && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Payment Processing Unavailable
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Online payment processing is not currently available. This may be because the payment system has not been configured.
                    Please contact the store administrator or try again later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {/* Guest Checkout - Email & Account Options */}
                  {!isAuthenticated && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
                              ? 'border-red-300 focus:ring-red-600'
                              : 'border-gray-300 focus:ring-purple-600'
                          }`}
                        />
                        {guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && (
                          <p className="text-xs text-red-600 mt-1">
                            Please enter a valid email address
                          </p>
                        )}
                        {(!guestEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Order confirmation and updates will be sent here
                          </p>
                        )}
                      </div>

                      {/* Create Account Option for Guests */}
                      <label className="flex items-start cursor-pointer mb-4 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          <span className="font-semibold">Create an account</span> to save your information and easily track this order
                        </span>
                      </label>

                      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span>Already have an account? </span>
                        <Link
                          href="/login?redirect=/checkout"
                          className="text-purple-600 font-semibold hover:text-purple-700"
                        >
                          Sign in
                        </Link>
                        <span> for faster checkout</span>
                      </div>
                    </div>
                  )}

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
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        placeholder="(555) 555-5555"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For delivery updates and order notifications
                      </p>
                    </div>
                    </div>
                  </div>

                  {/* Authenticated User - Save Information Option */}
                  {isAuthenticated && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                      <label className="flex items-start cursor-pointer p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={saveInfo}
                          onChange={(e) => setSaveInfo(e.target.checked)}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          <span className="font-semibold">Save this address</span> to my account for future orders
                        </span>
                      </label>
                    </div>
                  )}

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
                    disabled={!isFormValid() || isSubmitting || paymentConfigured === false}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
                  >
                    {isSubmitting ? 'Creating Order...' : paymentConfigured === false ? 'Payment Unavailable' : 'Continue to Payment'}
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

              {/* Success State */}
              {currentStep === 'success' && (
                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
                    <p className="text-gray-600 mb-2">
                      Thank you for your purchase!
                    </p>
                    {orderId && (
                      <p className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-3 py-1 rounded">
                        Order ID: {orderId.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                    {guestEmail && (
                      <p className="text-gray-600 mt-4">
                        A confirmation email has been sent to <strong>{guestEmail}</strong>
                      </p>
                    )}
                  </div>

                  {/* Order Summary */}
                  {orderSummary && (
                    <div className="border-t border-gray-200 pt-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                      <div className="space-y-3 mb-4">
                        {orderSummary.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-purple-600">${orderSummary.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Information */}
                  {shippingInfo.firstName && (
                    <div className="border-t border-gray-200 pt-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                      <div className="text-gray-600">
                        <p className="font-medium">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                        <p>{shippingInfo.addressLine1}</p>
                        {shippingInfo.addressLine2 && <p>{shippingInfo.addressLine2}</p>}
                        <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                        <p>{shippingInfo.country}</p>
                        {shippingInfo.phone && <p className="mt-2">Phone: {shippingInfo.phone}</p>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => router.push('/products')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                      Continue Shopping
                    </button>
                    {isAuthenticated && orderId && (
                      <button
                        onClick={() => router.push(`/orders/${orderId}`)}
                        className="bg-white hover:bg-gray-50 text-purple-600 border border-purple-600 px-6 py-3 rounded-full font-semibold transition-colors"
                      >
                        View Order Details
                      </button>
                    )}
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
                  {cart.cart.cart_items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">
                          {item.products.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × ${Number(item.products.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        ${(Number(item.products.price) * item.quantity).toFixed(2)}
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
