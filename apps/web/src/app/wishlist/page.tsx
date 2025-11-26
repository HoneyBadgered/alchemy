'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { catalogApi, WishlistResponse } from '@/lib/catalog-api';
import { getStockStatus, calculateDiscountPercent } from '@/lib/stock-utils';
import { useCart } from '@/contexts/CartContext';
import BottomNavigation from '@/components/BottomNavigation';
import { StarRating, StockStatusBadge, SaleBadge } from '@/components/shop';
import { useState } from 'react';

export default function WishlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addToCart } = useCart();
  const [movingToCart, setMovingToCart] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login?redirect=/wishlist');
    return null;
  }

  const { data, isLoading, error } = useQuery<WishlistResponse>({
    queryKey: ['wishlist'],
    queryFn: () => catalogApi.getWishlist(accessToken!),
    enabled: isAuthenticated && !!accessToken,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => catalogApi.removeFromWishlist(productId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const handleMoveToCart = async (productId: string) => {
    setMovingToCart((prev) => new Set(prev).add(productId));
    try {
      await addToCart(productId, 1);
      await catalogApi.removeFromWishlist(productId, accessToken!);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (error) {
      console.error('Failed to move to cart:', error);
      alert('Failed to move item to cart. Please try again.');
    } finally {
      setMovingToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-purple-900">My Wishlist</h1>
              <p className="text-sm text-gray-600 mt-1">
                {data?.items.length || 0} item{data?.items.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <Link
              href="/shop"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-900 text-lg">Loading wishlist...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to load wishlist. Please try again later.
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save items you love to buy later!
            </p>
            <Link
              href="/shop"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((item) => {
              const product = item.product;
              const stockStatus = getStockStatus(
                product.stock,
                product.lowStockThreshold || 5,
                true
              );
              const isOutOfStock = stockStatus.status === 'out_of_stock';
              const discountPercent = calculateDiscountPercent(
                Number(product.compareAtPrice || 0),
                Number(product.price)
              );
              const isOnSale = discountPercent > 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden relative"
                >
                  {/* Sale Badge */}
                  {isOnSale && <SaleBadge discountPercent={discountPercent} />}

                  {/* Remove Button */}
                  <button
                    onClick={() => {
                      if (confirm('Remove this item from your wishlist?')) {
                        removeFromWishlistMutation.mutate(product.id);
                      }
                    }}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>

                  <Link href={`/shop/${product.id}`}>
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🧪
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    {product.category && (
                      <div className="text-xs text-purple-600 font-semibold mb-1">
                        {product.category}
                      </div>
                    )}
                    
                    <Link href={`/shop/${product.id}`}>
                      <h3 className="font-bold text-lg mb-1 line-clamp-2 hover:text-purple-600">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Rating */}
                    {product.averageRating != null && product.reviewCount != null && product.reviewCount > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating rating={Number(product.averageRating)} size="sm" />
                        <span className="text-xs text-gray-500">({product.reviewCount})</span>
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className="mb-3">
                      <StockStatusBadge status={stockStatus.status} size="sm" />
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold text-purple-600">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      {isOnSale && product.compareAtPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ${Number(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Move to Cart Button */}
                    <button
                      onClick={() => handleMoveToCart(product.id)}
                      disabled={isOutOfStock || movingToCart.has(product.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {movingToCart.has(product.id)
                        ? 'Moving...'
                        : isOutOfStock
                        ? 'Sold Out'
                        : 'Move to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
