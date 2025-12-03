'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { THEMES } from '@/lib/themes';
import BottomNavigation from '@/components/BottomNavigation';

export default function AppearancePage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedTableSkin, setSelectedTableSkin] = useState('oak');

  const tableSkins = [
    { id: 'oak', name: 'Oak Wood', emoji: '🪵', unlocked: true },
    { id: 'marble', name: 'Marble', emoji: '⬜', unlocked: true },
    { id: 'crystal', name: 'Crystal', emoji: '💎', unlocked: false },
    { id: 'obsidian', name: 'Obsidian', emoji: '⬛', unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface pb-20">
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-sm border-b border-text-base/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold font-serif text-text-base">Appearance</h1>
          <p className="text-sm text-text-muted mt-1">
            Customize your alchemy experience
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Themes Section */}
        <div>
          <h2 className="text-xl font-bold font-serif text-text-base mb-4">Visual Themes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {THEMES.map((theme) => {
              const isActive = currentTheme === theme.id;
              const isUnlocked = true; // For now, all themes are unlocked
              
              return (
                <button
                  key={theme.id}
                  onClick={() => isUnlocked && setTheme(theme.id)}
                  disabled={!isUnlocked}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'border-accent shadow-lg scale-105 bg-surface'
                      : isUnlocked
                      ? 'border-text-base/20 hover:border-accent/50 bg-surface/50 hover:shadow-lg'
                      : 'border-text-base/10 bg-surface/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Preview swatch */}
                  <div 
                    className="w-full h-32 rounded-lg mb-4"
                    style={{ background: theme.preview }}
                  />
                  
                  <div className="text-4xl mb-2">{theme.emoji}</div>
                  <h3 className="text-xl font-serif text-text-base mb-2">{theme.name}</h3>
                  <p className="text-sm text-text-muted mb-3">{theme.description}</p>
                  
                  {isActive && (
                    <div className="mt-3 text-accent font-semibold">✓ Active</div>
                  )}
                  
                  {!isUnlocked && theme.requiredLevel && (
                    <div className="text-xs text-text-muted mt-2">
                      🔒 Requires Level {theme.requiredLevel}
                    </div>
                  )}
                  
                  {theme.isPremium && !isUnlocked && (
                    <div className="text-xs text-accent mt-2">
                      💎 Premium - {theme.price} coins
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Skins Section */}
        <div>
          <h2 className="text-xl font-bold font-serif text-text-base mb-4">Table Skins</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tableSkins.map((skin) => (
              <button
                key={skin.id}
                onClick={() => skin.unlocked && setSelectedTableSkin(skin.id)}
                disabled={!skin.unlocked}
                className={`p-4 rounded-xl shadow-md transition-all ${
                  selectedTableSkin === skin.id
                    ? 'bg-primary text-white ring-4 ring-accent/30'
                    : skin.unlocked
                    ? 'bg-surface border border-text-base/20 hover:shadow-lg hover:border-accent/50'
                    : 'bg-surface/30 opacity-50 cursor-not-allowed border border-text-base/10'
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
        <div className="bg-surface/80 rounded-xl p-6 shadow-md border border-text-base/10">
          <h3 className="text-lg font-semibold font-serif text-text-base mb-4">Current Selection</h3>
          <div className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-8 min-h-[200px] flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">
                {THEMES.find((t) => t.id === currentTheme)?.emoji}
              </div>
              <div className="text-sm mb-4">
                Theme: {THEMES.find((t) => t.id === currentTheme)?.name}
              </div>
              <div className="text-4xl mb-2">
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
