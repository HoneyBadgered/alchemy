'use client';

import { useState, use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedImage, setSelectedImage] = useState<string | undefined>();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100">
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
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
              {/* Image Gallery */}
              <div>
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

                <div className="text-4xl font-bold text-purple-600 mb-6">
                  ${product.price}
                </div>

                {/* Stock Status */}
                {product.stock > 0 ? (
                  <div className="text-green-600 font-semibold mb-6">
                    In Stock ({product.stock} available)
                  </div>
                ) : (
                  <div className="text-red-600 font-semibold mb-6">
                    Out of Stock
                  </div>
                )}

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

                {/* Purchase Options */}
                <div className="border-t pt-6">
                  <button
                    onClick={() => {
                      // TODO: Add to cart functionality
                      alert('Add to cart coming soon!');
                    }}
                    disabled={product.stock === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg text-lg font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Buy now functionality
                      alert('Buy now coming soon!');
                    }}
                    disabled={product.stock === 0}
                    className="w-full bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600 px-6 py-4 rounded-lg text-lg font-bold transition-colors disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
