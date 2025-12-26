'use client';

import { useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface PaymentFormProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, orderId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred');
        onError(error.message || 'Payment failed');
      } else {
        // Payment confirmed, trigger sync to update order status from Stripe
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/sync/${orderId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (syncError) {
          console.error('Failed to sync payment status:', syncError);
          // Don't fail the payment flow if sync fails
        }
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-full font-semibold transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe
      </p>
    </form>
  );
}

interface StripePaymentProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePayment({
  clientSecret,
  orderId,
  onSuccess,
  onError,
}: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          Payment system is not configured. Please contact support.
        </p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#9333ea', // purple-600
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        clientSecret={clientSecret}
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
