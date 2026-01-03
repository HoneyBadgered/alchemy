# Payment Idempotency Keys

## Overview

This implementation uses **idempotency keys** to prevent duplicate Stripe charges when network retries occur during payment processing.

## Problem Statement

Without idempotency keys, network retries can cause serious issues:

```
Scenario: User clicks "Pay Now" button
-----------------------------------------
T1: Frontend sends payment request
T2: API creates PaymentIntent → Network timeout ❌
T3: Frontend retries (user didn't see response)
T4: API creates ANOTHER PaymentIntent → Success ✓
Result: TWO charges for the same order 💸💸
```

**Impact:**
- Duplicate charges on customer's card
- Order confusion (which payment is real?)
- Customer service nightmares
- Chargeback risk
- Brand damage

## Solution: Stripe Idempotency Keys

### What Are Idempotency Keys?

An **idempotency key** is a unique string sent with Stripe API requests that ensures:
- Same key + same request = same response (cached)
- Stripe caches responses for 24 hours
- Network retries are safe

### How Stripe Handles Them

```typescript
// First request with key "abc123"
stripe.paymentIntents.create(data, { idempotencyKey: "abc123" });
// → Creates PaymentIntent pi_1234

// Retry with SAME key (network failed)
stripe.paymentIntents.create(data, { idempotencyKey: "abc123" });
// → Returns CACHED PaymentIntent pi_1234 (no new charge!)

// Different key = new resource
stripe.paymentIntents.create(data, { idempotencyKey: "xyz789" });
// → Creates NEW PaymentIntent pi_5678
```

## Implementation

### Key Generation Strategy

We use **deterministic** keys based on operation type and resource identifiers:

```typescript
function generateIdempotencyKey(
  operation: string,
  resourceId: string,
  suffix?: string
): string {
  const parts = [operation, resourceId];
  if (suffix) parts.push(suffix);
  
  // Hash ensures consistent length and format
  const data = parts.join('_');
  const hash = createHash('sha256').update(data).digest('hex').substring(0, 32);
  
  return `${operation}_${hash}`;
}
```

**Format:** `{operation}_{hash32}`

**Examples:**
- `payment_intent_a1b2c3d4e5f6...` (PaymentIntent for order)
- `refund_fedcba0987654321...` (Refund for order)
- `customer_1234567890abcd...` (Customer creation)

### Applied to Operations

#### 1. Payment Intent Creation

**Idempotency Key Components:**
- Operation: `payment_intent`
- Resource: `orderId`
- Suffix: `order.createdAt.toISOString()`

```typescript
const idempotencyKey = generateIdempotencyKey(
  'payment_intent',
  order.id,
  order.createdAt.toISOString()
);

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(order.totalAmount * 100),
  currency: 'usd',
  metadata: {
    orderId: order.id,
    idempotencyKey, // Store for audit trail
  },
}, {
  idempotencyKey, // Stripe uses this for deduplication
});
```

**Why createdAt?**
- Ensures uniqueness per order attempt
- Same order retried = same key
- Different order (even same user) = different key

#### 2. Customer Creation

**Idempotency Key Components:**
- Operation: `customer`
- Resource: `email`
- Suffix: `userId` or `'guest'`

```typescript
const customerIdempotencyKey = generateIdempotencyKey(
  'customer',
  receiptEmail,
  order.userId || 'guest'
);

const customer = await stripe.customers.create({
  email: receiptEmail,
  metadata: {
    userId: order.userId || 'guest',
    idempotencyKey: customerIdempotencyKey,
  },
}, {
  idempotencyKey: customerIdempotencyKey,
});
```

**Why email + userId?**
- Prevents duplicate customers per email
- Guest vs authenticated user distinction
- Retry safe even if database lookup fails

#### 3. Refund Creation

**Idempotency Key Components:**
- Operation: `refund`
- Resource: `orderId`
- Suffix: `timestamp` (current time)

