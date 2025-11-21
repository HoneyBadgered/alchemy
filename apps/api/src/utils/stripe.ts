/**
 * Stripe Configuration
 * Initializes and exports the Stripe client
 */

import Stripe from 'stripe';
import { config } from './config';

if (!config.stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-11-20.acacia', // Use the latest API version
  typescript: true,
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
