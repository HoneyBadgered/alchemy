'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

interface Ingredient {
  id: string;
  x: number;
  y: number;
  size: number;
  emoji: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  points: number;
}

interface GameStats {
  score: number;
  collected: number;
  missed: number;
  xpEarned: number;
  ingredientsEarned: Record<string, number>;
}

const INGREDIENT_TYPES = [
  { emoji: '🌿', name: 'Mint', rarity: 'common' as const, points: 10, xp: 5 },
  { emoji: '🍃', name: 'Tea Leaf', rarity: 'common' as const, points: 10, xp: 5 },
  { emoji: '🌸', name: 'Hibiscus', rarity: 'common' as const, points: 15, xp: 7 },
  { emoji: '🌺', name: 'Rose', rarity: 'rare' as const, points: 25, xp: 12 },
  { emoji: '🍄', name: 'Mushroom', rarity: 'rare' as const, points: 30, xp: 15 },
  { emoji: '✨', name: 'Stardust', rarity: 'legendary' as const, points: 50, xp: 25 },
  { emoji: '🌙', name: 'Moonflower', rarity: 'legendary' as const, points: 50, xp: 25 },
];

export default function ForagePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const ingredientsRef = useRef<Ingredient[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const speedRef = useRef<number>(2);
  const spawnRateRef = useRef<number>(1200);
  const startTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    collected: 0,
    missed: 0,
    xpEarned: 0,
    ingredientsEarned: {},
  });
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize timing
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
      lastSpawnRef.current = performance.now();
    }

    const gameLoop = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw forest background
      drawBackground(ctx, canvas.width, canvas.height, elapsed);

      // Increase difficulty over time
      speedRef.current = 2 + elapsed / 20000; // Speed increases gradually
      spawnRateRef.current = Math.max(400, 1200 - elapsed / 50); // Spawn rate increases

      // Spawn new ingredients
      if (timestamp - lastSpawnRef.current > spawnRateRef.current) {
        spawnIngredient(canvas.width, canvas.height);
        lastSpawnRef.current = timestamp;
      }

      // Update and draw ingredients
      const ingredients = ingredientsRef.current;
      for (let i = ingredients.length - 1; i >= 0; i--) {
        const ingredient = ingredients[i];
        
        // Move ingredient down (path scrolling effect)
        ingredient.y += speedRef.current;

        // Draw ingredient with glow effect
        drawIngredient(ctx, ingredient);

        // Remove if off screen (missed)
        if (ingredient.y > canvas.height + 50) {
          ingredients.splice(i, 1);
          setStats(prev => ({
            ...prev,
            missed: prev.missed + 1,
          }));
        }
      }

      // Check fail condition (more than 30% missed)
      const total = stats.collected + stats.missed;
      if (total > 10 && stats.missed / total > 0.3) {
        setGameState('gameover');
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, stats.collected, stats.missed]);

  // Handle clicks/taps
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check collision with ingredients
    const ingredients = ingredientsRef.current;
    for (let i = ingredients.length - 1; i >= 0; i--) {
      const ingredient = ingredients[i];
      const distance = Math.sqrt(
        Math.pow(x - ingredient.x, 2) + Math.pow(y - ingredient.y, 2)
      );

      // Increased clickable area (1.8x the visual size)
      if (distance < ingredient.size * 1.8) {
        // Collected!
        const ingredientType = INGREDIENT_TYPES.find(t => t.emoji === ingredient.emoji);
        
        setStats(prev => ({
          score: prev.score + ingredient.points,
          collected: prev.collected + 1,
          missed: prev.missed,
          xpEarned: prev.xpEarned + (ingredientType?.xp || 0),
          ingredientsEarned: {
            ...prev.ingredientsEarned,
            [ingredient.name]: (prev.ingredientsEarned[ingredient.name] || 0) + 1,
          },
        }));

        ingredients.splice(i, 1);
        
        // Visual feedback (particle effect could be added)
        break;
      }
    }
  };

  const spawnIngredient = (width: number, height: number) => {
    // Rarity-based spawning (70% common, 25% rare, 5% legendary)
    const rand = Math.random();
    let type;
    if (rand < 0.7) {
      // Common (first 3 items)
      type = INGREDIENT_TYPES[Math.floor(Math.random() * 3)];
    } else if (rand < 0.95) {
      // Rare (items 3-4)
      type = INGREDIENT_TYPES[3 + Math.floor(Math.random() * 2)];
    } else {
      // Legendary (items 5-6)
      type = INGREDIENT_TYPES[5 + Math.floor(Math.random() * 2)];
    }
    
    ingredientsRef.current.push({
      id: Math.random().toString(36),
      x: Math.random() * (width - 100) + 50,
      y: -50,
      size: 30,
      emoji: type.emoji,
      name: type.name,
      rarity: type.rarity,
      points: type.points,
    });
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number) => {
    // Gradient background (forest path)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a3a2e');
    gradient.addColorStop(0.5, '#2d5a3d');
    gradient.addColorStop(1, '#1a3a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw path lines (animated)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 2;
    const offset = (elapsed / 20) % 50;
    
    for (let i = -50; i < height + 50; i += 50) {
      ctx.beginPath();
      ctx.moveTo(width * 0.3, i + offset);
      ctx.lineTo(width * 0.3, i + 30 + offset);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(width * 0.7, i + offset);
      ctx.lineTo(width * 0.7, i + 30 + offset);
      ctx.stroke();
    }
  };

  const drawIngredient = (ctx: CanvasRenderingContext2D, ingredient: Ingredient) => {
    // Glow effect based on rarity
    const glowColors = {
      common: 'rgba(144, 238, 144, 0.4)',
      rare: 'rgba(147, 112, 219, 0.5)',
      legendary: 'rgba(255, 215, 0, 0.6)',
    };

    ctx.shadowBlur = 20;
    ctx.shadowColor = glowColors[ingredient.rarity];

    // Draw emoji
    ctx.font = `${ingredient.size * 1.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredient.emoji, ingredient.x, ingredient.y);

    ctx.shadowBlur = 0;
  };

  const startGame = () => {
    ingredientsRef.current = [];
    speedRef.current = 2;
    spawnRateRef.current = 1200;
    startTimeRef.current = 0;
    lastSpawnRef.current = 0;
    setStats({
      score: 0,
      collected: 0,
      missed: 0,
      xpEarned: 0,
      ingredientsEarned: {},
    });
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const quitGame = () => {
    setGameState('menu');
    ingredientsRef.current = [];
  };

  const collectionRate = stats.collected + stats.missed > 0
    ? Math.round((stats.collected / (stats.collected + stats.missed)) * 100)
    : 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-900 to-green-950">
      <Header />
      
      <main id="main-content" className="flex-1 pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Game Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold font-serif text-yellow-400 mb-2">
              🌿 Herbalist&apos;s Run
            </h1>
            <p className="text-green-100">
              Forage magical herbs along the enchanted forest path
            </p>
          </div>

          {/* Game Canvas Container */}
          <div className="relative bg-gradient-to-b from-green-900 to-green-950 rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-600">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasClick}
              className="w-full h-[500px] cursor-pointer touch-none"
              style={{ touchAction: 'none' }}
            />

            {/* HUD Overlay (during gameplay) */}
            {gameState === 'playing' && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-yellow-400 font-bold text-xl">
                    Score: {stats.score}
                  </div>
                  <div className="text-green-300 text-sm">
                    Collected: {stats.collected} | Missed: {stats.missed}
                  </div>
                  <div className="text-blue-300 text-sm">
                    Success Rate: {collectionRate}%
                  </div>
                </div>
                
                <button
                  onClick={pauseGame}
                  className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-black/80 transition-colors pointer-events-auto"
                >
                  ⏸ Pause
                </button>
              </div>
            )}

            {/* Menu Overlay */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md">
                  <h2 className="text-3xl font-bold mb-4 text-yellow-400">How to Play</h2>
                  <div className="text-left space-y-3 mb-6 text-green-100">
                    <p>🖱️ <strong>Click or tap</strong> to collect herbs as they appear</p>
                    <p>⚡ The path <strong>speeds up</strong> over time</p>
                    <p>✅ Collect at least <strong>70%</strong> of ingredients to survive</p>
                    <p>🎁 Earn <strong>XP and ingredients</strong> for your inventory</p>
                  </div>
                  
                  <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-2xl">🌿</span>
                      <span className="text-green-300">Common (10pts)</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-2xl">🌺</span>
                      <span className="text-purple-300">Rare (25pts)</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-2xl">✨</span>
                      <span className="text-yellow-300">Legendary (50pts)</span>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full mb-3"
                  >
                    🌲 Start Foraging
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Home
                  </button>
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <h2 className="text-3xl font-bold mb-6 text-yellow-400">⏸ Paused</h2>
                  <div className="space-y-3">
                    <button
                      onClick={resumeGame}
                      className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full"
                    >
                      ▶ Resume
                    </button>
                    <button
                      onClick={quitGame}
                      className="bg-gray-700 hover:bg-gray-600 px-8 py-3 text-white font-bold rounded-lg w-full transition-colors"
                    >
                      🏠 Quit to Menu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md">
                  <h2 className="text-4xl font-bold mb-4 text-red-400">Game Over!</h2>
                  <p className="text-gray-300 mb-6">You missed too many herbs!</p>
                  
                  <div className="bg-green-900/50 rounded-lg p-6 mb-6 space-y-3">
                    <div className="text-2xl font-bold text-yellow-400">
                      Final Score: {stats.score}
                    </div>
                    <div className="text-lg text-green-300">
                      🌿 Collected: {stats.collected}
                    </div>
                    <div className="text-lg text-red-300">
                      ❌ Missed: {stats.missed}
                    </div>
                    <div className="text-lg text-blue-300">
                      ✨ Success Rate: {collectionRate}%
                    </div>
                    {isAuthenticated && (
                      <div className="text-lg text-purple-300 pt-3 border-t border-white/20">
                        🎁 XP Earned: {stats.xpEarned}
                      </div>
                    )}
                  </div>

                  {Object.keys(stats.ingredientsEarned).length > 0 && (
                    <div className="bg-yellow-900/30 rounded-lg p-4 mb-6">
                      <h3 className="font-bold mb-2 text-yellow-400">Ingredients Collected:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(stats.ingredientsEarned).map(([name, count]) => (
                          <div key={name} className="text-green-200">
                            {name}: {count}x
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={startGame}
                      className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full"
                    >
                      🔄 Try Again
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-gray-700 hover:bg-gray-600 px-8 py-3 text-white font-bold rounded-lg w-full transition-colors"
                    >
                      🏠 Back to Home
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Below Canvas */}
          <div className="mt-6 text-center text-green-200 text-sm">
            <p>💡 Tip: Legendary ingredients (✨🌙) are worth more points and XP!</p>
            {!isAuthenticated && (
              <p className="mt-2 text-yellow-300">
                🔐 <a href="/account" className="underline">Sign in</a> to save your XP and ingredients!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
