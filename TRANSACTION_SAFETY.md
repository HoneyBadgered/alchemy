# Transaction Safety & Error Handling

## Overview
Comprehensive transaction safety and error handling has been implemented across all payment and order operations to prevent data inconsistency, inventory errors, and failed payments.

## Completed Improvements

### 1. Standardized Error Handling System ✅

#### Files Created:
- `apps/api/src/utils/errors.ts` - Error class hierarchy
- `apps/api/src/plugins/error-handler.ts` - Centralized error handler plugin

#### Error Classes:
**HTTP Errors:**
- `BadRequestError` (400) - Invalid client data
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource already exists
- `ValidationError` (422) - Validation failures
- `RateLimitError` (429) - Rate limit exceeded
- `InternalServerError` (500) - Server errors
- `ServiceUnavailableError` (503) - Service outage

**Domain-Specific Errors:**
- `OrderValidationError` - Order validation failures
- `InsufficientStockError` - Stock availability issues
- `PaymentError` - Payment processing failures
- `CartError` - Shopping cart issues

#### Benefits:
- Consistent error response format across all endpoints
- Automatic Zod validation error handling
- Request context logging for debugging
- Removes try-catch boilerplate from routes

### 2. Order Service Transaction Safety ✅

**File:** `apps/api/src/services/order.service.ts`

#### Improvements:

**placeOrder Method:**
- ✅ Inventory validation before transaction starts
- ✅ Transaction configuration:
  - `maxWait: 5000ms` - Maximum wait for lock acquisition
  - `timeout: 10000ms` - Transaction timeout
  - `isolationLevel: ReadCommitted` - Prevents dirty reads
- ✅ Comprehensive error categorization:
  - Insufficient stock → InsufficientStockError
  - Invalid order → OrderValidationError
  - Database timeouts → InternalServerError
- ✅ Cart preservation on failure (no data loss)
- ✅ Detailed error logging with context

**getOrder Method:**
- ✅ Uses NotFoundError instead of generic Error
- ✅ Proper error messages

**Error Handling Strategy:**
```typescript
try {
  // Validate inventory before transaction
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new OrderValidationError(`Product ${item.product.name} unavailable`);
    }
    if (item.product.stock < item.quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for ${item.product.name}`,
        { available: item.product.stock, requested: item.quantity }
      );
    }
  }
  
  // Execute transaction with timeout and proper isolation
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    // Decrement inventory
    // Apply discount
    // Log status
    // Clear cart
  }, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
  
  return order;
} catch (error) {
  // Categorize and log errors
  // Cart is preserved for user to retry
}
```

### 3. Payment Service Transaction Safety ✅

**File:** `apps/api/src/services/payment.service.ts`

#### Improvements:

**createPaymentIntent Method:**
- ✅ Comprehensive Stripe error handling:
  - `StripeCardError` → Card declined
  - `StripeInvalidRequestError` → Invalid payment data
  - `StripeAPIError` → Stripe service issues
  - `StripeConnectionError` → Network problems
  - `StripeAuthenticationError` → API key issues
- ✅ User-friendly error messages
- ✅ Error logging with context
- ✅ Graceful degradation (returns last known status if Stripe API fails)

**getOrderByPaymentIntent Method:**
- ✅ Uses NotFoundError and BadRequestError
- ✅ Wraps Stripe API calls in try-catch
- ✅ Validates client secret for security

**getPaymentStatus Method:**
- ✅ Graceful handling of Stripe API failures
- ✅ Returns last known status if unable to reach Stripe
- ✅ Includes error information in response

**updateOrderPaymentStatus Method:**
- ✅ Transaction wraps order update + status log
- ✅ Atomic updates (no partial writes)
- ✅ Proper error handling with PaymentError

**Webhook Handling:**
- ✅ Idempotency (prevents duplicate processing)
- ✅ Comprehensive error logging
- ✅ Failed webhooks marked for retry
- ✅ Graceful handling of missing metadata
- ✅ All handler methods wrapped in try-catch

**Error Handling Example:**
```typescript
try {
  if (order.stripePaymentId) {
    paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);
  } else {
    paymentIntent = await stripe.paymentIntents.create({...});
  }
} catch (error: any) {
  // Handle specific Stripe error types
  if (error.type === 'StripeCardError') {
    throw new PaymentError(`Card declined: ${error.message}`);
  } else if (error.type === 'StripeAPIError') {
    throw new PaymentError('Payment service temporarily unavailable');
  }
  // ... other error types
}
```

### 4. Cart Service Transaction Safety ✅

**File:** `apps/api/src/services/cart.service.ts`

#### Improvements:

**addToCart Method:**
- ✅ Quantity validation (must be ≥ 1)
- ✅ Product existence and active status checks
- ✅ Stock validation with detailed error messages
- ✅ Try-catch around database operations
- ✅ Specific error types (NotFoundError, CartError, InsufficientStockError)

**updateCartItem Method:**
- ✅ Validates product still active
- ✅ Stock validation before update
- ✅ NotFoundError for missing items
- ✅ Error handling for database operations

**mergeGuestCart Method:**
- ✅ Atomic transaction for cart merge:
  - Updates all cart items
  - Deletes guest cart
  - All or nothing (prevents orphaned data)
- ✅ Error handling with CartError
- ✅ Rollback on failure

**Error Handling Strategy:**
```typescript
// Stock validation with detailed info
if (product.stock < quantity) {
  throw new InsufficientStockError(
    `Insufficient stock for ${product.name}`,
    { available: product.stock, requested: quantity }
  );
}

