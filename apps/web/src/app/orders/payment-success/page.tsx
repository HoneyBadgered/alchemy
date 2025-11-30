'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { paymentApi } from '@/lib/payment-api';
import BottomNavigation from '@/components/BottomNavigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const paymentIntent = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      if (!paymentIntent) {
        setStatus('error');
        setErrorMessage('Payment information not found. Please contact support.');
        return;
      }

      // Check if Stripe redirect was not successful
      if (redirectStatus && redirectStatus !== 'succeeded') {
        setStatus('error');
        setErrorMessage(`Payment ${redirectStatus}. Please try again or contact support.`);
        return;
      }

      try {
        // Get the order details from the payment intent
        const result = await paymentApi.getOrderByPaymentIntent(paymentIntent);

        // Clear the cart
        await clearCart();

        // Redirect to the order confirmation page
        setStatus('success');
        router.push(`/orders/${result.orderId}`);
      } catch (error) {
        console.error('Error processing payment success:', error);
        setStatus('error');
        setErrorMessage((error as Error).message || 'Failed to retrieve order details. Please check your order history.');
      }
    };

    handlePaymentSuccess();
  }, [searchParams, clearCart, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Payment Status</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {status === 'processing' && (
          <div className="bg-white rounded-xl shadow-md p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
              <p className="text-gray-600">Please wait while we confirm your payment</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-xl shadow-md p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">Redirecting to your order...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/orders')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                View Order History
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
