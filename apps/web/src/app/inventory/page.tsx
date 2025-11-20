'use client';

import BottomNavigation from '@/components/BottomNavigation';

export default function InventoryPage() {
  const inventoryItems = [
    { id: '1', name: 'Lavender', emoji: '🌸', quantity: 12 },
    { id: '2', name: 'Chamomile', emoji: '🌼', quantity: 8 },
    { id: '3', name: 'Mint', emoji: '🌿', quantity: 15 },
    { id: '4', name: 'Rose', emoji: '🌹', quantity: 5 },
    { id: '5', name: 'Healing Potion', emoji: '🧪', quantity: 3 },
    { id: '6', name: 'Calming Blend', emoji: '☕', quantity: 2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Inventory</h1>
          <p className="text-sm text-gray-600 mt-1">
            {inventoryItems.length} items
          </p>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl mb-2 text-center">{item.emoji}</div>
              <div className="text-center">
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                <div className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                  ×{item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>

        {inventoryItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Your inventory is empty</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