// Atomic cart merge
await prisma.$transaction(async (tx) => {
  for (const guestItem of guestCart.items) {
    // Merge or move items
  }
  await tx.cart.delete({ where: { id: guestCart.id } });
});
```

### 5. Rate Limiting ✅

**File:** `apps/api/src/routes/reviews.routes.ts`

- ✅ POST reviews: 5 per hour per IP
- ✅ PATCH reviews: 10 per hour per IP
- ✅ DELETE reviews: 10 per hour per IP
- ✅ Prevents review spam and abuse

### 6. Health Check Endpoints ✅

**File:** `apps/api/src/main.ts`

- ✅ `/health` - Comprehensive health check:
  - Database connectivity test
  - Stripe API configuration check
  - Uptime reporting
  - API version
- ✅ `/ready` - Kubernetes readiness probe
- ✅ `/live` - Kubernetes liveness probe

## Testing Recommendations

### Unit Tests
1. **Order Service:**
   - Insufficient stock scenario
   - Transaction timeout handling
   - Concurrent order race conditions
   - Invalid discount code
   - Cart clearing failures

2. **Payment Service:**
   - Card declined scenarios
   - Stripe API timeouts
   - Invalid payment intent retrieval
   - Webhook idempotency
   - Missing order metadata

3. **Cart Service:**
   - Stock validation edge cases
   - Concurrent cart updates
   - Guest cart merge failures
   - Product deactivation while in cart

### Integration Tests
1. **End-to-End Order Flow:**
   - Place order → Payment → Fulfillment
   - Order failure → Cart preservation
   - Payment timeout → Order rollback

2. **Webhook Processing:**
   - Successful payment webhook
   - Failed payment webhook
   - Duplicate webhook handling
   - Webhook retry after failure

3. **Error Scenarios:**
   - Database connection loss during transaction
   - Stripe API unavailability
   - Concurrent inventory updates
   - Race conditions in cart operations

## Monitoring & Alerting

### Key Metrics to Track
1. **Order Failures:**
   - Insufficient stock errors
   - Transaction timeouts
   - Payment failures

2. **Payment Issues:**
   - Stripe API errors by type
   - Failed webhook processing
   - Payment timeout rates

3. **Cart Operations:**
   - Failed cart merges
   - Stock validation failures
   - Cart operation latency

### Recommended Tools
- **Sentry** - Error tracking and aggregation
- **DataDog/New Relic** - Performance monitoring
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization

## Production Checklist

### Before Deployment
- [ ] Review all error logs for sensitive data exposure
- [ ] Test transaction timeout scenarios
- [ ] Verify Stripe webhook signature validation
- [ ] Load test concurrent order placement
- [ ] Test inventory race conditions
- [ ] Verify rate limiting configuration
- [ ] Test health check endpoints
- [ ] Document error codes for frontend

### After Deployment
- [ ] Monitor error rates for new error types
- [ ] Track transaction timeout frequency
- [ ] Monitor Stripe API error rates
- [ ] Review webhook processing success rate
- [ ] Check database transaction duration
- [ ] Verify rate limiting effectiveness

## Known Limitations & Future Improvements

### Current Limitations
1. **No Distributed Locking:**
   - Inventory race conditions possible across multiple API instances
   - **Solution:** Implement Redis-based distributed locks

2. **No Webhook Retry Queue:**
   - Failed webhooks rely on Stripe's retry mechanism
   - **Solution:** Implement queue-based retry with exponential backoff

3. **No Circuit Breaker:**
   - Stripe API failures can cascade
   - **Solution:** Implement circuit breaker pattern for external APIs

4. **No Saga Pattern:**
   - Complex multi-service transactions not handled
   - **Solution:** Implement saga orchestration for distributed transactions

### Planned Improvements
1. **Webhook Retry System** (Priority #2)
   - Queue-based processing
   - Exponential backoff
   - Dead letter queue for failed events

2. **Distributed Locking** (Priority #3)
   - Redis-based inventory locks
   - Prevents race conditions at scale

3. **Enhanced Monitoring** (Priority #4)
   - Sentry integration
   - Custom metrics and dashboards
   - Real-time alerting

4. **Database Performance** (Priority #5)
   - Add missing indexes
   - Query optimization
   - Connection pooling tuning

## Error Response Format

All API errors now follow this standardized format:

```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock for Green Tea",
  "statusCode": 400,
  "details": {
    "available": 5,
    "requested": 10
  }
}
```

### Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid client data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 422 | Validation failure |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |
| `ORDER_VALIDATION_ERROR` | 400 | Order validation failed |
| `INSUFFICIENT_STOCK` | 400 | Not enough inventory |
| `PAYMENT_ERROR` | 400 | Payment processing failed |
| `CART_ERROR` | 400 | Cart operation failed |

## Summary

All critical payment and order operations now have:
- ✅ Proper transaction boundaries
- ✅ Timeout configuration
- ✅ Isolation level settings
- ✅ Comprehensive error handling
- ✅ Specific error types
- ✅ Rollback strategies
- ✅ Detailed error logging
- ✅ User-friendly error messages
- ✅ Graceful degradation
- ✅ Rate limiting protection

This implementation significantly reduces the risk of:
- Data inconsistency
- Inventory overselling
- Lost payments
- Orphaned records
- Unhandled exceptions
- Poor user experience during errors
