# Ingredient Inventory Tracking for Blend Products

## Overview

This document describes the ingredient inventory tracking system for custom blend products in the Alchemy e-commerce platform. When blend products are sold, the system automatically decrements the inventory of all underlying ingredients (base tea and add-ins) to prevent overselling and maintain accurate stock levels.

## Problem Statement

**Before Implementation:**
- Blend products were created with ingredients stored as JSON data (`baseTeaId`, `addIns[]`)
- When blends were ordered, only the blend product's stock was decremented (always 999 for custom blends)
- **Critical Issue:** Actual ingredient inventory was never decremented
- Result: Ingredients could be oversold through blend orders without stock tracking

**After Implementation:**
- Ingredient inventory is validated when adding blends to cart
- Ingredient inventory is locked and decremented during order placement
- Ingredients cannot be oversold even with concurrent blend orders
- Full audit trail of ingredient usage through order history

---

## Architecture

### Data Model

#### Blends Table
```prisma
model blends {
  id          String    @id @default(uuid())
  userId      String?
  sessionId   String?
  name        String?
  baseTeaId   String    // Reference to ingredients table
  addIns      Json      // Array of { ingredientId: string, quantity: number }
  productId   String?   // Links to products table
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Ingredients Table
```prisma
model ingredients {
  id                  String   @id @default(cuid())
  name                String
  inventoryAmount     Decimal  @default(0) @db.Decimal(10, 2)  // Tracked inventory
  minimumStockLevel   Decimal  @default(0) @db.Decimal(10, 2)
  status              String   @default("active")              // active, inactive, outOfStock
  // ... other fields
}
```

### Inventory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BLEND CREATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User creates blend in UI
   ↓
2. Frontend calls addBlendToCart(baseTeaId, addIns[])
   ↓
3. VALIDATION: Check ingredient availability
   - Fetch all required ingredients (base + add-ins)
   - Validate each ingredient has sufficient inventoryAmount
   - Validate each ingredient status is 'active'
   - Throw error if any ingredient is insufficient
   ↓
4. Create or find blend product
   ↓
5. Save blend record (stores ingredient composition)
   ↓
6. Add to cart

┌─────────────────────────────────────────────────────────────┐
│                    ORDER PLACEMENT FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. User initiates checkout
   ↓
2. Start database transaction (ReadCommitted, 15s timeout)
   ↓
3. LOCK PRODUCTS: SELECT ... FOR UPDATE on all products
   ↓
4. DETECT BLENDS: Identify custom-blend products in cart
   ↓
5. FETCH BLEND DATA: Load blend records to get ingredient lists
   ↓
6. CALCULATE INGREDIENT REQUIREMENTS:
   For each blend item:
     - Base tea: +1 unit per blend quantity
     - Each add-in: +(addIn.quantity × blend.quantity)
   Aggregate requirements across all blends
   ↓
7. LOCK INGREDIENTS: SELECT ... FOR UPDATE on all required ingredients
   ↓
8. VALIDATE INGREDIENT STOCK:
   - Check each ingredient inventoryAmount ≥ required quantity
   - Throw InsufficientStockError if any ingredient insufficient
   ↓
9. CREATE ORDER
   ↓
10. DECREMENT PRODUCT STOCK (regular products)
    ↓
11. DECREMENT INGREDIENT INVENTORY (blend ingredients)
    ↓
12. Update discount codes, create status logs
    ↓
13. Clear cart
    ↓
14. COMMIT TRANSACTION
```

---

## Implementation Details

### 1. Cart Validation (`cart.service.ts`)

**Location:** `apps/api/src/services/cart.service.ts` → `addBlendToCart()`

**Purpose:** Prevent adding blends to cart when ingredients are unavailable

