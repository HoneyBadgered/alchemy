# Stripe Payment Integration

This document describes the Stripe payment integration implemented in The Alchemy Table platform.

## Overview

The application uses [Stripe](https://stripe.com) for secure payment processing. The integration implements:

- **Stripe Elements** for secure card collection (no card data touches our servers)
- **Payment Intents API** for handling the payment lifecycle
- **Webhooks** for reliable payment confirmation and order updates
- **Error handling** for various payment scenarios (failures, network issues, etc.)

## Architecture

### Backend (API)

**Payment Service** (`apps/api/src/services/payment.service.ts`)
- Creates Stripe PaymentIntents for orders
- Retrieves payment status
- Handles webhook events from Stripe
- Updates order status based on payment outcomes

**Payment Routes** (`apps/api/src/routes/payment.routes.ts`)
- `POST /payments/create-intent` - Creates a PaymentIntent for an order
- `GET /payments/status/:orderId` - Gets current payment status
- `POST /payments/webhook` - Receives Stripe webhook events

**Database Schema**
- `orders.stripePaymentId` - Stripe PaymentIntent ID
- `orders.stripePaymentStatus` - Current Stripe payment status
- `orders.stripeClientSecret` - Client secret for frontend
- `stripe_webhook_events` - Idempotent webhook event tracking

### Frontend (Web)

**Payment Components** (`apps/web/src/components/StripePayment.tsx`)
- Wraps Stripe Elements for secure card input
- Handles payment confirmation
- Provides loading states and error feedback

**Checkout Flow** (`apps/web/src/app/checkout/page.tsx`)
1. User enters shipping information
2. Order is created with status "pending"
3. PaymentIntent is created via API
4. User enters payment details via Stripe Elements
5. Payment is confirmed client-side
6. Webhook updates order status to "paid"

## Setup

### 1. Get Stripe API Keys

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Secret Key (starts with `sk_test_...`)
   - Publishable Key (starts with `pk_test_...`)

### 2. Configure Backend

Add to `apps/api/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get this after setting up webhooks (step 3)
```

### 3. Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
5. Copy the webhook signing secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Configure Frontend

Add to `apps/web/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Payment Flow

### Successful Payment

1. User completes checkout form
2. Order created with status `pending`
3. PaymentIntent created, order status → `payment_processing`
4. User confirms payment via Stripe Elements
5. Webhook received: `payment_intent.succeeded`
6. Order status updated to `paid`
7. User redirected to order confirmation

### Failed Payment

1. Steps 1-4 same as successful payment
2. Payment fails (card declined, insufficient funds, etc.)
3. Error displayed to user
4. User can retry with different payment method
5. Webhook received: `payment_intent.payment_failed`
6. Order status updated to `payment_failed`

### Edge Cases Handled

- **Duplicate webhooks**: Events stored with unique `eventId` for idempotency
- **Payment already completed**: Prevents creating duplicate PaymentIntents
- **Network errors**: Frontend retry logic and timeout handling
- **Webhook failures**: Events marked as failed with error messages
- **Stale payment status**: Status checked from Stripe on each request

## Testing

### Backend Tests

Run payment service tests:

```bash
npm run test --workspace=@alchemy/api
```

Tests cover:
- Creating payment intents
- Handling existing payment intents
- Payment status retrieval
- Webhook event processing
- Error scenarios (order not found, already paid, etc.)

### Testing Payments

Stripe provides [test card numbers](https://stripe.com/docs/testing):

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`
- **Insufficient funds**: `4000 0000 0000 9995`

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks Locally

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Security Considerations

### Payment Data Security

- **PCI compliance**: Card data never touches our servers (handled by Stripe Elements)
- **HTTPS required**: All payment operations require secure connections
- **Client secrets**: Scoped to specific payment, expire after confirmation
- **Webhook verification**: All webhooks verified with signature before processing

### Best Practices

1. **Never log sensitive data**: Card numbers, CVCs, full PANs
2. **Use environment variables**: Never commit API keys to version control
3. **Test mode by default**: Use test keys during development
4. **Monitor webhooks**: Check Stripe Dashboard for failed webhooks
5. **Idempotent handling**: All webhook handlers are idempotent

## Order Status Flow

```
pending → payment_processing → paid → processing → shipped → completed
              ↓
         payment_failed
```

## API Reference

### Create Payment Intent

**POST** `/payments/create-intent`

Request:
```json
{
  "orderId": "order_123"
}
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

### Get Payment Status

**GET** `/payments/status/:orderId`

Response:
```json
{
  "status": "succeeded",
  "orderId": "order_123",
  "orderStatus": "paid",
  "paymentIntentId": "pi_xxx"
}
```

### Webhook Endpoint

**POST** `/payments/webhook`

Headers:
- `stripe-signature`: Webhook signature for verification

Processes events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`

## Troubleshooting

### Webhook not received

1. Check webhook endpoint is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check Stripe Dashboard > Webhooks for failed attempts
4. Use Stripe CLI to test locally

### Payment not confirming

1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
3. Check network tab for API request failures
4. Ensure payment method is valid (use test cards)

### Order status not updating

1. Check backend logs for webhook processing errors
2. Verify webhook signature verification
3. Check `stripe_webhook_events` table for error messages
4. Ensure database transaction succeeds

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Elements Guide](https://stripe.com/docs/payments/elements)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Guide](https://stripe.com/docs/testing)

## Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://stripe.com/community)

For integration issues:
- Check application logs
- Review test suite results
- Consult this documentation
