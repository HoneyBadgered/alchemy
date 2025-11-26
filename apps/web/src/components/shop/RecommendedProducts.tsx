'use client';

/**
 * Related Products / Recommendations Component
 * "You May Also Like" section for product pages
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { catalogApi, RecommendedProduct } from '@/lib/catalog-api';
import { getStockStatus, calculateDiscountPercent } from '@/lib/stock-utils';
import { StarRating } from './StarRating';
import { StockStatusBadge } from './StockStatusBadge';
import { SaleBadge } from './SaleBadge';
import { WishlistButton } from './WishlistButton';
import { useCart } from '@/contexts/CartContext';

interface RecommendedProductsProps {
  productId: string;
  title?: string;
  limit?: number;
}

export function RecommendedProducts({
  productId,
  title = 'You May Also Like',
  limit = 4,
}: RecommendedProductsProps) {
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = React.useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', productId, limit],
    queryFn: () => catalogApi.getRecommendations(productId, limit),
  });

  const handleAddToCart = async (product: RecommendedProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    setAddingToCart((prev) => new Set(prev).add(product.id));
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.products.map((product) => {
          const stockStatus = getStockStatus(product.stock, product.lowStockThreshold || 5, true);
          const discountPercent = calculateDiscountPercent(
            product.compareAtPrice || 0,
            product.price
          );
          const isOnSale = discountPercent > 0;

          return (
            <Link
              key={product.id}
              href={`/shop/${product.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              {/* Sale Badge */}
              {isOnSale && <SaleBadge discountPercent={discountPercent} />}

              {/* Wishlist Button */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <WishlistButton productId={product.id} size="sm" />
              </div>

              {/* Product Image */}
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🧪
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-purple-600">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.averageRating != null && product.reviewCount > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <StarRating rating={product.averageRating} size="sm" />
                    <span className="text-xs text-gray-500">({product.reviewCount})</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-purple-600">${product.price}</span>
                  {isOnSale && product.compareAtPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${product.compareAtPrice}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <StockStatusBadge status={stockStatus.status} size="sm" />

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={stockStatus.status === 'out_of_stock' || addingToCart.has(product.id)}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm py-1.5 rounded-full font-semibold transition-colors"
                >
                  {addingToCart.has(product.id)
                    ? 'Adding...'
                    : stockStatus.status === 'out_of_stock'
                    ? 'Sold Out'
                    : 'Add to Cart'}
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
