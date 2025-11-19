'use client';

import BottomNavigation from '@/components/BottomNavigation';

export default function ShopPage() {
  const products = [
    {
      id: '1',
      name: 'Relaxation Blend',
      description: 'Perfect for winding down',
      price: 24.99,
      emoji: '🍵',
    },
    {
      id: '2',
      name: 'Energy Boost',
      description: 'Start your day right',
      price: 29.99,
      emoji: '⚡',
    },
    {
      id: '3',
      name: 'Focus Formula',
      description: 'Enhanced concentration',
      price: 34.99,
      emoji: '🎯',
    },
    {
      id: '4',
      name: 'Sleep Tonic',
      description: 'Peaceful slumber',
      price: 27.99,
      emoji: '🌙',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Shop</h1>
          <p className="text-sm text-gray-600 mt-1">
            Discover magical blends and potions
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="text-6xl mb-4 text-center">{product.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-600">
                    ${product.price}
                  </span>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