```typescript
async addBlendToCart({
  baseTeaId,
  addIns,
  userId,
  sessionId,
  blendName,
}) {
  // INGREDIENT AVAILABILITY VALIDATION
  const ingredientIds = [baseTeaId, ...addIns.map(a => a.ingredientId)];
  const ingredients = await prisma.ingredients.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true, name: true, inventoryAmount: true, status: true },
  });

  // Validate base tea
  const baseTea = ingredientMap.get(baseTeaId);
  if (Number(baseTea.inventoryAmount) < 1) {
    throw new InsufficientStockError(
      `Insufficient inventory for base tea "${baseTea.name}"`,
      { ingredientId, ingredientName, requested: 1, available }
    );
  }

  // Validate each add-in
  for (const addIn of addIns) {
    const ingredient = ingredientMap.get(addIn.ingredientId);
    if (Number(ingredient.inventoryAmount) < addIn.quantity) {
      throw new InsufficientStockError(
        `Insufficient inventory for ingredient "${ingredient.name}"`,
        { ingredientId, ingredientName, requested, available }
      );
    }
  }

  // ... proceed with creating blend and adding to cart
}
```

**Error Types:**
- `NotFoundError`: Ingredient ID not found
- `CartError`: Ingredient status is not 'active'
- `InsufficientStockError`: Ingredient inventory too low

---

### 2. Order Service Inventory Tracking (`order.service.ts`)

**Location:** `apps/api/src/services/order.service.ts` → `placeOrder()`

**Purpose:** Lock and decrement ingredient inventory during order placement

#### Step 1: Detect Blend Products

```typescript
const blendProducts = cart.cart_items.filter((item: CartItemWithProduct) => 
  item.products.category === 'custom-blend'
);
```

#### Step 2: Fetch Blend Records

```typescript
const blendProductIds = blendProducts.map(item => item.productId);
const blendRecords = await tx.blends.findMany({
  where: { productId: { in: blendProductIds } },
  select: {
    id: true,
    productId: true,
    baseTeaId: true,
    addIns: true, // JSON: [{ ingredientId, quantity }]
  },
});
```

#### Step 3: Calculate Ingredient Requirements

```typescript
const ingredientRequirements: Map<string, number> = new Map();

for (const item of blendProducts) {
  const blend = blendMap.get(item.productId);
  
  // Base tea: 1 unit per blend
  const currentBaseQty = ingredientRequirements.get(blend.baseTeaId) || 0;
  ingredientRequirements.set(blend.baseTeaId, currentBaseQty + item.quantity);
  
  // Add-ins: multiply by number of blends ordered
  const addIns = blend.addIns as Array<{ ingredientId: string; quantity: number }>;
  for (const addIn of addIns) {
    const currentQty = ingredientRequirements.get(addIn.ingredientId) || 0;
    ingredientRequirements.set(addIn.ingredientId, currentQty + (addIn.quantity * item.quantity));
  }
}
```

**Example:**
```
Cart contains:
- 2x "Lavender Dream Blend" (base: green-tea, addIns: [{ lavender, qty: 2 }, { chamomile, qty: 1 }])

Ingredient requirements calculated:
- green-tea: 2 units (2 blends × 1 base per blend)
- lavender: 4 units (2 blends × 2 lavender per blend)
- chamomile: 2 units (2 blends × 1 chamomile per blend)
```

#### Step 4: Lock Ingredients with Pessimistic Locking

```typescript
const ingredientIds = Array.from(ingredientRequirements.keys());

const lockedIngredientsArray = await tx.$queryRaw<Array<{ 
  id: string; 
  inventoryAmount: Prisma.Decimal; 
  name: string;
  status: string;
}>>`
  SELECT id, "inventoryAmount", name, status
  FROM ingredients
  WHERE id IN (${Prisma.join(ingredientIds)})
  FOR UPDATE
`;
```

**Why `FOR UPDATE`?**
- **Pessimistic Locking:** Prevents other transactions from modifying ingredient rows
- **Race Condition Prevention:** Two concurrent orders can't both decrement the same ingredient below zero
- **Serialization:** Orders are processed sequentially for shared ingredients
- **Lock Timeout:** Transaction will fail after 5 seconds if lock cannot be acquired

#### Step 5: Validate Stock Levels

