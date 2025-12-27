/**
 * Stripe Configuration
 * Initializes and exports the Stripe client
 */

import Stripe from 'stripe';
import { config } from '../config';

let _stripe: Stripe | null = null;

/**
 * Get the Stripe client instance
 * Lazy initialization - only creates the client when needed
 * @throws Error if STRIPE_SECRET_KEY is not configured
 */
function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    const errorMessage = config.isDevelopment
      ? 'STRIPE_SECRET_KEY is not configured. Payment processing is disabled in development mode. Configure STRIPE_SECRET_KEY to enable payments.'
      : 'STRIPE_SECRET_KEY is not configured';
    throw new Error(errorMessage);
  }

  if (!_stripe) {
    _stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-12-15.clover', // Use the latest API version
      typescript: true,
    });
  }

  return _stripe;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!config.stripeSecretKey;
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const stripeInstance = getStripe();
    const value = stripeInstance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripeInstance) : value;
  },
});

// Stripe webhook signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const STRIPE_PAYMENT_SUCCESS_STATUSES: Stripe.PaymentIntent.Status[] = [
  'succeeded',
];

export const STRIPE_PAYMENT_PENDING_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
];

export const STRIPE_PAYMENT_FAILED_STATUSES: Stripe.PaymentIntent.Status[] = [
  'canceled',
];
