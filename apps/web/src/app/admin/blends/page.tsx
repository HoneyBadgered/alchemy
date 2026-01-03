'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Blend {
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
  baseTea?: {
    id: string;
    name: string;
    category: string;
  } | null;
  addInsWithDetails?: Array<{
    ingredientId: string;
    quantity: number;
    name: string;
    category: string;
  }>;
}

interface BlendsResponse {
  blends: Blend[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminBlendsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [blends, setBlends] = useState<Blend[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'products' | 'user' | 'all'>('products');

  const fetchBlends = async (page = 1, filterValue = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '20',
      });
      
      // Apply filter based on selection
      if (filterValue === 'products') {
        params.append('hasProduct', 'true');
      } else if (filterValue === 'user') {
        params.append('hasProduct', 'false');
      }
      // 'all' doesn't add any hasProduct filter

      const response = await fetch(`http://localhost:3000/admin/blends?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to fetch blends:', response.status, errorData);
        throw new Error('Failed to fetch blends');
      }

      const data: BlendsResponse = await response.json();
      setBlends(data.blends);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching blends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchBlends();
    }
  }, [accessToken]);

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    fetchBlends(1, newFilter);
  };

  const handlePageChange = (newPage: number) => {
    fetchBlends(newPage);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blend Management</h1>
          <p className="text-gray-600 mt-1">
            Create products from custom blends
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/blends/bulk-import"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Bulk Import
          </Link>
          <Link
            href="/admin/blends/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Blend Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => handleFilterChange('products')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => handleFilterChange('user')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          User Blends
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
      </div>

      {/* Blends Table */}
      {loading ? (
        <div className="text-center py-8">Loading blends...</div>
      ) : blends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No blends found
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blend Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blends.map((blend) => (
                  <tr key={blend.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {blend.name || 'Unnamed Blend'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium text-gray-700 mb-1">
                          {blend.baseTea?.name || 'Unknown Base Tea'}
                        </div>
                        {blend.addInsWithDetails && blend.addInsWithDetails.length > 0 && (
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {blend.addInsWithDetails.map((addIn, idx) => (
                              <div key={addIn.ingredientId}>
                                + {addIn.name} ({addIn.quantity}g)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blend.products ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Product
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {blend.products.name}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Converted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(blend.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/blends/${blend.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      {!blend.products && (
                        <Link
                          href={`/admin/blends/${blend.id}/convert`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Convert to Product
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total} blends
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
