'use client';

import { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';

export default function TablePage() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const ingredients = [
    { id: '1', name: 'Lavender', emoji: '🌸' },
    { id: '2', name: 'Chamomile', emoji: '🌼' },
    { id: '3', name: 'Mint', emoji: '🌿' },
    { id: '4', name: 'Rose', emoji: '🌹' },
  ];

  const handleIngredientClick = (id: string) => {
    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== id));
    } else if (selectedIngredients.length < 3) {
      setSelectedIngredients([...selectedIngredients, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">The Alchemy Table</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-sm">
              <span className="font-semibold">Level:</span> 1
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <div className="text-sm">30 XP</div>
          </div>
        </div>
      </div>

      {/* Main Alchemy Table */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-3xl p-8 shadow-xl">
          <div className="bg-amber-800/50 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center">
            <h2 className="text-white text-xl mb-4">Cauldron</h2>
            <div className="bg-purple-900/30 rounded-full w-48 h-48 flex items-center justify-center border-4 border-purple-500/50">
              {selectedIngredients.length === 0 ? (
                <p className="text-white/70 text-sm text-center px-4">
                  Select ingredients to craft
                </p>
              ) : (
                <div className="flex gap-2 text-4xl">
                  {selectedIngredients.map((id) => {
                    const ingredient = ingredients.find((i) => i.id === id);
                    return <span key={id}>{ingredient?.emoji}</span>;
                  })}
                </div>
              )}
            </div>
            {selectedIngredients.length > 0 && (
              <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                Craft Blend ({selectedIngredients.length} ingredients)
              </button>
            )}
          </div>
        </div>

        {/* Available Ingredients */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Available Ingredients</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ingredients.map((ingredient) => {
              const isSelected = selectedIngredients.includes(ingredient.id);
              return (
                <button
                  key={ingredient.id}
                  onClick={() => handleIngredientClick(ingredient.id)}
                  className={`p-4 rounded-xl shadow-md transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white scale-95'
                      : 'bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="text-4xl mb-2">{ingredient.emoji}</div>
                  <div className="font-medium">{ingredient.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