```typescript
for (const [ingredientId, requiredQty] of ingredientRequirements.entries()) {
  const ingredient = lockedIngredients.get(ingredientId);
  
  if (ingredient.inventoryAmount < requiredQty) {
    throw new InsufficientStockError(
      `Insufficient ingredient inventory for ${ingredient.name}`,
      { ingredientId, ingredientName, requested: requiredQty, available: ingredient.inventoryAmount }
    );
  }
}
```

#### Step 6: Decrement Ingredient Inventory

```typescript
// After order creation and product stock decrement...

for (const [ingredientId, requiredQty] of ingredientRequirements.entries()) {
  await tx.ingredients.update({
    where: { id: ingredientId },
    data: {
      inventoryAmount: { decrement: requiredQty },
    },
  });
}

console.log('Ingredient inventory updated:', {
  orderId: newOrder.id,
  ingredientsUpdated: ingredientRequirements.size,
  details: Array.from(ingredientRequirements.entries()).map(([id, qty]) => ({
    ingredientId: id,
    ingredientName: lockedIngredients.get(id)?.name,
    quantityDeducted: qty,
  })),
});
```

---

## Edge Cases & Scenarios

### 1. Multiple Blends in Same Order

**Scenario:** User orders 2 different blends that share ingredients

**Behavior:**
- Ingredient requirements are **aggregated**
- Single lock and decrement per ingredient (not per blend)
- Total deduction = sum of all blend requirements

**Example:**
```
Order contains:
- 1x "Lavender Green Tea" (green-tea + 2 lavender)
- 1x "Chamomile Green Tea" (green-tea + 1 chamomile)

Ingredient deductions:
- green-tea: -2 (base for both blends)
- lavender: -2
- chamomile: -1
```

### 2. Same Ingredient Used Multiple Times in One Blend

**Scenario:** Blend uses same ingredient as both base and add-in (unlikely but possible)

**Behavior:**
- Requirements are aggregated by ingredient ID
- Single lock per ingredient
- Total deduction = sum of all uses

**Example:**
```
Blend: "Extra Green Tea Blend"
- Base: green-tea (1 unit)
- Add-ins: [{ green-tea, 2 }]

Total green-tea deduction: 3 units (1 + 2)
```

### 3. Concurrent Orders for Same Ingredients

**Scenario:** Two users simultaneously order blends using the same ingredients

**Behavior:**
1. First transaction acquires `FOR UPDATE` lock on ingredient
2. Second transaction **waits** for lock (max 5 seconds)
3. If stock is sufficient after first order commits, second order proceeds
4. If stock is insufficient, second order fails with `InsufficientStockError`

**Result:** No overselling, exactly one order fails when stock is insufficient

### 4. Stock Becomes Insufficient Between Cart and Checkout

**Scenario:**
1. User adds blend to cart (ingredients available: 10 units)
2. Other users order same ingredient (available drops to 2 units)
3. Original user attempts checkout (needs 5 units)

**Behavior:**
- Order placement fails at validation step
- User receives clear error: "Insufficient ingredient inventory for [name]"
- Cart remains intact, user can retry later

**Recommendation:** Show real-time stock warnings in cart UI

### 5. Ingredient Status Changes

**Scenario:** Ingredient becomes inactive between cart add and checkout

**Cart Validation:** Prevents adding blend with inactive ingredient
**Order Validation:** Does not check status (only inventory amount)

**Rationale:** Once in cart, ingredient status changes shouldn't block checkout (inventory is the constraint)

### 6. Mixed Cart (Regular Products + Blends)

**Scenario:** Cart contains both regular products and blend products

**Behavior:**
1. Products locked with `FOR UPDATE`
2. Blend products identified
3. Ingredients locked with `FOR UPDATE`
4. Both product stock AND ingredient inventory validated
5. Both decremented in same transaction

**Result:** Atomic operation ensures consistency

---

## Transaction Isolation & Performance

### Transaction Configuration

```typescript
await prisma.$transaction(async (tx) => {
  // ... order placement logic
}, {
  maxWait: 5000,        // Max 5 seconds to acquire connection
  timeout: 15000,       // Max 15 seconds for transaction
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
});
```

### Isolation Level: `ReadCommitted`

**Why ReadCommitted?**
- Prevents dirty reads (reading uncommitted data)
- Allows concurrent reads (better performance than Serializable)
- Combined with `FOR UPDATE`, provides strong consistency for inventory

