'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Header } from '@/components/layout';
import AddedToCartModal from '@/components/AddedToCartModal';
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

type Zone = 'The Hearthhouse' | 'The Conservatory' | 'The East Pavilion' | 'The Observatory' | 'The Liminal Tent';

const ZONES: { name: Zone; description: string; theme: string; gradient: string }[] = [
  {
    name: 'The Hearthhouse',
    description: 'Dark and smoky',
    theme: 'Warmth and comfort',
    gradient: 'from-amber-900 via-orange-800 to-red-900',
  },
  {
    name: 'The Conservatory',
    description: 'Light, floral, restorative',
    theme: 'Renewal and vitality',
    gradient: 'from-emerald-600 via-green-500 to-teal-600',
  },
  {
    name: 'The East Pavilion',
    description: 'Mornings, greens, clarity',
    theme: 'Focus and awakening',
    gradient: 'from-cyan-600 via-blue-500 to-indigo-600',
  },
  {
    name: 'The Observatory',
    description: 'Night, quiet, contemplation',
    theme: 'Rest and reflection',
    gradient: 'from-indigo-900 via-purple-800 to-violet-900',
  },
  {
    name: 'The Liminal Tent',
    description: 'Seasonal and limited finds',
    theme: 'Rare and ephemeral',
    gradient: 'from-pink-600 via-rose-500 to-fuchsia-600',
  },
];

export default function ShopPage() {
  const [selectedZone, setSelectedZone] = useState<Zone>('The Conservatory');
  const [page, setPage] = useState(1);
  const { addToCart, itemCount } = useCart();
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [addedProduct, setAddedProduct] = useState<{
    name: string;
    image?: string;
    price: number;
    quantity: number;
  } | null>(null);

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', page, selectedZone],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('perPage', '12');
      params.set('category', selectedZone);
      
      return apiClient.get<ProductsResponse>(
        `/catalog/products?${params.toString()}`
      );
    },
  });

  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the product details to show in modal
    const product = data?.products.find(p => p.id === productId);
    if (!product) return;

    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      await addToCart(productId, 1);
      
      // Show success modal
      setAddedProduct({
        name: product.name,
        image: product.imageUrl || product.images?.[0],
        price: Number(product.price),
        quantity: 1,
      });
      setShowModal(true);
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

  const currentZone = ZONES.find(z => z.name === selectedZone);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundImage: 'url(/images/background-products-page.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <Header />
      
      {/* Zone Header */}
      <div className={`bg-gradient-to-r ${currentZone?.gradient} mt-16 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold font-serif text-white mb-2">
            {selectedZone}
          </h1>
          <p className="text-white/90 text-lg italic mb-1">
            {currentZone?.description}
          </p>
          <p className="text-white/70 text-sm">
            {currentZone?.theme}
          </p>
        </div>
      </div>

      {/* Zone Navigation */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/shop/hearthhouse"
              className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            >
              The Hearthhouse
            </Link>
            <Link
              href="/shop/conservatory"
              className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            >
              The Conservatory
            </Link>
            <Link
              href="/shop/east-pavilion"
              className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            >
              The East Pavilion
            </Link>
            <Link
              href="/shop/observatory"
              className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            >
              The Observatory
            </Link>
            <Link
              href="/shop/liminal-tent"
              className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white hover:shadow-md transition-all"
            >
              The Liminal Tent
            </Link>
          </div>
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

      {addedProduct && (
        <AddedToCartModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          productName={addedProduct.name}
          productImage={addedProduct.image}
          quantity={addedProduct.quantity}
          price={addedProduct.price}
        />
      )}
    </div>
  );
}
