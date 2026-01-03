# Webhook Retry System

## Overview

The webhook retry system provides automatic, intelligent retry handling for failed Stripe webhook events. This system addresses the critical operational need for visibility and control over webhook processing that isn't available with Stripe's default automatic retry mechanism.

### Problem Statement

Stripe webhooks are essential for processing payment events (payment confirmations, failures, refunds). By default:

- **Stripe controls all retries**: Automatic retries occur approximately every hour for up to 72 hours
- **No visibility**: Cannot see why webhooks failed or how many times they've been retried
- **No intervention**: Cannot manually retry failed webhooks or adjust retry timing
- **Slow recovery**: 1-hour retry intervals delay order processing and customer notifications
- **No prioritization**: Critical payment confirmations treated same as non-critical events

### Solution

Database-backed retry queue with:

- **Fast initial retries**: 1 minute instead of 1 hour for first retry
- **Exponential backoff**: Progressive delays prevent overwhelming systems during outages
- **Dead letter queue**: Permanently failed events isolated for manual investigation
- **Admin management**: API for manual retry, bulk operations, and troubleshooting
- **Priority processing**: Payment confirmations processed before cancellations
- **Multi-instance safe**: Database-level locking prevents duplicate processing

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Stripe Webhook                          │
│                (POST /api/webhooks/stripe)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Payment Service                            │
│  - Verify signature                                         │
│  - Create webhook_event record (status='pending')           │
│  - Set priority, maxRetries based on event type             │
│  - Attempt immediate processing                             │
│  - Update status='processed' on success                     │
│  - Update status='failed' on failure                        │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              stripe_webhook_events Table                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ id, eventId, eventType, payload                       │ │
│  │ status: pending | processing | processed | failed     │ │
│  │         | dead_letter                                 │ │
│  │ retryCount, maxRetries, nextRetryAt                   │ │
│  │ priority, errorHistory, lastAttemptAt                 │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Webhook Retry Worker                          │
│  - Polls every 30 seconds                                   │
│  - SELECT FOR UPDATE SKIP LOCKED (concurrency-safe)         │
│  - Processes up to 10 events per batch                      │
│  - Orders by: priority DESC, nextRetryAt ASC                │
│  - Applies exponential backoff on failure                   │
│  - Moves to DLQ after max retries or permanent errors       │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Admin API                                 │
│  GET    /admin/webhooks/stats                               │
│  GET    /admin/webhooks                                     │
│  GET    /admin/webhooks/:id                                 │
│  POST   /admin/webhooks/:id/retry                           │
│  POST   /admin/webhooks/bulk-retry                          │
│  POST   /admin/webhooks/:id/dead-letter                     │
│  POST   /admin/webhooks/:id/resolve                         │
│  DELETE /admin/webhooks/cleanup                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Happy Path (Successful Processing)

1. **Webhook Received**: Stripe sends webhook to `/api/webhooks/stripe`
2. **Record Created**: PaymentService creates `stripe_webhook_events` record with `status='pending'`
3. **Immediate Processing**: PaymentService attempts to process event
4. **Success**: Update `status='processed'`, `processed=true`, `processedAt=now()`
5. **Order Created**: Payment confirmed, order placed, customer notified

#### Failure Path (Retry Required)

1. **Webhook Received**: Stripe sends webhook
2. **Record Created**: Event stored with `status='pending'`
3. **Processing Fails**: Database timeout, network error, etc.
4. **Failure Recorded**: Update `status='failed'`, store error message
5. **Worker Picks Up**: Retry worker finds event where `status IN ('pending','failed')` AND `nextRetryAt <= now()`
6. **Retry Attempt**: Worker calls PaymentService.handleWebhookEvent()
7. **Success/Failure**:
   - **Success**: Update `status='processed'`
   - **Failure**: Increment `retryCount`, calculate next retry time with exponential backoff
8. **Max Retries**: If `retryCount >= maxRetries`, move to dead letter queue (`status='dead_letter'`)

