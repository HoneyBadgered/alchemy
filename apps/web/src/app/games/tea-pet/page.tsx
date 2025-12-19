'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

type PetType = 'rabbit' | 'cat' | 'fox';
type Action = 'feed' | 'play' | 'groom';

interface PetStats {
  name: string;
  type: PetType;
  level: number;
  xp: number;
  xpToNextLevel: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  lastFed: number;
  lastPlayed: number;
  lastGroomed: number;
  unlockedPerks: string[];
}

interface Perk {
  id: string;
  name: string;
  description: string;
  levelRequired: number;
  icon: string;
}

const PET_TYPES = {
  rabbit: { emoji: '🐰', name: 'Bunny' },
  cat: { emoji: '🐱', name: 'Kitty' },
  fox: { emoji: '🦊', name: 'Fox' },
};

const PERKS: Perk[] = [
  {
    id: 'faster-brewing',
    name: 'Tea Master',
    description: 'Brewing time reduced by 10%',
    levelRequired: 3,
    icon: '🫖',
  },
  {
    id: 'ingredient-tips',
    name: 'Ingredient Whisperer',
    description: 'Get hints on best ingredient pairings',
    levelRequired: 5,
    icon: '💡',
  },
  {
    id: 'daily-bonus',
    name: 'Lucky Companion',
    description: 'Daily login XP bonus +50%',
    levelRequired: 7,
    icon: '🍀',
  },
];

const COOLDOWNS = {
  feed: 2 * 60 * 60 * 1000, // 2 hours
  play: 3 * 60 * 60 * 1000, // 3 hours
  groom: 4 * 60 * 60 * 1000, // 4 hours
};

