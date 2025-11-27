'use client';

import { useState, use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useCart } from '@/contexts/CartContext';
import {
  StarRating,
  StockStatusBadge,
  SaleBadge,
  WishlistButton,
  ProductReviews,
  RecommendedProducts,
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
  trackInventory?: boolean;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus?: StockStatus;
  isOnSale?: boolean;
  discountPercent?: number;
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      return apiClient.get<Product>(`/catalog/products/${id}`);
    },
  });

  // Set initial selected image when product loads
  useEffect(() => {
    if (product && !selectedImage) {
      setSelectedImage(product.imageUrl || product.images?.[0]);
    }
  }, [product]); // Only depend on product, not selectedImage

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const stockStatus = product?.stockStatus || {
    status: product?.stock ? (product.stock > 0 ? 'in_stock' : 'out_of_stock') : 'out_of_stock',
    label: product?.stock && product.stock > 0 ? 'In Stock' : 'Sold Out',
    available: product?.stock || 0,
  };

  const isOutOfStock = stockStatus.status === 'out_of_stock';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/shop"
            className="text-purple-600 hover:text-purple-700 font-semibold mb-2 inline-block"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-purple-900 text-lg">Loading product...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to load product. Please try again later.
          </div>
        )}

        {product && (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Image Gallery */}
                <div className="relative">
                  {/* Sale Badge */}
                  {product.isOnSale && product.discountPercent && (
                    <SaleBadge discountPercent={product.discountPercent} size="lg" />
                  )}
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-2 right-2 z-10">
                    <WishlistButton productId={product.id} size="md" />
                  </div>

                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-8xl">
                        🧪
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {product.images && product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(image)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === image
                              ? 'border-purple-600'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} - View ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  {product.category && (
                    <div className="text-sm text-purple-600 font-semibold mb-2">
                      {product.category}
                    </div>
                  )}
                  <h1 className="text-3xl font-bold text-purple-900 mb-4">
                    {product.name}
                  </h1>

                  {/* Rating */}
                  {product.averageRating != null && product.reviewCount != null && product.reviewCount > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating rating={product.averageRating} size="md" />
                      <span className="text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-bold text-purple-600">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    {product.isOnSale && product.compareAtPrice && (
                      <>
                        <span className="text-2xl text-gray-400 line-through">
                          ${Number(product.compareAtPrice).toFixed(2)}
                        </span>
                        <SaleBadge discountPercent={product.discountPercent || 0} variant="tag" size="md" />
                      </>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-6">
                    <StockStatusBadge
                      status={stockStatus.status}
                      label={stockStatus.label}
                      size="md"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Description
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Features
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity & Purchase Options */}
                  <div className="border-t pt-6">
                    {/* Quantity Selector */}
                    {!isOutOfStock && (
                      <div className="flex items-center gap-4 mb-4">
                        <label className="font-semibold text-gray-700">Quantity:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                          <button
                            onClick={() => setQuantity((q) => Math.min(stockStatus.available, q + 1))}
                            disabled={quantity >= stockStatus.available}
                            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || isAddingToCart}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-lg font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
                    >
                      {isAddingToCart ? 'Adding...' : isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock || isAddingToCart}
                      className="w-full bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600 px-6 py-4 rounded-lg text-lg font-bold transition-colors disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mt-8">
              <ProductReviews productId={product.id} productName={product.name} />
            </div>

            {/* Recommended Products */}
            <RecommendedProducts productId={product.id} />
          </>
        )}
      </div>
    </div>
  );
}