#### Dead Letter Queue Path

1. **Too Many Retries**: Event failed `maxRetries` times (3-5 depending on type)
2. **Permanent Error**: Signature verification failed, invalid payload
3. **DLQ Update**: Set `status='dead_letter'`, append error to history
4. **Alert Generated**: Monitoring detects DLQ event (requires external monitoring setup)
5. **Manual Investigation**: Admin uses API to inspect event details
6. **Resolution**:
   - **Manual Retry**: `POST /admin/webhooks/:id/retry` with `resetRetryCount=true`
   - **Mark Resolved**: `POST /admin/webhooks/:id/resolve` if already handled externally

## Retry Strategy

### Exponential Backoff Schedule

| Attempt | Delay      | Cumulative Time | Use Case                              |
|---------|------------|-----------------|---------------------------------------|
| 0       | Immediate  | 0s              | First attempt (within webhook route)  |
| 1       | 1 minute   | 1m              | Quick recovery from transient issues  |
| 2       | 5 minutes  | 6m              | Database failover, brief outages      |
| 3       | 15 minutes | 21m             | Service restart, rolling deployments  |
| 4       | 1 hour     | 1h 21m          | Extended maintenance windows          |
| 5       | 6 hours    | 7h 21m          | Major outage recovery                 |

**Implementation:**
```typescript
const BACKOFF_DELAYS = [0, 60, 300, 900, 3600, 21600]; // seconds
const nextRetryDelay = BACKOFF_DELAYS[Math.min(retryCount, BACKOFF_DELAYS.length - 1)];
```

### Max Retries by Event Type

| Event Type                        | Max Retries | Reason                                    |
|-----------------------------------|-------------|-------------------------------------------|
| `payment_intent.succeeded`        | 5           | Critical - affects order confirmation     |
| `payment_intent.payment_failed`   | 3           | Important but less critical               |
| `payment_intent.processing`       | 3           | Informational, lower priority             |
| `payment_intent.canceled`         | 3           | Low priority, user already notified       |
| `charge.*`                        | 3           | Standard webhook processing               |
| Other event types                 | 3           | Default retry count                       |

**Configuration Method:**
```typescript
private getMaxRetriesForEventType(eventType: string): number {
  if (eventType === 'payment_intent.succeeded') return 5;
  if (eventType === 'payment_intent.payment_failed') return 3;
  return 3; // Default
}
```

### Priority System

Events are processed in priority order (highest first):

| Event Type                        | Priority | Reason                                    |
|-----------------------------------|----------|-------------------------------------------|
| `payment_intent.succeeded`        | 10       | Blocks order confirmation                 |
| `payment_intent.processing`       | 5        | Updates order status                      |
| `payment_intent.payment_failed`   | 3        | Important for customer communication      |
| `payment_intent.canceled`         | 1        | Least urgent                              |
| Other event types                 | 5        | Default priority                          |

