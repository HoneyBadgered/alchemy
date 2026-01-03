# Pessimistic Locking for Inventory Management

## Overview

This implementation uses **pessimistic locking** to prevent race conditions when multiple customers attempt to purchase the same limited-stock items simultaneously.

## Problem Statement

Without proper locking, the following race condition can occur:

```
Time   Transaction A              Transaction B
----   -------------------------  -------------------------
T1     Read: Product stock = 1    
T2                                 Read: Product stock = 1
T3     Validate: 1 >= 1 ✓        
T4                                 Validate: 1 >= 1 ✓
T5     Update: stock = 0         
T6                                 Update: stock = -1 ❌
```

**Result:** Two orders placed for a product with only 1 in stock (overselling).

## Solution: Pessimistic Locking

### Implementation

We use PostgreSQL's `SELECT ... FOR UPDATE` to acquire **exclusive row-level locks** during transactions:

```typescript
// Lock product rows before reading stock levels
const lockedProducts = await tx.$queryRaw<Array<{ id: string; stock: number; isActive: boolean }>>`
  SELECT id, stock, "isActive"
  FROM products
  WHERE id IN (${Prisma.join(productIds)})
  FOR UPDATE
`;
```

### How It Works

```
Time   Transaction A                    Transaction B
----   -------------------------------  ---------------------------
T1     BEGIN TRANSACTION               
T2     SELECT ... FOR UPDATE (LOCK A)  
T3                                       BEGIN TRANSACTION
T4     Read: stock = 1                 
T5                                       SELECT ... FOR UPDATE (WAITS)
T6     Validate: 1 >= 1 ✓              
T7     Update: stock = 0               
T8     COMMIT (RELEASE LOCK)           
T9                                       (LOCK ACQUIRED)
T10                                      Read: stock = 0
T11                                      Validate: 0 >= 1 ✗
T12                                      ROLLBACK (Error)
```

**Result:** Only one order succeeds. Second transaction sees updated stock after first commits.

## Key Features

### 1. Row-Level Locking
- **Granularity:** Only locks specific product rows, not entire table
- **Concurrency:** Orders for different products proceed in parallel
- **Performance:** Minimal blocking for high-inventory products

### 2. Deadlock Prevention
- **Lock Ordering:** Products always locked in consistent order (by ID via `Prisma.join`)
- **Timeouts:** Transaction timeout (15s) and lock acquisition timeout (5s)
- **Retry Logic:** Application-level retry for transient failures

### 3. Transaction Configuration

```typescript
await prisma.$transaction(async (tx) => {
  // ... transaction logic
}, {
  maxWait: 5000,      // Max 5s to acquire database connection
  timeout: 15000,     // Max 15s for entire transaction
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
});
```

## Applied Locations

### 1. Order Placement (`order.service.ts`)

**When:** User checks out from cart
**What:** Locks all products in cart before decrementing stock
**Why:** Prevents overselling when multiple users checkout simultaneously

```typescript
// apps/api/src/services/order.service.ts
const lockedProducts = await tx.$queryRaw`
  SELECT id, stock, "isActive"
  FROM products
  WHERE id IN (${Prisma.join(productIds)})
  FOR UPDATE
`;
```

### 2. Reward Redemption (`rewards.service.ts`)

**When:** User redeems limited-quantity reward
**What:** Locks reward row before decrementing stock
**Why:** Prevents over-redemption of limited rewards

```typescript
// apps/api/src/services/rewards.service.ts
const lockedReward = await tx.$queryRaw`
  SELECT id, stock
  FROM rewards
  WHERE id = ${reward.id}
  FOR UPDATE
`;
```

## Performance Considerations

### Lock Duration
- **Target:** < 100ms per transaction
- **Monitoring:** Log slow transactions > 1s
- **Alert:** Transactions timing out > 5s

### Contention Scenarios

#### Low Stock Product (e.g., stock = 1)
- **Expected:** High contention, sequential processing
- **Impact:** Some users see "out of stock" error
- **Mitigation:** Pre-checkout stock validation, optimistic messaging

#### High Stock Product (e.g., stock = 1000)
- **Expected:** Low contention, parallel processing
- **Impact:** Minimal - locks released quickly
- **Mitigation:** None needed

### Scalability

- **Horizontal:** Multiple API servers can handle requests (database serializes)
- **Vertical:** PostgreSQL row-level locks scale to millions of products
- **Bottleneck:** Database connection pool (default: 10 connections)