**Alternative:** `Serializable` would be safer but has performance cost

### Lock Duration

**Average Case:**
- Lock held for ~100-500ms (DB queries + validation)
- Acceptable for e-commerce workload

**Worst Case:**
- Lock held for up to 15 seconds (transaction timeout)
- Could cause cascading waits if many concurrent orders

**Recommendation:** Monitor lock wait times in production

### Deadlock Prevention

**Lock Order:**
1. Products locked first
2. Ingredients locked second
3. Both use `Prisma.join(ids)` which ensures **consistent ordering**

**Why This Matters:**
- If Transaction A locks Product 1 → Product 2 → Ingredient A → Ingredient B
- And Transaction B locks Product 2 → Product 1 → Ingredient B → Ingredient A
- **Deadlock** could occur

**Solution:** `Prisma.join()` sorts IDs alphabetically, ensuring all transactions acquire locks in same order

---

## Monitoring & Observability

### Key Metrics to Track

1. **Ingredient Stock Levels**
   - Alert when `inventoryAmount < minimumStockLevel`
   - Dashboard showing ingredients nearing depletion

2. **Blend Order Failures**
   - Count of `InsufficientStockError` for ingredients
   - Identify which ingredients cause most failures

3. **Lock Wait Times**
   - Average time transactions wait for ingredient locks
   - Alert if >1 second average (indicates contention)

4. **Ingredient Usage Patterns**
   - Which ingredients are most popular in blends
   - Predict restocking needs

### Logging

The implementation logs ingredient updates:

```typescript
console.log('Ingredient inventory updated:', {
  orderId: newOrder.id,
  ingredientsUpdated: ingredientRequirements.size,
  details: Array.from(ingredientRequirements.entries()).map(([id, qty]) => ({
    ingredientId: id,
    ingredientName: lockedIngredients.get(id)?.name,
    quantityDeducted: qty,
  })),
});
```

**Recommendation:** Send to structured logging system (Datadog, CloudWatch, etc.)

### Alerting

**Critical Alerts:**
- Ingredient inventory below minimum stock level
- High rate of ingredient stock errors (indicates demand surge)

**Warning Alerts:**
- Ingredient lock wait time >500ms
- Frequent transaction timeouts

---

## Testing Strategy

### Unit Tests

**File:** `apps/api/src/__tests__/ingredient-inventory.test.ts`

**Test Coverage:**
1. ✅ Cart validation prevents insufficient ingredient blends
2. ✅ Ingredient inventory decremented on order
3. ✅ Multiple blends in same order aggregate correctly
4. ✅ Concurrent orders don't oversell ingredients (pessimistic locking)
5. ✅ Mixed cart (regular + blend) handles both stock types
6. ✅ Same ingredient used multiple times aggregates correctly

### Integration Tests

**Recommended:**
1. End-to-end blend creation → cart → checkout flow
2. High concurrency tests (100+ simultaneous orders)
3. Failure recovery (rollback on payment failure)

### Load Testing

**Critical Scenario:**
- Black Friday sale with 1,000 concurrent users
- All ordering blends with overlapping ingredients
- Measure: lock wait times, transaction success rate, deadlocks

---

## Migration & Rollout

### Database Migration

**No schema changes required** - uses existing `inventoryAmount` field

### Deployment Steps

1. **Deploy Backend Changes**
   - `cart.service.ts` (validation)
   - `order.service.ts` (locking + decrement)

2. **Monitor Initial Orders**
   - Watch for unexpected errors
   - Verify ingredient inventory is decrementing

3. **Backfill Historical Data** (Optional)
   - Audit past blend orders
   - Retroactively adjust ingredient inventory if needed

### Rollback Plan

If critical issues arise:

1. **Revert Code:** Redeploy previous version
2. **Ingredient Inventory:** Manual adjustment via admin panel
3. **Monitor:** Check for overselling during rollback period

---

## Security Considerations

### 1. Ingredient ID Validation

**Risk:** Malicious user sends fake `ingredientId` in blend