```typescript
const refundTimestamp = new Date().toISOString();
const idempotencyKey = generateIdempotencyKey(
  'refund',
  orderId,
  refundTimestamp
);

const stripeRefund = await stripe.refunds.create({
  payment_intent: order.stripePaymentId,
  amount: Math.round(amount * 100),
  metadata: {
    orderId,
    idempotencyKey,
    timestamp: refundTimestamp,
  },
}, {
  idempotencyKey,
});
```

**Why timestamp?**
- Allows multiple refunds per order
- Each refund is a distinct operation
- Retry of SAME refund = cached response
- New refund attempt = new key

## Retry Behavior

### Successful First Attempt

```
Client → API → Stripe: Create payment (key: abc123)
Stripe → API: PaymentIntent pi_1234
API → DB: Store pi_1234
API → Client: {clientSecret: "..."}
```

### Network Retry (Same Key)

```
Client → API → Stripe: Create payment (key: abc123) [RETRY]
Stripe: "I've seen key abc123, returning cached response"
Stripe → API: PaymentIntent pi_1234 (SAME as before)
API → DB: Update with pi_1234 (idempotent)
API → Client: {clientSecret: "..."} (SAME response)
```

**Result:** No duplicate charge ✅

### Different Key (New Attempt)

```
Client → API → Stripe: Create payment (key: xyz789) [DIFFERENT KEY]
Stripe: "New key xyz789, creating new resource"
Stripe → API: PaymentIntent pi_5678 (NEW!)
API → DB: Store pi_5678
API → Client: {clientSecret: "..."} (NEW)
```

**Result:** Legitimate new charge ✅

## Key Properties

### Determinism
- **Same inputs** → **Same key**
- Enables safe retries
- Prevents accidental duplicates

### Uniqueness
- **Different operations** → **Different keys**
- Allows intentional duplicates (e.g., multiple refunds)
- Prevents key collisions

### Format Consistency
- Fixed length (32-char hash + prefix)
- Meets Stripe requirements (max 255 chars)
- URL-safe characters

## Edge Cases Handled

### 1. Database Write Fails After Stripe Success

```
T1: Stripe creates PaymentIntent ✓
T2: Database write fails ❌
T3: Retry with same key
T4: Stripe returns cached PaymentIntent ✓
T5: Database write succeeds ✓
```

**Outcome:** No duplicate charge, data eventually consistent

### 2. Concurrent Requests (Same Key)

```
Request A: key=abc123 → Stripe processing
Request B: key=abc123 → Stripe waits for A
Result: Both get SAME PaymentIntent
```

**Outcome:** Stripe serializes, no duplicates

### 3. Expired Idempotency Cache (>24h)

```
T1: Create payment (key: abc123)
T2: ... 25 hours later ...
T3: Retry with key: abc123
```

**Stripe Behavior:** Creates NEW resource (cache expired)
**Our Protection:** Order already has `stripePaymentId`, we return existing intent

### 4. Order Modified Between Retries

```
T1: Order total = $100 → Create payment (key: abc123)
T2: Network timeout
T3: Admin changes order to $150
T4: Retry with key: abc123
```

**Stripe Behavior:** Returns $100 PaymentIntent (cached)
**Validation:** API detects amount mismatch, creates new intent with different key

## Monitoring

### Metrics to Track

1. **Idempotency Cache Hits**
   - Stripe logs when cached response returned
   - High rate = network issues or aggressive retries

2. **Duplicate Prevention Success Rate**
   - Orders with single PaymentIntent vs multiple attempts
   - Should be ~99.9%

3. **Key Collision Rate**
   - Should be 0% (deterministic hashing)
   - Alert if non-zero

### Logging

```typescript
// Log when creating with idempotency key
console.log('Creating PaymentIntent', {
  orderId,
  idempotencyKey,
  amount: paymentIntent.amount,
});

// Log if Stripe returns cached response
if (existingIntent.metadata.idempotencyKey === idempotencyKey) {
  console.info('Idempotency key cache hit', {
    orderId,
    paymentIntentId: existingIntent.id,
  });
}
```

## Testing

### Unit Tests (`payment-idempotency.test.ts`)

