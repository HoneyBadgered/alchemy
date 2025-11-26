# TODO: Catalog & Product Features

This document summarizes the features implemented and any additional work needed.

## Implemented Features

### 1. Product Reviews & Ratings ✅
- **Backend:**
  - Added `Review` model to Prisma schema with userId, productId, rating (1-5), title, content, isVerified, isApproved
  - Created `ReviewsService` with methods: createReview, getProductReviews, getUserReview, updateReview, deleteReview
  - Created API endpoints:
    - `POST /reviews` - Create a review (requires auth)
    - `GET /products/:id/reviews` - Get paginated reviews with rating distribution
    - `GET /reviews/my/:productId` - Get user's own review (requires auth)
    - `PATCH /reviews/:id` - Update a review (requires auth)
    - `DELETE /reviews/:id` - Delete a review (requires auth)
  - Average rating cached on Product model for efficient querying
  - Verified purchase detection for reviews

- **Frontend:**
  - `StarRating` component for displaying and selecting ratings
  - `ProductReviews` component with review form, list, pagination, and rating distribution
  - Reviews section added to product detail page

### 2. Stock / Inventory Status ✅
- **Backend:**
  - Added `lowStockThreshold`, `trackInventory`, `compareAtPrice` fields to Product model
  - Enhanced `CatalogService` to return `stockStatus` object with status, label, and available count
  - Stock validation already exists in cart and order services

- **Frontend:**
  - `StockStatusBadge` component showing "In Stock", "Low Stock", or "Sold Out"
  - Add-to-Cart buttons disabled when out of stock
  - Stock status displayed on product cards and detail pages

### 3. Promotions / Coupons ✅
- **Backend:**
  - `DiscountCode` model already existed in schema
  - Created `PromotionsService` with validateCoupon, getSaleProducts, isProductOnSale methods
  - Created API endpoints:
    - `POST /coupons/validate` - Validate and calculate discount
    - `GET /promotions/sale` - Get products on sale
    - `GET /promotions/check/:productId` - Check if product is on sale

- **Frontend:**
  - `SaleBadge` component showing discount percentage
  - `CouponInput` component for entering and applying discount codes
  - Coupon functionality integrated into cart page
  - Sale indicators on product cards and detail pages

### 4. Bundles / Upsells ✅
- **Backend:**
  - Added `ProductBundle`, `BundleItem`, and `ProductRelation` models
  - Created `BundlesService` with methods: getBundles, getBundle, getRelatedProducts, getRecommendations, getCartUpsells
  - Created API endpoints:
    - `GET /bundles` - List all active bundles
    - `GET /bundles/:id` - Get bundle details
    - `GET /products/:id/related` - Get related products
    - `GET /products/:id/recommendations` - Get "You May Also Like" recommendations
    - `GET /cart/upsells` - Get upsell products for cart items

- **Frontend:**
  - `RecommendedProducts` component showing "You May Also Like" section
  - Recommendations displayed on product detail pages

### 5. Wishlist / Save for Later ✅
- **Backend:**
  - Added `WishlistItem` model to Prisma schema
  - Created `WishlistService` with methods: addToWishlist, removeFromWishlist, getWishlist, isInWishlist, getWishlistCount, moveToCart, clearWishlist
  - Created API endpoints:
    - `GET /wishlist` - Get user's wishlist (requires auth)
    - `POST /wishlist` - Add to wishlist (requires auth)
    - `DELETE /wishlist/:productId` - Remove from wishlist (requires auth)
    - `GET /wishlist/check/:productId` - Check if in wishlist (requires auth)
    - `GET /wishlist/count` - Get wishlist count (requires auth)
    - `POST /wishlist/:productId/move-to-cart` - Move to cart (requires auth)
    - `DELETE /wishlist` - Clear wishlist (requires auth)

- **Frontend:**
  - `WishlistButton` component (heart icon) for adding/removing from wishlist
  - Wishlist page at `/wishlist` showing saved items
  - "Save for Later" option in cart
  - Wishlist buttons on product cards and detail pages

## Database Changes

The following new models were added to `prisma/schema.prisma`:
- `Review` - Product reviews with ratings
- `WishlistItem` - User wishlist items
- `ProductBundle` - Product bundle definitions
- `BundleItem` - Items in a bundle
- `ProductRelation` - Related products (upsells, cross-sells, recommendations)

The `Product` model was enhanced with:
- `compareAtPrice` - Original price for sale items
- `lowStockThreshold` - When to show "Low Stock" warning
- `trackInventory` - Whether to track stock
- `averageRating` - Cached average rating
- `reviewCount` - Cached review count

## Assumptions Made

1. **Review Moderation:** Reviews are auto-approved (`isApproved: true`) by default. Admin moderation can be added later.

2. **Verified Purchases:** A review is marked as "verified" if the user has a completed order containing that product.

3. **One Review Per User:** Each user can only leave one review per product.

4. **Wishlist Auth Required:** Wishlist features require user authentication.

5. **Bundle Pricing:** Bundle discount is a percentage off the combined price of all items.

6. **Recommendations Logic:**
   - First uses explicit `ProductRelation` entries
   - Falls back to same-category products
   - Further falls back to popular products

7. **Stock Status Thresholds:**
   - "Sold Out" when stock = 0
   - "Low Stock" when stock <= lowStockThreshold
   - "In Stock" otherwise

## Future Enhancements

1. **Admin Features:**
   - Review moderation dashboard
   - Bundle creation/management UI
   - Product relationship management
   - Promotional banner management

2. **Enhanced Coupons:**
   - User-specific coupons
   - Category-specific discounts
   - Buy X Get Y promotions
   - First-time buyer discounts

3. **Review Enhancements:**
   - Helpful/unhelpful voting
   - Photo reviews
   - Filter by rating
   - AI-powered review analysis

4. **Personalized Recommendations:**
   - Based on purchase history
   - Based on browsing behavior
   - Collaborative filtering

5. **Inventory Management:**
   - Low stock notifications
   - Back-in-stock alerts for users
   - Pre-order functionality

## Testing Notes

- All new backend services compile without errors
- Catalog service tests updated to include new enhanced fields
- Pre-existing crafting service test failure (unrelated to these changes)
- Frontend components tested through build process