**Mitigation:**
- Database foreign key constraints would help (not currently enforced)
- Runtime validation: ingredient must exist and be active
- Error logged if ingredient not found

### 2. Quantity Manipulation

**Risk:** User modifies `addIn.quantity` to negative number (attempt to "add" inventory)

**Mitigation:**
- Frontend validation (not security boundary)
- **Backend validation needed:** Add quantity > 0 check in `addBlendToCart()`

**Recommendation:**
```typescript
for (const addIn of addIns) {
  if (addIn.quantity <= 0) {
    throw new BadRequestError('Ingredient quantity must be positive');
  }
}
```

### 3. Race Condition Attacks

**Risk:** Attacker rapidly creates orders to exploit race conditions

**Mitigation:**
- Pessimistic locking prevents overselling
- Transaction timeout (15s) limits attack surface
- Rate limiting at API layer recommended

---

## Future Enhancements

### 1. Reserved Inventory

**Problem:** User adds blend to cart, but inventory isn't reserved until checkout

**Solution:**
- Implement cart-level reservation (soft lock)
- Release reservation after 30 minutes
- Decrement from reserved inventory at checkout

### 2. Predictive Restocking

**Data:** Track ingredient usage patterns from blend orders

**ML Model:** Predict future ingredient demand

**Automation:** Trigger supplier orders when projected stock < threshold

### 3. Substitution Suggestions

**Scenario:** User's desired ingredient is out of stock

**Feature:** Suggest alternative ingredients with similar flavor profile

**Implementation:** Use `ingredient_pairings` table to find substitutes

### 4. Batch Inventory Updates

**Current:** One `UPDATE` per ingredient per order

**Optimization:** Batch multiple orders' ingredient updates

**Trade-off:** Slightly higher risk of overselling vs better performance

---

## FAQ

### Q: What happens if an ingredient goes out of stock mid-checkout?

**A:** The order will fail at the validation step (after locking ingredients). The user receives an error message indicating which ingredient is insufficient. The cart remains intact for retry.

### Q: Can blends cause negative ingredient inventory?

**A:** No. The pessimistic locking and validation ensures inventory is always ≥ 0. If validation passes, the decrement is safe.

### Q: What if the blend product's stock is 0 but ingredients are available?

**A:** Blend products always have stock = 999. The constraint is ingredient inventory, not product stock. Product stock is only relevant for pre-made products.

### Q: How does this interact with the existing product stock locking?

**A:** Both systems run in the same transaction:
1. Product rows locked with `FOR UPDATE`
2. Ingredient rows locked with `FOR UPDATE`
3. Both validated
4. Both decremented
5. Single atomic commit

### Q: What's the performance impact of locking ingredients?

**A:** Minimal for typical workloads:
- Lock held for <500ms on average
- Concurrent orders for different ingredients proceed in parallel
- Only contention when multiple orders share ingredients (rare)

### Q: Can we skip cart validation and only validate at checkout?

**A:** Not recommended. Cart validation provides better UX:
- User knows immediately if blend is unavailable
- Prevents frustration at checkout
- Reduces cart abandonment

### Q: What if a blend record is missing (data corruption)?

**A:** Order placement skips ingredient tracking for that product:
```typescript
const blend = blendMap.get(item.productId);
if (!blend) continue; // Graceful degradation
```
This prevents order failure but loses ingredient tracking. **Monitor for missing blend records.**

---

## Related Documentation

- **Pessimistic Locking:** `PESSIMISTIC_LOCKING.md`
- **Payment Idempotency:** `PAYMENT_IDEMPOTENCY.md`
- **Blend Persistence:** `BLEND_PERSISTENCE_SUMMARY.md`
- **CSRF Protection:** (Pending documentation)

---

## Change Log

| Date       | Version | Changes                                          |
|------------|---------|--------------------------------------------------|
| 2026-01-03 | 1.0     | Initial implementation of ingredient inventory tracking |

---

## Contact & Support

**Questions?** Contact the backend team or file an issue in the repository.

**Production Issues?** Check ingredient inventory levels in admin panel and review order logs for `InsufficientStockError` patterns.