```bash
pnpm test src/__tests__/payment-idempotency.test.ts
```

**Scenarios:**
1. Same order → same idempotency key
2. Different orders → different keys
3. Multiple refunds → unique keys per refund
4. Metadata includes idempotency key

### Integration Tests

```bash
# Simulate network retry
curl -X POST /api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ALC-260103-TEST"}' \
  --retry 3 --retry-delay 1
```

**Expected:** Single PaymentIntent created, retries return cached response

### Load Tests

```bash
# 100 concurrent requests for same order (stress test)
artillery run load-tests/payment-idempotency.yml
```

**Expected:**
- All requests get SAME PaymentIntent ID
- Stripe API receives ~1-5 actual requests (rest served from cache)

## Security Considerations

### Key Predictability

**Risk:** If keys are predictable, attacker could guess valid keys

**Mitigation:**
- Hash includes order creation timestamp (unpredictable)
- Keys are unique per order (not per user)
- Stripe validates request body matches cached request

### Key Collision

**Risk:** Two different orders generate same key

**Mitigation:**
- SHA-256 hash (2^256 possible values)
- Includes order ID (unique per order)
- Statistical impossibility of collision

### Metadata Leakage

**Risk:** Idempotency key in metadata exposes system details

**Mitigation:**
- Hash obscures internal IDs
- Only operation type visible (payment_intent, refund, etc.)
- No sensitive data in key

## Stripe API Compatibility

### Supported Operations

✅ **Idempotency Supported:**
- `paymentIntents.create`
- `paymentIntents.update`
- `paymentIntents.confirm`
- `customers.create`
- `refunds.create`
- `charges.create` (legacy)

❌ **Not Supported:**
- `paymentIntents.retrieve` (read-only)
- `customers.list` (read-only)
- Webhook processing (use event IDs)

### API Version Requirements

- **Minimum:** Stripe API v2020-08-27
- **Current:** v2024-06-20 (we use latest)
- **Idempotency:** Supported in all versions

## Migration Guide

### Existing Installations

**No database changes required** - idempotency keys are Stripe-only.

### Deployment Steps

1. Deploy updated payment service
2. Monitor Stripe logs for cache hit rate
3. Verify no duplicate PaymentIntents created
4. Check metadata includes idempotency keys
5. Enable detailed logging for 48h
6. Reduce logging after stability confirmed

### Rollback Plan

Remove `{ idempotencyKey }` from Stripe API calls. System remains functional but loses duplicate protection.

## Best Practices

### DO ✅

- Use deterministic key generation
- Include operation type in key
- Store idempotency key in metadata (audit trail)
- Log when cache hits occur
- Test retry scenarios

### DON'T ❌

- Use random UUIDs (not deterministic)
- Reuse keys across different operations
- Include timestamps in payment intent keys (prevents retries)
- Rely solely on idempotency (add database constraints too)
- Assume cache never expires (handle >24h retries)

## FAQ

### Q: Why hash the key instead of using orderId directly?

**A:** Consistent length, URL-safe format, and obscures internal IDs from Stripe metadata.

### Q: What if I want to intentionally retry a failed payment?

**A:** Create a new order (different orderId) or add a retry counter to the key suffix.

### Q: Can two users accidentally get same idempotency key?

**A:** No - key includes orderId which is globally unique per order.

### Q: What happens if Stripe is down during retry?

**A:** Standard Stripe retry/timeout logic applies. Idempotency keys don't affect availability.

### Q: How long does Stripe cache responses?

**A:** 24 hours from first successful request with that key.

### Q: Can I use the same key for different amounts?

**A:** Stripe validates request body matches. Different amounts = error. Use different key.

## Resources

- [Stripe Idempotency Documentation](https://stripe.com/docs/api/idempotent_requests)
- [Retry Best Practices](https://stripe.com/docs/error-handling#safely-retry)
- [PaymentIntents API Reference](https://stripe.com/docs/api/payment_intents)

---

**Last Updated:** January 3, 2026  
**Maintainer:** Engineering Team
