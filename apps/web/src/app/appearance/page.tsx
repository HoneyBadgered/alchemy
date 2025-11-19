'use client';

import { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';

export default function AppearancePage() {
  const [selectedTheme, setSelectedTheme] = useState('cozy');
  const [selectedTableSkin, setSelectedTableSkin] = useState('oak');

  const themes = [
    { id: 'cozy', name: 'Cozy Forest', emoji: '🌲', unlocked: true },
    { id: 'mystical', name: 'Mystical Cave', emoji: '✨', unlocked: true },
    { id: 'celestial', name: 'Celestial Sky', emoji: '🌟', unlocked: false },
    { id: 'volcanic', name: 'Volcanic Forge', emoji: '🔥', unlocked: false },
  ];

  const tableSkins = [
    { id: 'oak', name: 'Oak Wood', emoji: '🪵', unlocked: true },
    { id: 'marble', name: 'Marble', emoji: '⬜', unlocked: true },
    { id: 'crystal', name: 'Crystal', emoji: '💎', unlocked: false },
    { id: 'obsidian', name: 'Obsidian', emoji: '⬛', unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-900">Appearance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Customize your alchemy experience
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Themes Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Background Themes</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => theme.unlocked && setSelectedTheme(theme.id)}
                disabled={!theme.unlocked}
                className={`p-4 rounded-xl shadow-md transition-all ${
                  selectedTheme === theme.id
                    ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                    : theme.unlocked
                    ? 'bg-white hover:shadow-lg'
                    : 'bg-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-4xl mb-2">{theme.emoji}</div>
                <div className="font-medium text-sm">{theme.name}</div>
                {!theme.unlocked && (
                  <div className="text-xs mt-1 opacity-70">🔒 Locked</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table Skins Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Table Skins</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tableSkins.map((skin) => (
              <button
                key={skin.id}
                onClick={() => skin.unlocked && setSelectedTableSkin(skin.id)}
                disabled={!skin.unlocked}
                className={`p-4 rounded-xl shadow-md transition-all ${
                  selectedTableSkin === skin.id
                    ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                    : skin.unlocked
                    ? 'bg-white hover:shadow-lg'
                    : 'bg-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-4xl mb-2">{skin.emoji}</div>
                <div className="font-medium text-sm">{skin.name}</div>
                {!skin.unlocked && (
                  <div className="text-xs mt-1 opacity-70">🔒 Locked</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">
                {themes.find((t) => t.id === selectedTheme)?.emoji}
              </div>
              <div className="text-sm">
                Theme: {themes.find((t) => t.id === selectedTheme)?.name}
              </div>
              <div className="text-4xl mt-4 mb-2">
                {tableSkins.find((s) => s.id === selectedTableSkin)?.emoji}
              </div>
              <div className="text-sm">
                Table: {tableSkins.find((s) => s.id === selectedTableSkin)?.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
