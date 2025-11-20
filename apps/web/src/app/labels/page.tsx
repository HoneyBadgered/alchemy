'use client';

import { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';

export default function LabelsPage() {
  const [customName, setCustomName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('elegant');
  const [selectedTone, setSelectedTone] = useState('professional');

  const styles = [
    { id: 'elegant', name: 'Elegant', emoji: '✨' },
    { id: 'rustic', name: 'Rustic', emoji: '🌿' },
    { id: 'modern', name: 'Modern', emoji: '🎨' },
    { id: 'mystical', name: 'Mystical', emoji: '🔮' },
  ];

  const tones = [
    { id: 'professional', name: 'Professional' },
    { id: 'playful', name: 'Playful' },
    { id: 'poetic', name: 'Poetic' },
    { id: 'mysterious', name: 'Mysterious' },
  ];

  const handleGenerate = () => {
    // This would call the API to generate a custom label
    console.log('Generating label with:', { customName, selectedStyle, selectedTone });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-pink-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Label Studio</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create custom labels for your blends
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Label Name Input */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <label className="block text-sm font-semibold mb-2">
            Custom Name (Optional)
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g., Moonlight Serenity"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Style Selection */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-semibold mb-4">Style</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedStyle === style.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div className="text-xs font-medium">{style.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-semibold mb-4">Tone</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTone === tone.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-xs font-medium">{tone.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold shadow-md transition-colors"
        >
          Generate Custom Label
        </button>

        {/* Preview Area */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-semibold mb-4">Preview</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
            <div className="text-gray-400">
              <div className="text-4xl mb-2">🏷️</div>
              <p className="text-sm">Your custom label will appear here</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
