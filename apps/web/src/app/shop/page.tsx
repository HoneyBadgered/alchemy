'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';
import { apiClient } from '@/lib/api-client';
import { useCart } from '@/contexts/CartContext';
import {
  StarRating,
  StockStatusBadge,
  SaleBadge,
  WishlistButton,
} from '@/components/shop';

interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  available: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  lowStockThreshold?: number;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus?: StockStatus;
  isOnSale?: boolean;
  discountPercent?: number;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export default function ShopPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { addToCart, itemCount } = useCart();
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', page, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('perPage', '12');
      if (category) params.set('category', category);
      
      return apiClient.get<ProductsResponse>(
        `/catalog/products?${params.toString()}`
      );
    },
  });

  const categories = [
    'Coffee Blends',
    'Tea Blends',
    'Brewing Equipment',
    'Accessories',
    'Specialty Items',
  ];

  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      await addToCart(productId, 1);
      // Success feedback could be a toast notification in a production app
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(prev => {
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
              <h1 className="text-2xl font-bold text-purple-900">Shop</h1>
              <p className="text-sm text-gray-600 mt-1">
                Discover magical blends and potions
              </p>
            </div>
            <Link
              href="/cart"
              className="relative bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2"
            >
              <span>🛒</span>
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setCategory(undefined);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              category === undefined
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-900 text-lg">Loading products...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to load products. Please try again later.
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.products.map((product) => {
                const stockStatus = product.stockStatus || {
                  status: product.stock > 0 ? 'in_stock' : 'out_of_stock',
                  label: product.stock > 0 ? 'In Stock' : 'Sold Out',
                  available: product.stock,
                };
                const isOutOfStock = stockStatus.status === 'out_of_stock';

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group relative"
                  >
                    {/* Sale Badge */}
                    {product.isOnSale && product.discountPercent && (
                      <SaleBadge discountPercent={product.discountPercent} />
                    )}

                    {/* Wishlist Button */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>

                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🧪
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {product.category && (
                        <div className="text-xs text-purple-600 font-semibold mb-1">
                          {product.category}
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-purple-600">
                        {product.name}
                      </h3>
                      
                      {/* Rating */}
                      {product.averageRating != null && product.reviewCount != null && product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <StarRating rating={product.averageRating} size="sm" />
                          <span className="text-xs text-gray-500">({product.reviewCount})</span>
                        </div>
                      )}

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Stock Status */}
                      <div className="mb-3">
                        <StockStatusBadge status={stockStatus.status} size="sm" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-purple-600">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.isOnSale && product.compareAtPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ${Number(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(product.id, e)}
                          disabled={addingToCart.has(product.id) || isOutOfStock}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {addingToCart.has(product.id) ? 'Adding...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white text-purple-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="text-purple-900 font-semibold">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                  }
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 rounded-lg bg-white text-purple-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
