'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface BlendDetail {
  id: string;
  name: string | null;
  baseTeaId: string;
  addIns: Array<{ ingredientId: string; quantity: number }>;
  productId: string | null;
  createdAt: string;
  users: {
    id: string;
    username: string;
    email: string;
  } | null;
  products: {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  } | null;
  baseTea: {
    id: string;
    name: string;
    category: string;
  } | null;
  addInsWithDetails: Array<{
    ingredientId: string;
    quantity: number;
    ingredient: {
      id: string;
      name: string;
      category: string;
      costPerGram: number | null;
    };
  }>;
}

export default function BlendDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuthStore();
  const blendId = params.id as string;
  
  const [blend, setBlend] = useState<BlendDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blendId) {
      fetchBlendDetails();
    }
  }, [blendId]);

  const fetchBlendDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/admin/blends/${blendId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blend details');

      const data = await response.json();
      setBlend(data);
    } catch (error) {
      console.error('Error fetching blend details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading blend details...</div>;
  }

  if (!blend) {
    return <div className="p-6">Blend not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/blends"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Blends
        </Link>
        <h1 className="text-3xl font-bold">
          {blend.name || 'Unnamed Blend'}
        </h1>
        <p className="text-gray-600 mt-1">
          Created {new Date(blend.createdAt).toLocaleDateString()}
          {blend.users && ` by ${blend.users.name}`}
        </p>
      </div>

      {/* Status Banner */}
      {blend.products && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">
                Converted to Product
              </h3>
              <p className="text-sm text-green-700">
                Product: {blend.products.name} (${blend.products.price})
              </p>
            </div>
            <Link
              href={`/admin/products/${blend.products.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Product
            </Link>
          </div>
        </div>
      )}

      {/* Blend Composition */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Blend Composition</h2>
        
        {/* Base Tea */}
        <div className="mb-4 pb-4 border-b">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Base Tea</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{blend.baseTea?.name || 'Unknown Base Tea'}</div>
              <div className="text-sm text-gray-500">{blend.baseTea?.category || 'N/A'}</div>
            </div>
            <div className="text-sm text-gray-500">~5g (standard serving)</div>
          </div>
        </div>

        {/* Add-Ins */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Add-Ins</h3>
          <div className="space-y-3">
            {blend.addInsWithDetails.map((addIn) => (
              <div
                key={addIn.ingredientId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{addIn.ingredient.name}</div>
                  <div className="text-sm text-gray-500">
                    {addIn.ingredient.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{addIn.quantity}g</div>
                  {addIn.ingredient.costPerGram && (
                    <div className="text-sm text-gray-500">
                      ${(Number(addIn.ingredient.costPerGram) * addIn.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Information */}
      {blend.users && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">Name:</span>{' '}
              <span className="font-medium">{blend.users.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>{' '}
              <span className="font-medium">{blend.users.email}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!blend.products && (
        <div className="flex justify-end">
          <Link
            href={`/admin/blends/${blend.id}/convert`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Convert to Product
          </Link>
        </div>
      )}
    </div>
  );
}