**Processing Query:**
```sql
SELECT * FROM stripe_webhook_events
WHERE status IN ('pending', 'failed')
  AND nextRetryAt <= NOW()
ORDER BY priority DESC, nextRetryAt ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

## Error Classification

### Permanent Errors (Move to DLQ Immediately)

These errors indicate fundamental problems that cannot be fixed by retrying:

- **Signature Verification Failure**: `"Webhook signature verification failed"`
- **Invalid Payload**: `"Invalid webhook payload"`
- **Malformed JSON**: `"JSON parse error"`
- **Unknown Event Type**: `"Unknown event type"`

**Detection:**
```typescript
private isPermanentError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('signature verification failed') ||
    message.includes('invalid payload') ||
    message.includes('json parse') ||
    message.includes('unknown event type')
  );
}
```

### Transient Errors (Retry with Backoff)

Temporary issues that may resolve on retry:

- **Database Timeouts**: `"Connection timeout"`, `"Transaction timeout"`
- **Network Errors**: `"ECONNREFUSED"`, `"ETIMEDOUT"`
- **Rate Limits**: `"Too many requests"`
- **Service Unavailable**: `"503 Service Unavailable"`
- **Database Deadlocks**: `"Deadlock detected"`

**Handling:**
- Increment `retryCount`
- Calculate next retry time using exponential backoff
- Append error to `errorHistory`
- Update `status='failed'` (worker will retry later)

## Concurrency Control

### Multi-Instance Safety

The system uses PostgreSQL's `FOR UPDATE SKIP LOCKED` to prevent duplicate processing when multiple API instances run the worker:

**Without SKIP LOCKED (Bad):**
```
Instance A: SELECT event_1 FOR UPDATE
Instance B: SELECT event_1 FOR UPDATE  ← BLOCKS waiting for Instance A
Instance A: Process event_1
Instance B: Finally gets lock, processes SAME event again ← DUPLICATE!
```

**With SKIP LOCKED (Good):**
```
Instance A: SELECT event_1 FOR UPDATE SKIP LOCKED
Instance B: SELECT event_2 FOR UPDATE SKIP LOCKED  ← Skips locked event_1
Instance A: Process event_1
Instance B: Process event_2  ← Different event, no duplication
```

**Implementation:**
```typescript
const events = await prisma.$queryRaw<WebhookEvent[]>`
  SELECT * FROM stripe_webhook_events
  WHERE status IN ('pending', 'failed')
    AND "nextRetryAt" <= NOW()
  ORDER BY priority DESC, "nextRetryAt" ASC
  LIMIT ${batchSize}
  FOR UPDATE SKIP LOCKED
`;
```

### Transaction Isolation

Each event is processed in its own transaction:

```typescript
for (const event of events) {
  await prisma.$transaction(
    async (tx) => {
      // Mark as processing
      await tx.stripe_webhook_events.update({
        where: { id: event.id },
        data: { status: 'processing', lastAttemptAt: new Date() },
      });

      // Process the event
      await this.paymentService.handleWebhookEvent(event.payload);

      // Mark as processed
      await tx.stripe_webhook_events.update({
        where: { id: event.id },
        data: { status: 'processed', processed: true, processedAt: new Date() },
      });
    },
    {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}
```

## Admin API

### Authentication

All admin webhook endpoints require admin authentication:

```typescript
import { adminAuthMiddleware } from '../middleware/admin-auth.middleware';

// All routes protected
fastify.addHook('onRequest', adminAuthMiddleware);
```

**Authorization Header:**
```bash
Authorization: Bearer <admin_jwt_token>
```

### Endpoints

#### 1. Get Queue Statistics

**Endpoint:** `GET /admin/webhooks/stats`

**Response:**
```json
{
  "queue": {
    "pending": 5,
    "processing": 2,
    "failed": 3,
    "deadLetter": 1,
    "processed": 1247
  },
  "worker": {
    "isRunning": true,
    "isShuttingDown": false,
    "lastPollTime": "2024-01-03T18:30:45.123Z",
    "totalProcessed": 1250,
    "totalFailed": 12,
    "uptime": 86400
  }
}
```

**Use Cases:**
- Dashboard monitoring
- Queue health checks
- Worker status verification

---

#### 2. List Webhook Events

**Endpoint:** `GET /admin/webhooks`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `failed`, `dead_letter`, `processed`)
- `eventType` (optional): Filter by Stripe event type
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Results per page

**Example Request:**
```bash
GET /admin/webhooks?status=failed&limit=50
```

**Response:**
```json
{
  "events": [
    {
      "id": "webhook_123",
      "eventId": "evt_abc123",
      "eventType": "payment_intent.succeeded",
      "status": "failed",
      "retryCount": 2,
      "maxRetries": 5,
      "nextRetryAt": "2024-01-03T18:35:00.000Z",
      "priority": 10,
      "error": "Database connection timeout",
      "createdAt": "2024-01-03T18:00:00.000Z",
      "updatedAt": "2024-01-03T18:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

---

#### 3. Get Event Details

**Endpoint:** `GET /admin/webhooks/:id`

**Response:**
```json
{
  "id": "webhook_123",
  "eventId": "evt_abc123",
  "eventType": "payment_intent.succeeded",
  "status": "failed",
  "retryCount": 2,
  "maxRetries": 5,
  "nextRetryAt": "2024-01-03T18:35:00.000Z",
  "lastAttemptAt": "2024-01-03T18:30:00.000Z",
  "priority": 10,
  "error": "Database connection timeout",
  "errorHistory": [
    {
      "attempt": 1,
      "error": "Database connection timeout",
      "timestamp": "2024-01-03T18:05:00.000Z"
    },
    {
      "attempt": 2,
      "error": "Transaction rollback due to timeout",
      "timestamp": "2024-01-03T18:30:00.000Z"
    }
  ],
  "payload": {
    "id": "evt_abc123",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_xyz789",
        "amount": 2999,
        "metadata": {
          "orderId": "order_456"
        }
      }
    }
  },
  "createdAt": "2024-01-03T18:00:00.000Z",
  "updatedAt": "2024-01-03T18:30:00.000Z",
  "processed": false,
  "processedAt": null
}
```

---

#### 4. Manual Retry

**Endpoint:** `POST /admin/webhooks/:id/retry`

**Body:**
```json
{
  "resetRetryCount": false
}
```

**Parameters:**
- `resetRetryCount` (boolean, optional): If `true`, resets retry count to 0 (useful after fixing root cause)

**Response:**
```json
{
  "success": true,
  "message": "Webhook event retry initiated",
  "event": {
    "id": "webhook_123",
    "status": "pending",
    "retryCount": 0,
    "nextRetryAt": "2024-01-03T18:45:00.000Z"
  }
}
```

**Use Cases:**
- Retry after fixing database issue
- Force immediate retry for urgent payments
- Reset retry count after infrastructure fix

---

#### 5. Bulk Retry

**Endpoint:** `POST /admin/webhooks/bulk-retry`

**Body:**
```json
{
  "eventIds": ["webhook_123", "webhook_456", "webhook_789"],
  "resetRetryCount": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk retry initiated for 3 events",
  "results": {
    "succeeded": 2,
    "failed": 1,
    "errors": [
      {
        "eventId": "webhook_789",
        "error": "Event already processed"
      }
    ]
  }
}
```

**Use Cases:**
- Retry all failed events after database recovery
- Bulk retry after deployment rollback
- Mass retry after temporary outage

---

#### 6. Move to Dead Letter Queue

**Endpoint:** `POST /admin/webhooks/:id/dead-letter`

**Body:**
```json
{
  "reason": "Event payload contains invalid order ID - cannot process"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook event moved to dead letter queue",
  "event": {
    "id": "webhook_123",
    "status": "dead_letter",
    "error": "Event payload contains invalid order ID - cannot process"
  }
}
```

**Use Cases:**
- Mark unprocessable events to stop retries
- Flag events requiring manual investigation
- Document known issues for later analysis

---

#### 7. Mark Resolved

**Endpoint:** `POST /admin/webhooks/:id/resolve`

**Body:**
```json
{
  "resolution": "Order manually created via admin panel"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook event marked as resolved",
  "event": {
    "id": "webhook_123",
    "status": "processed",
    "processed": true,
    "error": "Manually resolved: Order manually created via admin panel"
  }
}
```

**Use Cases:**
- Mark DLQ events as handled after manual processing
- Document manual intervention for audit trail
- Clear failed events after external resolution

---

#### 8. Cleanup Old Events

**Endpoint:** `DELETE /admin/webhooks/cleanup`

**Query Parameters:**
- `olderThanDays` (required): Delete processed events older than N days

**Example Request:**
```bash
DELETE /admin/webhooks/cleanup?olderThanDays=90
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 1,247 processed webhook events older than 90 days",
  "deletedCount": 1247
}
```

**Use Cases:**
- Regular maintenance to control table size
- Remove old processed events (retain failed/DLQ)
- Database cleanup automation

---

## Deployment

### Migration

Run the schema migration to add retry metadata:

```bash
cd apps/api
npx prisma migrate deploy
```

**Migration creates:**
- `status` column (TEXT) - Event processing state
- `retryCount` column (INTEGER) - Number of retry attempts
- `maxRetries` column (INTEGER) - Maximum allowed retries
- `nextRetryAt` column (TIMESTAMP) - When to retry next
- `lastAttemptAt` column (TIMESTAMP) - Last processing attempt time
- `errorHistory` column (JSONB) - Array of error objects
- `priority` column (INTEGER) - Processing priority
- `updatedAt` column (TIMESTAMP) - Last update time
- Index on `(status, nextRetryAt)` - Worker query optimization
- Index on `createdAt` - Time-based queries
- Index on `retryCount` - Monitoring queries

**Backfill Logic:**
Existing events are migrated:
```sql
UPDATE stripe_webhook_events
SET status = CASE
  WHEN processed = true THEN 'processed'
  WHEN error IS NOT NULL THEN 'failed'
  ELSE 'pending'
END;
```

### Configuration

The worker is configured in `apps/api/src/main.ts`:

```typescript
const webhookRetryWorker = new WebhookRetryWorker({
  pollingInterval: 30000,          // Poll every 30 seconds
  batchSize: 10,                   // Process up to 10 events per batch
  enableConcurrencyLock: true,     // Enable FOR UPDATE SKIP LOCKED
  maxProcessingTime: 60000,        // 60 second timeout per event
});
```

**Environment Variables:**

```bash
# Worker Configuration (optional - defaults shown)
WEBHOOK_RETRY_POLLING_INTERVAL=30000
WEBHOOK_RETRY_BATCH_SIZE=10
WEBHOOK_RETRY_ENABLE_CONCURRENCY=true
WEBHOOK_RETRY_MAX_PROCESSING_TIME=60000
```

### Multi-Instance Deployment

The worker is safe to run on multiple API instances:

**docker-compose.yml:**
```yaml
services:
  api-1:
    build: ./apps/api
    environment:
      - DATABASE_URL=postgresql://...
      - WEBHOOK_RETRY_ENABLE_CONCURRENCY=true
    
  api-2:
    build: ./apps/api
    environment:
      - DATABASE_URL=postgresql://...
      - WEBHOOK_RETRY_ENABLE_CONCURRENCY=true
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alchemy-api
spec:
  replicas: 3  # Three instances
  template:
    spec:
      containers:
      - name: api
        image: alchemy-api:latest
        env:
        - name: WEBHOOK_RETRY_ENABLE_CONCURRENCY
          value: "true"
```

Each instance runs its own worker. Database locking prevents duplicate processing.

### Graceful Shutdown

The worker handles SIGTERM/SIGINT signals:

```typescript
const shutdown = async (signal: string) => {
  console.log(`${signal} signal received, shutting down gracefully`);
  
  // Stop worker (waits for current batch to finish)
  await webhookRetryWorker.stop();
  
  // Close Fastify (waits for active requests)
  await fastify.close();
  
  // Disconnect Prisma
  await prisma.$disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Shutdown Sequence:**
1. Worker stops accepting new batches
2. Current batch finishes processing (up to 60 seconds)
3. Worker marks incomplete events as `status='failed'` (auto-retry later)
4. Fastify stops accepting new requests
5. Active HTTP requests complete
6. Database connections close

## Monitoring

### Metrics to Track

**Queue Health:**
```sql
-- Events stuck in processing (may indicate crashed worker)
SELECT COUNT(*) FROM stripe_webhook_events
WHERE status = 'processing'
  AND "lastAttemptAt" < NOW() - INTERVAL '5 minutes';

-- High retry count events
SELECT eventType, COUNT(*) as count
FROM stripe_webhook_events
WHERE retryCount >= 3
GROUP BY eventType;

-- Dead letter queue size
SELECT COUNT(*) FROM stripe_webhook_events
WHERE status = 'dead_letter';
```

**Worker Performance:**
```sql
-- Average processing time (via errorHistory timestamps)
SELECT AVG(
  EXTRACT(EPOCH FROM ("processedAt" - "createdAt"))
) as avg_processing_seconds
FROM stripe_webhook_events
WHERE processed = true
  AND "processedAt" IS NOT NULL;

-- Events processed in last hour
SELECT COUNT(*) FROM stripe_webhook_events
WHERE "processedAt" >= NOW() - INTERVAL '1 hour';
```

**Error Analysis:**
```sql
-- Most common error patterns
SELECT 
  LEFT(error, 100) as error_prefix,
  COUNT(*) as occurrence_count
FROM stripe_webhook_events
WHERE error IS NOT NULL
GROUP BY error_prefix
ORDER BY occurrence_count DESC
LIMIT 10;
```

### Alerts to Configure

**Critical:**
- Dead letter queue has > 10 events
- Events stuck in `processing` status for > 5 minutes
- Worker hasn't processed events in > 5 minutes

**Warning:**
- Failed event count > 20
- Average retry count > 2
- Processing time > 30 seconds

**Info:**
- Daily processed event count
- Weekly DLQ resolution rate
- Retry success rate

### Dashboard Queries

**Queue Status Overview:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retryCount) as avg_retries,
  MAX(retryCount) as max_retries
FROM stripe_webhook_events
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

**Event Type Performance:**
```sql
SELECT 
  eventType,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'processed') as succeeded,
  COUNT(*) FILTER (WHERE status = 'dead_letter') as dead_letter,
  AVG(retryCount) as avg_retries
FROM stripe_webhook_events
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY eventType
ORDER BY total DESC;
```

## Troubleshooting

### Events Stuck in Processing

**Symptom:** Events have `status='processing'` for > 5 minutes

**Cause:** Worker crashed or forcefully killed during processing

**Fix:**
```sql
-- Reset stuck events back to failed
UPDATE stripe_webhook_events
SET 
  status = 'failed',
  retryCount = retryCount + 1
WHERE status = 'processing'
  AND "lastAttemptAt" < NOW() - INTERVAL '5 minutes';
```

**Prevention:** Ensure graceful shutdown handlers are working

---

### High DLQ Rate

**Symptom:** Many events ending up in dead letter queue

**Investigation:**
```bash
# Get DLQ events
GET /admin/webhooks?status=dead_letter&limit=100

# Check error patterns
SELECT error, COUNT(*) FROM stripe_webhook_events
WHERE status = 'dead_letter'
GROUP BY error
ORDER BY COUNT(*) DESC;
```

**Common Causes:**
- Invalid payload structure (Stripe API version mismatch)
- Missing metadata (orderId not in payment_intent.metadata)
- Database schema changes (column removed/renamed)

**Fix:**
- Update webhook handler to match new Stripe API version
- Add validation for required metadata fields
- Use admin API to manually resolve DLQ events after fix

---

### Worker Not Processing Events

**Symptom:** Events accumulate with `status='pending'` or `status='failed'`

**Check Worker Status:**
```bash
GET /admin/webhooks/stats
```

**Troubleshooting:**
1. **Worker not running**: Check application logs for "Webhook retry worker started"
2. **Database connection issues**: Check Prisma logs for connection errors
3. **Events not ready**: Verify `nextRetryAt` is in the past:
   ```sql
   SELECT COUNT(*) FROM stripe_webhook_events
   WHERE status IN ('pending', 'failed')
     AND "nextRetryAt" <= NOW();
   ```

**Fix:**
```bash
# Restart worker (if using systemd)
systemctl restart alchemy-api

# Or trigger manual retry
POST /admin/webhooks/:id/retry
{"resetRetryCount": true}
```

---

### Duplicate Processing

**Symptom:** Same event processed multiple times (duplicate orders)

**Investigation:**
```sql
-- Find events with multiple processedAt timestamps
SELECT eventId, COUNT(*) as attempts
FROM stripe_webhook_events
WHERE processed = true
GROUP BY eventId
HAVING COUNT(*) > 1;
```

**Causes:**
- Concurrency lock disabled (`enableConcurrencyLock: false`)
- Multiple workers without `FOR UPDATE SKIP LOCKED`
- Transaction isolation issues

**Fix:**
1. **Enable concurrency lock:**
   ```typescript
   const worker = new WebhookRetryWorker({
     enableConcurrencyLock: true,  // Ensure this is true
   });
   ```

2. **Add idempotency check:**
   ```typescript
   // In order creation logic
   const existingOrder = await prisma.orders.findUnique({
     where: { stripe_payment_intent_id: paymentIntentId },
   });
   
   if (existingOrder) {
     logger.warn('Order already exists for payment intent', { paymentIntentId });
     return existingOrder;
   }
   ```

---

### Slow Processing

**Symptom:** Worker processes < 10 events per minute

**Investigation:**
```bash
# Check worker uptime and throughput
GET /admin/webhooks/stats

# Check recent error patterns
GET /admin/webhooks?status=failed&limit=20
```

**Causes:**
- Database query timeouts
- Large payload sizes
- Network latency to Stripe API
- Insufficient database connections

**Fix:**
1. **Increase batch size:**
   ```typescript
   const worker = new WebhookRetryWorker({
     batchSize: 20,  // Increase from 10
   });
   ```

2. **Optimize database connection pool:**
   ```bash
   # In .env
   DATABASE_URL="postgresql://...?connection_limit=20"
   ```

3. **Reduce polling interval:**
   ```typescript
   const worker = new WebhookRetryWorker({
     pollingInterval: 15000,  // 15 seconds instead of 30
   });
   ```

---

## FAQ

### Q: What happens if worker crashes during processing?

**A:** Events in-flight are marked `status='processing'`. On next worker poll:
- If `lastAttemptAt` is > 5 minutes ago, they're treated as stuck
- Worker skips them (via SKIP LOCKED)
- Manual intervention needed to reset:
  ```sql
  UPDATE stripe_webhook_events
  SET status = 'failed'
  WHERE status = 'processing'
    AND "lastAttemptAt" < NOW() - INTERVAL '5 minutes';
  ```

### Q: Can I disable the worker without redeploying?

**A:** Yes, set environment variable:
```bash
WEBHOOK_RETRY_ENABLED=false
```

Then restart the application. Events will still be created but not retried.

### Q: How do I prioritize specific events?

**A:** Update priority in database:
```sql
UPDATE stripe_webhook_events
SET priority = 20  -- Higher than default 10
WHERE eventType = 'payment_intent.succeeded'
  AND status IN ('pending', 'failed');
```

Or modify `getPriorityForEventType()` in `payment.service.ts`.

### Q: What's the maximum time an event can be in retry?

**A:** With default config (5 retries, exponential backoff):
- Total: ~7 hours 21 minutes
- Breakdown: 0s + 1m + 5m + 15m + 1h + 6h = 7h21m

After this, event moves to DLQ unless manually retried.

### Q: Can I customize backoff delays?

**A:** Yes, modify `BACKOFF_DELAYS` in `webhook-retry.service.ts`:
```typescript
private static readonly BACKOFF_DELAYS = [
  0,      // Immediate
  30,     // 30 seconds
  120,    // 2 minutes
  600,    // 10 minutes
  1800,   // 30 minutes
  7200,   // 2 hours
];
```

### Q: How do I test the retry system?

**A:** Create a test webhook event:
```sql
INSERT INTO stripe_webhook_events (
  id, "eventId", "eventType", payload, 
  status, "retryCount", "nextRetryAt"
) VALUES (
  'test_webhook_1',
  'evt_test_123',
  'payment_intent.succeeded',
  '{"id": "evt_test_123", "type": "payment_intent.succeeded"}',
  'pending',
  0,
  NOW()
);
```

Worker will pick it up on next poll (within 30 seconds).

### Q: Can I run multiple workers in different regions?

**A:** Yes, as long as they share the same database. Use `FOR UPDATE SKIP LOCKED` (enabled by default) to prevent conflicts.

**Example Multi-Region:**
```
US-East Worker  →  PostgreSQL (Primary)
EU-West Worker  →  PostgreSQL (Read Replica) ← NOT SUPPORTED
```

**Important:** All workers must connect to PRIMARY database (not read replicas) because `FOR UPDATE` requires write access.

### Q: What happens to events during deployment?

**A:** Graceful shutdown ensures safety:
1. New worker stops accepting batches
2. Current batch finishes (up to 60 seconds)
3. Incomplete events remain `status='failed'`
4. New worker picks them up after deployment

**Zero downtime deployment:**
- Use rolling updates (one instance at a time)
- Each instance waits for worker shutdown before stopping
- Events continue processing on remaining instances

### Q: How much database storage do webhook events consume?

**A:** Average event size:
- Payload: ~1-5 KB (JSON)
- Metadata: ~500 bytes
- Total per event: ~2-6 KB

**Storage estimates:**
```
1,000 events/day × 6 KB × 90 days = 540 MB
10,000 events/day × 6 KB × 90 days = 5.4 GB
```

**Recommendation:** Use cleanup endpoint to delete processed events > 90 days:
```bash
DELETE /admin/webhooks/cleanup?olderThanDays=90
```

Run monthly via cron job.

---

## Best Practices

### 1. Monitor Dead Letter Queue Daily

Set up alerts for DLQ events:
```sql
SELECT COUNT(*) FROM stripe_webhook_events
WHERE status = 'dead_letter';
```

Investigate and resolve DLQ events weekly.

### 2. Tune Retry Limits per Event Type

For non-critical events, reduce retries to save resources:
```typescript
private getMaxRetriesForEventType(eventType: string): number {
  if (eventType === 'payment_intent.succeeded') return 5;
  if (eventType.startsWith('charge.refund')) return 2;  // Lower priority
  return 3;
}
```

### 3. Use Bulk Retry After Outages

After resolving major outage:
```bash
# Get all failed events
GET /admin/webhooks?status=failed

# Bulk retry with reset
POST /admin/webhooks/bulk-retry
{
  "eventIds": [...],
  "resetRetryCount": true
}
```

### 4. Add Idempotency Keys

Prevent duplicate processing:
```typescript
const order = await prisma.orders.upsert({
  where: { stripe_payment_intent_id: paymentIntentId },
  update: {},  // Do nothing if exists
  create: { /* order data */ },
});
```

### 5. Log Webhook Context

Include correlation IDs in logs:
```typescript
logger.info('Processing webhook', {
  webhookId: event.id,
  eventType: event.eventType,
  retryCount: event.retryCount,
  paymentIntentId: paymentIntent.id,
  orderId: paymentIntent.metadata.orderId,
});
```

Makes troubleshooting easier when investigating DLQ events.

---

## Summary

The webhook retry system provides:

✅ **Reliability** - Automatic retry with exponential backoff  
✅ **Visibility** - Track processing status, retry counts, error history  
✅ **Control** - Manual retry, bulk operations, DLQ management  
✅ **Performance** - Priority-based processing, multi-instance safety  
✅ **Auditability** - Complete error history, structured logging  

**Next Steps:**
1. Run migration: `npx prisma migrate deploy`
2. Deploy updated API (worker starts automatically)
3. Configure monitoring alerts
4. Set up weekly DLQ review process
5. Schedule monthly cleanup job

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or check application logs.