## Error Handling

### Insufficient Stock
```typescript
throw new InsufficientStockError(
  `Insufficient stock for ${product.name}`,
  { 
    productId: item.productId,
    requested: item.quantity,
    available: currentStock,
  }
);
```

**HTTP Status:** 400 Bad Request
**User Message:** "Sorry, only X items remaining for [Product Name]"

### Transaction Timeout
```typescript
if (error.code === 'P2034') {
  throw new OrderValidationError('Transaction conflict - please try again');
}
```

**HTTP Status:** 409 Conflict
**User Message:** "High demand - please try again"

### Lock Timeout (Database-level)

**PostgreSQL Setting:** `lock_timeout = 5000` (5 seconds)
**Error:** "canceling statement due to lock timeout"
**Retry:** Automatic retry with exponential backoff

## Testing

### Unit Tests (`pessimistic-locking.test.ts`)

```bash
pnpm test src/__tests__/pessimistic-locking.test.ts
```

**Scenarios:**
1. **Concurrent orders for last item:** Verify only one succeeds
2. **Multiple products:** Verify partial fulfillment handling
3. **Lock timeout:** Verify graceful degradation

### Load Tests

```bash
# Simulate 100 concurrent orders for product with stock=10
artillery run load-tests/concurrent-checkout.yml
```

**Metrics:**
- Success rate: ~10% (10 orders succeed, 90 fail due to stock)
- No overselling: Final stock = 0 (not negative)
- Average latency: < 200ms per request

## Monitoring

### Key Metrics

1. **Lock Wait Time:** `pg_stat_activity.wait_event = 'Lock'`
2. **Transaction Duration:** `order_placement_duration_seconds`
3. **Stock Discrepancies:** Daily reconciliation job

### Alerts

- 🔴 **Critical:** Stock goes negative (data corruption)
- 🟡 **Warning:** >10% of transactions timing out
- 🟢 **Info:** High contention on specific products (low stock alert)

## Database Configuration

### Recommended PostgreSQL Settings

```sql
-- Lock timeout for safety
SET lock_timeout = '5s';

-- Statement timeout for runaway queries
SET statement_timeout = '15s';

-- Isolation level (per-transaction)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### Index Requirements

```sql
-- Primary key already indexed
-- Ensure stock column is efficiently accessible
CREATE INDEX CONCURRENTLY idx_products_stock_active 
  ON products (stock, "isActive") 
  WHERE "isActive" = true;
```

## Alternatives Considered

### 1. Optimistic Locking ❌
**Approach:** Read stock, attempt update, retry on conflict
**Rejected:** High retry rate for low-stock items, poor UX

### 2. Application-Level Semaphore ❌
**Approach:** Redis-based distributed lock
**Rejected:** Adds external dependency, consistency issues

### 3. Queue-Based Processing ❌
**Approach:** Orders queued, processed sequentially
**Rejected:** Increased latency, complex architecture

### 4. Reserved Inventory ✅ (Future Enhancement)
**Approach:** Temporarily reserve stock during checkout (5 min expiry)
**Benefit:** Prevents cart abandonment issues
**Status:** Planned for Q2 2026

## Migration Guide

### Existing Installations

**No schema changes required** - implementation uses existing `stock` column.

### Deployment Steps

1. Deploy updated API code
2. Monitor transaction latency for 24h
3. Adjust `maxWait` / `timeout` if needed
4. Enable detailed query logging temporarily
5. Verify no stock discrepancies in audit

### Rollback Plan

No rollback needed - locking is backward compatible. Remove `FOR UPDATE` clause to revert to previous behavior.

## FAQ

### Q: Why not use Redis for inventory tracking?
**A:** PostgreSQL provides ACID guarantees. Redis requires careful coordination with database to prevent inconsistencies.

### Q: What happens during database failover?
**A:** In-flight transactions are rolled back. Users see "please try again" message. Locks are automatically released.

### Q: Can two users reserve the same item in cart?
**A:** Yes - locking only applies during **order placement**, not cart operations. This is intentional to allow browsing without locks.

### Q: How to handle flash sales?
**A:** Consider implementing:
1. Pre-checkout stock validation (soft check)
2. Queue system for high-demand items
3. Rate limiting per user (prevent rapid checkout attempts)

## Resources

- [PostgreSQL Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Transaction Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)

---

**Last Updated:** January 3, 2026
**Maintainer:** Engineering Team
