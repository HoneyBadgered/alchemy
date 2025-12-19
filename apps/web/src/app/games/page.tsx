'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const games = [
  {
    id: 'forage',
    title: "🌿 Herbalist's Run",
    description: 'Collect magical herbs along an enchanted forest path. Click or tap to gather ingredients as the path speeds up!',
    difficulty: 'Medium',
    xpReward: '5-25 XP per item',
    href: '/games/forage',
    color: 'from-green-600 to-green-800',
    features: ['Progressive difficulty', 'Ingredient collection', 'Mobile-friendly'],
  },
  {
    id: 'pour',
    title: '🫖 Perfect Pour',
    description: 'Fill tea cups to perfection without spilling a drop. Press and hold to pour, release at the perfect moment!',
    difficulty: 'Easy',
    xpReward: '20+ XP per cup',
    href: '/games/pour',
    color: 'from-amber-600 to-amber-800',
    features: ['Timing-based', 'Progressive difficulty', 'Precision gameplay'],
  },
  {
    id: 'potion-mixing',
    title: '🧪 Potion Mixing',
    description: 'Match ingredient sequences in the correct order! Build combos for massive XP bonuses. Recipes get longer as you level up!',
    difficulty: 'Medium',
    xpReward: '30+ XP per match',
    href: '/games/potion-mixing',
    color: 'from-purple-600 to-indigo-800',
    features: ['Puzzle-based', 'Combo system', 'Memory challenge'],
  },
  {
    id: 'tea-pet',
    title: '🐾 Tea Pet Companion',
    description: 'Adopt and care for your tea companion! Feed treats, play together, and groom them to unlock special brewing perks!',
    difficulty: 'Easy',
    xpReward: '20 XP per action',
    href: '/games/tea-pet',
    color: 'from-pink-600 to-rose-800',
    features: ['Virtual pet', 'Unlock perks', 'Daily care'],
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1 pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-gray-900 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold font-serif text-yellow-400 mb-4">
              🎮 Alchemy Games
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Hone your skills, earn XP, and unlock ingredients through mini-games!
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-green-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span>Earn XP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌿</span>
                <span>Collect Ingredients</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span>Compete for High Scores</span>
              </div>
            </div>
          </div>
        </section>

        {/* Games Grid */}
        <section className="py-12 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold font-serif text-center text-yellow-400 mb-10">
              Available Games
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={game.href}
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-600/30 hover:border-yellow-600 transition-all duration-300 hover:scale-105"
                >
                  {/* Game Header */}
                  <div className={`bg-gradient-to-r ${game.color} p-6`}>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {game.title}
                    </h3>
                    <p className="text-white/90">
                      {game.description}
                    </p>
                  </div>

                  {/* Game Info */}
                  <div className="p-6 space-y-4">
                    {/* Stats */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Difficulty</div>
                        <div className="text-lg font-bold text-yellow-400">
                          {game.difficulty}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">XP Rewards</div>
                        <div className="text-lg font-bold text-purple-400">
                          {game.xpReward}
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Features:</div>
                      <div className="flex flex-wrap gap-2">
                        {game.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1 bg-gray-700 rounded-full text-xs text-green-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Play Button */}
                    <div className="pt-4">
                      <div className="ornate-button text-center px-6 py-3 text-black font-bold rounded-lg group-hover:scale-105 transition-transform">
                        🎮 Play Now
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-12 px-4 bg-gray-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-serif text-yellow-400 mb-6">
              🔮 Coming Soon
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-3">🧪</div>
                <h3 className="text-xl font-bold text-white mb-2">Potion Mixing</h3>
                <p className="text-gray-400 text-sm">
                  Match ingredients by color and properties
                </p>
              </div>
              <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Ingredient Matcher</h3>
                <p className="text-gray-400 text-sm">
                  Quick reflexes puzzle game
                </p>
              </div>
              <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-3">⏱️</div>
                <h3 className="text-xl font-bold text-white mb-2">Speed Blend</h3>
                <p className="text-gray-400 text-sm">
                  Create blends against the clock
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rewards Info */}
        <section className="py-12 px-4 bg-gradient-to-b from-purple-950 to-gray-950">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-serif text-yellow-400 mb-6">
              🎁 Game Rewards
            </h2>
            <div className="bg-black/30 border-2 border-yellow-600/30 rounded-xl p-8 space-y-4">
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl">✨</span>
                <p className="text-lg text-purple-200">
                  <strong className="text-yellow-400">Earn XP</strong> to level up your account
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl">🌿</span>
                <p className="text-lg text-purple-200">
                  <strong className="text-green-400">Collect ingredients</strong> for your inventory
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl">🏆</span>
                <p className="text-lg text-purple-200">
                  <strong className="text-blue-400">Complete achievements</strong> for bonus rewards
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  💡 Sign in to save your progress and rewards!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gray-950">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-serif text-yellow-400 mb-4">
              Ready to Play?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start earning XP and collecting ingredients today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/games/forage"
                className="ornate-button inline-flex items-center justify-center px-8 py-4 text-black font-bold text-lg rounded-lg"
              >
                🌿 Play Herbalist's Run
              </Link>
              <Link
                href="/games/pour"
                className="ornate-button-outline inline-flex items-center justify-center px-8 py-4 text-yellow-400 font-bold text-lg rounded-lg border-2 border-yellow-600 hover:bg-yellow-600/20"
              >
                🫖 Play Perfect Pour
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
