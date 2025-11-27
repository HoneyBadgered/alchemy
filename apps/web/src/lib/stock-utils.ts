/**
 * Stock Status Utility
 * Shared helper functions for stock status calculations
 */

export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  available: number;
}

export interface ProductStockInfo {
  stock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

/**
 * Calculate the stock status for a product
 */
export function getStockStatus(
  stock: number,
  lowStockThreshold: number = 5,
  trackInventory: boolean = true
): StockStatus {
  if (!trackInventory) {
    return {
      status: 'in_stock',
      label: 'In Stock',
      available: 999,
    };
  }

  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Sold Out',
      available: 0,
    };
  }

  if (stock <= lowStockThreshold) {
    return {
      status: 'low_stock',
      label: `Low Stock - Only ${stock} left`,
      available: stock,
    };
  }

  return {
    status: 'in_stock',
    label: 'In Stock',
    available: stock,
  };
}

/**
 * Get stock status from a product object
 */
export function getProductStockStatus(product: ProductStockInfo): StockStatus {
  return getStockStatus(
    product.stock,
    product.lowStockThreshold ?? 5,
    product.trackInventory ?? true
  );
}

/**
 * Calculate discount percentage between original and current price
 */
export function calculateDiscountPercent(
  originalPrice: number,
  currentPrice: number
): number {
  if (!originalPrice || originalPrice <= currentPrice) {
    return 0;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Check if a product is on sale
 */
export function isProductOnSale(
  price: number,
  compareAtPrice?: number | null
): boolean {
  return compareAtPrice != null && compareAtPrice > price;
}