export default function TeaPetPage() {
  const [pet, setPet] = useState<PetStats | null>(null);
  const [selectedPetType, setSelectedPetType] = useState<PetType>('rabbit');
  const [petName, setPetName] = useState('');
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Load pet from localStorage
  useEffect(() => {
    const savedPet = localStorage.getItem('teaPet');
    if (savedPet) {
      setPet(JSON.parse(savedPet));
    } else {
      setShowAdoptModal(true);
    }
  }, []);

  // Save pet to localStorage
  useEffect(() => {
    if (pet) {
      localStorage.setItem('teaPet', JSON.stringify(pet));
    }
  }, [pet]);

  const adoptPet = () => {
    if (!petName.trim()) {
      setActionMessage('Please enter a name for your pet!');
      return;
    }

    const newPet: PetStats = {
      name: petName.trim(),
      type: selectedPetType,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      happiness: 80,
      energy: 100,
      cleanliness: 100,
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastGroomed: Date.now(),
      unlockedPerks: [],
    };

    setPet(newPet);
    setShowAdoptModal(false);
    setActionMessage(`Welcome, ${petName}! 🎉`);
  };

  const canPerformAction = (action: Action): boolean => {
    if (!pet) return false;
    
    const now = Date.now();
    const lastActionKey = `last${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof PetStats;
    const lastActionTime = pet[lastActionKey] as number;
    const cooldown = COOLDOWNS[action];
    
    return now - lastActionTime >= cooldown;
  };

  const getCooldownRemaining = (action: Action): string => {
    if (!pet) return '';
    
    const now = Date.now();
    const lastActionKey = `last${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof PetStats;
    const lastActionTime = pet[lastActionKey] as number;
    const cooldown = COOLDOWNS[action];
    const remaining = cooldown - (now - lastActionTime);
    
    if (remaining <= 0) return '';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  };

  const performAction = (action: Action) => {
    if (!pet) return;
    
    if (!canPerformAction(action)) {
      setActionMessage(`Wait ${getCooldownRemaining(action)} before ${action}ing again!`);
      return;
    }

    const xpGain = 20;
    const newXp = pet.xp + xpGain;
    const leveledUp = newXp >= pet.xpToNextLevel;
    
    let updatedPet = { ...pet };
    
    // Apply action effects
    switch (action) {
      case 'feed':
        updatedPet.happiness = Math.min(100, pet.happiness + 15);
        updatedPet.energy = Math.min(100, pet.energy + 25);
        updatedPet.lastFed = Date.now();
        setActionMessage(`${pet.name} enjoyed the tea treats! 🍵`);
        break;
      case 'play':
        updatedPet.happiness = Math.min(100, pet.happiness + 20);
        updatedPet.energy = Math.max(0, pet.energy - 10);
        updatedPet.lastPlayed = Date.now();
        setActionMessage(`${pet.name} had so much fun! 🎉`);
        break;
      case 'groom':
        updatedPet.cleanliness = 100;
        updatedPet.happiness = Math.min(100, pet.happiness + 10);
        updatedPet.lastGroomed = Date.now();
        setActionMessage(`${pet.name} looks beautiful! ✨`);
        break;
    }

    // Handle XP and leveling
    if (leveledUp) {
      updatedPet.level = pet.level + 1;
      updatedPet.xp = newXp - pet.xpToNextLevel;
      updatedPet.xpToNextLevel = Math.floor(pet.xpToNextLevel * 1.5);
      
      // Check for newly unlocked perks
      const newPerks = PERKS.filter(
        perk => perk.levelRequired === updatedPet.level && !pet.unlockedPerks.includes(perk.id)
      );
      
      if (newPerks.length > 0) {
        updatedPet.unlockedPerks = [...pet.unlockedPerks, ...newPerks.map(p => p.id)];
        setActionMessage(`🎊 Level Up! ${pet.name} is now level ${updatedPet.level}! Unlocked: ${newPerks[0].name}`);
      } else {
        setActionMessage(`🎊 Level Up! ${pet.name} is now level ${updatedPet.level}!`);
      }
    } else {
      updatedPet.xp = newXp;
    }

    setPet(updatedPet);

    // Clear message after 3 seconds
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Passive decay over time
  useEffect(() => {
    if (!pet) return;

    const interval = setInterval(() => {
      setPet(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          happiness: Math.max(0, prev.happiness - 0.5),
          energy: Math.max(0, prev.energy - 0.3),
          cleanliness: Math.max(0, prev.cleanliness - 0.2),
        };
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [pet]);

  const getStatColor = (value: number): string => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMoodEmoji = (): string => {
    if (!pet) return '😴';
    if (pet.happiness >= 80) return '😊';
    if (pet.happiness >= 60) return '🙂';
    if (pet.happiness >= 40) return '😐';
    if (pet.happiness >= 20) return '😟';
    return '😢';
  };

  if (showAdoptModal) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-900 to-indigo-950">
        <Header />
        
        <main id="main-content" className="flex-1 pt-20 pb-8 px-4 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl shadow-2xl border-2 border-yellow-600 p-8">
            <h1 className="text-4xl font-bold font-serif text-yellow-400 text-center mb-6">
              🐾 Adopt a Tea Pet Companion
            </h1>
            
            <p className="text-purple-200 text-center mb-8">
              Choose your perfect companion to join you on your tea journey!
            </p>

            {/* Pet Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {(Object.keys(PET_TYPES) as PetType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedPetType(type)}
                  className={`p-6 rounded-xl border-4 transition-all ${
                    selectedPetType === type
                      ? 'border-yellow-400 bg-purple-700 scale-105'
                      : 'border-purple-600 bg-purple-800/50 hover:bg-purple-700'
                  }`}
                >
                  <div className="text-6xl mb-2">{PET_TYPES[type].emoji}</div>
                  <div className="text-white font-bold">{PET_TYPES[type].name}</div>
                </button>
              ))}
            </div>

            {/* Name Input */}
            <div className="mb-8">
              <label className="block text-purple-200 font-bold mb-2">
                Give your pet a name:
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter name..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/50 border-2 border-purple-600 text-white placeholder-purple-400 focus:outline-none focus:border-yellow-400"
              />
            </div>

            {actionMessage && (
              <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 text-center">
                {actionMessage}
              </div>
            )}

            {/* Adopt Button */}
            <button
              onClick={adoptPet}
              className="ornate-button w-full px-8 py-4 text-black font-bold text-xl rounded-lg"
            >
              🎉 Adopt {selectedPetType ? PET_TYPES[selectedPetType].name : 'Pet'}
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/games')}
                className="text-purple-300 hover:text-white transition-colors"
              >
                ← Back to Games
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-900 to-indigo-950">
      <Header />
      
      <main id="main-content" className="flex-1 pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold font-serif text-yellow-400 mb-2">
              🐾 Tea Pet Companion
            </h1>
            <p className="text-purple-200">
              Care for {pet.name} to unlock special perks!
            </p>
          </div>

          {/* Main Pet Display */}
          <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl shadow-2xl border-2 border-yellow-600 p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Pet Avatar */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="text-9xl mb-4 animate-bounce">
                    {PET_TYPES[pet.type].emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 text-4xl">
                    {getMoodEmoji()}
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-1">{pet.name}</h2>
                <p className="text-purple-300">Level {pet.level} {PET_TYPES[pet.type].name}</p>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4">
                {/* XP Progress */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-purple-200 font-bold">Experience</span>
                    <span className="text-purple-300">{pet.xp} / {pet.xpToNextLevel} XP</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                      style={{ width: `${(pet.xp / pet.xpToNextLevel) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Happiness */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-purple-200 font-bold">😊 Happiness</span>
                    <span className="text-purple-300">{Math.round(pet.happiness)}%</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-4 overflow-hidden">
                    <div
                      className={`${getStatColor(pet.happiness)} h-full transition-all duration-500`}
                      style={{ width: `${pet.happiness}%` }}
                    />
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-purple-200 font-bold">⚡ Energy</span>
                    <span className="text-purple-300">{Math.round(pet.energy)}%</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-4 overflow-hidden">
                    <div
                      className={`${getStatColor(pet.energy)} h-full transition-all duration-500`}
                      style={{ width: `${pet.energy}%` }}
                    />
                  </div>
                </div>

                {/* Cleanliness */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-purple-200 font-bold">✨ Cleanliness</span>
                    <span className="text-purple-300">{Math.round(pet.cleanliness)}%</span>
                  </div>
                  <div className="w-full bg-purple-950 rounded-full h-4 overflow-hidden">
                    <div
                      className={`${getStatColor(pet.cleanliness)} h-full transition-all duration-500`}
                      style={{ width: `${pet.cleanliness}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border-2 border-green-500 rounded-lg text-green-200 text-center font-bold animate-pulse">
              {actionMessage}
            </div>
          )}

          {/* Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => performAction('feed')}
              disabled={!canPerformAction('feed')}
              className={`p-6 rounded-xl border-2 transition-all ${
                canPerformAction('feed')
                  ? 'bg-green-600 hover:bg-green-700 border-green-500 hover:scale-105'
                  : 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">🍵</div>
              <h3 className="text-xl font-bold text-white mb-1">Feed Tea Treats</h3>
              <p className="text-sm text-white/80 mb-2">+15 Happiness, +25 Energy</p>
              {!canPerformAction('feed') && (
                <p className="text-xs text-red-300 font-bold">
                  {getCooldownRemaining('feed')}
                </p>
              )}
            </button>

            <button
              onClick={() => performAction('play')}
              disabled={!canPerformAction('play')}
              className={`p-6 rounded-xl border-2 transition-all ${
                canPerformAction('play')
                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 hover:scale-105'
                  : 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">🎾</div>
              <h3 className="text-xl font-bold text-white mb-1">Play Together</h3>
              <p className="text-sm text-white/80 mb-2">+20 Happiness, -10 Energy</p>
              {!canPerformAction('play') && (
                <p className="text-xs text-red-300 font-bold">
                  {getCooldownRemaining('play')}
                </p>
              )}
            </button>

            <button
              onClick={() => performAction('groom')}
              disabled={!canPerformAction('groom')}
              className={`p-6 rounded-xl border-2 transition-all ${
                canPerformAction('groom')
                  ? 'bg-purple-600 hover:bg-purple-700 border-purple-500 hover:scale-105'
                  : 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">🧼</div>
              <h3 className="text-xl font-bold text-white mb-1">Groom & Clean</h3>
              <p className="text-sm text-white/80 mb-2">+10 Happiness, Max Cleanliness</p>
              {!canPerformAction('groom') && (
                <p className="text-xs text-red-300 font-bold">
                  {getCooldownRemaining('groom')}
                </p>
              )}
            </button>
          </div>

          {/* Unlocked Perks */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl border-2 border-yellow-600 p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎁 Perks & Rewards</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PERKS.map((perk) => {
                const isUnlocked = pet.unlockedPerks.includes(perk.id);
                const canUnlock = pet.level >= perk.levelRequired;
                
                return (
                  <div
                    key={perk.id}
                    className={`p-4 rounded-lg border-2 ${
                      isUnlocked
                        ? 'bg-green-900/50 border-green-500'
                        : canUnlock
                        ? 'bg-yellow-900/30 border-yellow-600'
                        : 'bg-gray-800/50 border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{perk.icon}</div>
                    <h3 className="font-bold text-white mb-1">{perk.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{perk.description}</p>
                    <p className="text-xs font-bold">
                      {isUnlocked ? (
                        <span className="text-green-400">✅ Unlocked!</span>
                      ) : (
                        <span className="text-gray-400">Level {perk.levelRequired} Required</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 text-center text-purple-300 text-sm space-y-2">
            <p>💡 Care for your pet regularly to earn XP and unlock perks!</p>
            <p>⏰ Actions have cooldowns - check back often to keep your pet happy!</p>
            {!isAuthenticated && (
              <p className="text-yellow-300">
                🔐 <a href="/account" className="underline">Sign in</a> to sync your pet across devices!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
