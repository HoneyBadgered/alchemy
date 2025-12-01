'use client';

/**
 * Flavor Profile & Personalization Page
 * 
 * Select flavor preferences and get personalized recommendations
 * with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

const flavorNotes = [
  { id: 'floral', label: 'Floral', icon: '🌸', description: 'Rose, jasmine, lavender' },
  { id: 'fruity', label: 'Fruity', icon: '🍇', description: 'Berry, citrus, tropical' },
  { id: 'earthy', label: 'Earthy', icon: '🌿', description: 'Moss, forest, mushroom' },
  { id: 'spicy', label: 'Spicy', icon: '🌶️', description: 'Cinnamon, ginger, pepper' },
  { id: 'nutty', label: 'Nutty', icon: '🥜', description: 'Almond, hazelnut, walnut' },
  { id: 'herbal', label: 'Herbal', icon: '🌱', description: 'Mint, sage, chamomile' },
  { id: 'sweet', label: 'Sweet', icon: '🍯', description: 'Honey, caramel, vanilla' },
  { id: 'smoky', label: 'Smoky', icon: '🔥', description: 'Campfire, charred, woody' },
  { id: 'bitter', label: 'Bitter', icon: '🍫', description: 'Dark chocolate, coffee' },
  { id: 'umami', label: 'Umami', icon: '🍵', description: 'Savory, deep, rich' },
];

const caffeineOptions = [
  { id: 'none', label: 'Caffeine-Free', icon: '😴', description: 'Herbal & decaf only' },
  { id: 'low', label: 'Low Caffeine', icon: '🌙', description: 'White & green teas' },
  { id: 'moderate', label: 'Moderate', icon: '☀️', description: 'Oolong & light black' },
  { id: 'high', label: 'High Caffeine', icon: '⚡', description: 'Bold black & matcha' },
  { id: 'any', label: 'Any Level', icon: '🌈', description: 'Surprise me!' },
];

const dietaryOptions = [
  { id: 'vegan', label: 'Vegan', icon: '🥬' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'nut_free', label: 'Nut-Free', icon: '🥜' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'organic_only', label: 'Organic Only', icon: '🌿' },
  { id: 'fair_trade', label: 'Fair Trade', icon: '🤝' },
];

function FlavorProfileContent() {
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(['floral', 'sweet', 'herbal']);
  const [caffeineLevel, setCaffeineLevel] = useState<string>('moderate');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['vegan']);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const toggleFlavor = (id: string) => {
    setSelectedFlavors(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
    setMessage(null);
  };

  const toggleDietary = (id: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Your flavor profile has been saved. Recommendations updated!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRecommendations = () => {
    setShowRecommendations(true);
  };

  // Mock recommendations based on preferences
  const recommendations = [
    { name: 'Midnight Garden Blend', match: 95, icon: '🌙' },
    { name: 'Enchanted Forest Oolong', match: 88, icon: '🌲' },
    { name: 'Fairy Dust White Tea', match: 82, icon: '✨' },
    { name: 'Mystic Lavender Dreams', match: 79, icon: '💜' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            Flavor Profile
          </h1>
          <p className="text-purple-200/70 mt-1">Your taste in the arcane arts</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/30 border border-green-600/50 text-green-300' 
              : 'bg-red-900/30 border border-red-600/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Flavor Notes */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-2">Preferred Flavor Notes</h2>
          <p className="text-purple-300/60 text-sm mb-4">Select the flavors that speak to your soul</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {flavorNotes.map((flavor) => (
              <button
                key={flavor.id}
                onClick={() => toggleFlavor(flavor.id)}
                className={`p-4 rounded-xl border transition-all duration-300 text-center ${
                  selectedFlavors.includes(flavor.id)
                    ? 'bg-purple-600/30 border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700/30 border-purple-500/20 hover:border-purple-400/40'
                }`}
              >
                <span className="text-3xl block mb-2">{flavor.icon}</span>
                <span className={`font-medium ${
                  selectedFlavors.includes(flavor.id) ? 'text-purple-200' : 'text-purple-300/70'
                }`}>
                  {flavor.label}
                </span>
                <p className="text-purple-400/50 text-xs mt-1">{flavor.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Caffeine Level */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-2">Caffeine Preference</h2>
          <p className="text-purple-300/60 text-sm mb-4">How much energy do you seek?</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {caffeineOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setCaffeineLevel(option.id)}
                className={`p-4 rounded-xl border transition-all duration-300 text-center ${
                  caffeineLevel === option.id
                    ? 'bg-purple-600/30 border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700/30 border-purple-500/20 hover:border-purple-400/40'
                }`}
              >
                <span className="text-3xl block mb-2">{option.icon}</span>
                <span className={`font-medium text-sm ${
                  caffeineLevel === option.id ? 'text-purple-200' : 'text-purple-300/70'
                }`}>
                  {option.label}
                </span>
                <p className="text-purple-400/50 text-xs mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-2">Dietary & Allergy Notes</h2>
          <p className="text-purple-300/60 text-sm mb-4">Help us find brews that suit your needs</p>
          <div className="flex flex-wrap gap-3">
            {dietaryOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleDietary(option.id)}
                className={`px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-2 ${
                  dietaryRestrictions.includes(option.id)
                    ? 'bg-purple-600/30 border-purple-400/50'
                    : 'bg-slate-700/30 border-purple-500/20 hover:border-purple-400/40'
                }`}
              >
                <span>{option.icon}</span>
                <span className={`font-medium ${
                  dietaryRestrictions.includes(option.id) ? 'text-purple-200' : 'text-purple-300/70'
                }`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-2">Additional Notes</h2>
          <p className="text-purple-300/60 text-sm mb-4">Anything else we should know?</p>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Tell us about specific allergies, dislikes, or preferences..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 transition-colors resize-none h-24"
          />
        </div>

        {/* Save & Generate Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          <button
            onClick={handleGenerateRecommendations}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>✨</span>
            Generate Recommendations
          </button>
        </div>

        {/* Recommendations */}
        {showRecommendations && (
          <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>✨</span>
              Recommended For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => (
                <Link
                  key={index}
                  href="/shop"
                  className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors group"
                >
                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl border border-purple-500/20 group-hover:scale-110 transition-transform">
                    {rec.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium group-hover:text-purple-200 transition-colors">
                      {rec.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                          style={{ width: `${rec.match}%` }}
                        />
                      </div>
                      <span className="text-green-400 text-sm font-medium">{rec.match}% match</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-center text-purple-300/60 text-sm mt-4">
              Based on your flavor profile and past purchases
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-purple-200 font-medium">How We Use This</h3>
              <p className="text-purple-300/60 text-sm mt-1">
                Your flavor profile helps us personalize product recommendations, curate your subscription boxes, 
                and ensure we only suggest items that match your tastes and dietary needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function FlavorProfilePage() {
  return (
    <ProtectedRoute>
      <FlavorProfileContent />
    </ProtectedRoute>
  );
}
