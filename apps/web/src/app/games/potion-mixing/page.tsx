'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

interface Ingredient {
  id: string;
  x: number;
  y: number;
  color: string;
  type: 'fire' | 'water' | 'earth' | 'air';
  size: number;
  velocityX: number;
  velocityY: number;
  emoji: string;
}

interface GameStats {
  score: number;
  matches: number;
  combosCompleted: number;
  xpEarned: number;
  level: number;
}

const INGREDIENT_TYPES = [
  { type: 'fire' as const, color: '#FF4500', emoji: '🔥', name: 'Fire Essence' },
  { type: 'water' as const, color: '#1E90FF', emoji: '💧', name: 'Water Essence' },
  { type: 'earth' as const, color: '#8B4513', emoji: '🌱', name: 'Earth Essence' },
  { type: 'air' as const, color: '#B0C4DE', emoji: '💨', name: 'Air Essence' },
];

export default function PotionMixingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const ingredientsRef = useRef<Ingredient[]>([]);
  const selectedRef = useRef<Ingredient | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const spawnRateRef = useRef<number>(2000);
  const startTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    matches: 0,
    combosCompleted: 0,
    xpEarned: 0,
    level: 1,
  });
  const [targetRecipe, setTargetRecipe] = useState<string[]>([]);
  const [currentMix, setCurrentMix] = useState<string[]>([]);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, []);

  // Generate random recipe
  const generateRecipe = (level: number) => {
    const recipeLength = Math.min(2 + Math.floor(level / 3), 5);
    const recipe: string[] = [];
    for (let i = 0; i < recipeLength; i++) {
      const randomType = INGREDIENT_TYPES[Math.floor(Math.random() * INGREDIENT_TYPES.length)];
      recipe.push(randomType.type);
    }
    return recipe;
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
      lastSpawnRef.current = performance.now();
      setTargetRecipe(generateRecipe(stats.level));
    }

    const gameLoop = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);

      // Spawn new ingredients
      if (timestamp - lastSpawnRef.current > spawnRateRef.current) {
        spawnIngredient(canvas.width, canvas.height);
        lastSpawnRef.current = timestamp;
      }

      // Update and draw ingredients
      const ingredients = ingredientsRef.current;
      for (let i = ingredients.length - 1; i >= 0; i--) {
        const ingredient = ingredients[i];
        
        // Update position
        ingredient.x += ingredient.velocityX;
        ingredient.y += ingredient.velocityY;

        // Bounce off walls
        if (ingredient.x <= ingredient.size || ingredient.x >= canvas.width - ingredient.size) {
          ingredient.velocityX *= -1;
          ingredient.x = Math.max(ingredient.size, Math.min(canvas.width - ingredient.size, ingredient.x));
        }
        if (ingredient.y <= ingredient.size || ingredient.y >= canvas.height - ingredient.size) {
          ingredient.velocityY *= -1;
          ingredient.y = Math.max(ingredient.size, Math.min(canvas.height - ingredient.size, ingredient.y));
        }

        // Draw ingredient
        drawIngredient(ctx, ingredient, ingredient === selectedRef.current);
      }

      // Draw cauldron
      drawCauldron(ctx, canvas.width, canvas.height);

      // Draw current mix
      drawCurrentMix(ctx, canvas.width, canvas.height);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, stats.level]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawIngredient = (ctx: CanvasRenderingContext2D, ingredient: Ingredient, isSelected: boolean) => {
    // Glow effect
    if (isSelected) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = ingredient.color;
    } else {
      ctx.shadowBlur = 15;
      ctx.shadowColor = ingredient.color;
    }

    // Draw circle background
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(ingredient.x, ingredient.y, ingredient.size, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw emoji
    ctx.font = `${ingredient.size * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ingredient.emoji, ingredient.x, ingredient.y);
  };

  const drawCauldron = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cauldronX = width / 2;
    const cauldronY = height - 80;
    const cauldronWidth = 120;
    const cauldronHeight = 80;

    // Cauldron body
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.ellipse(cauldronX, cauldronY, cauldronWidth / 2, cauldronHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1C2833';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cauldron rim
    ctx.fillStyle = '#34495E';
    ctx.fillRect(cauldronX - cauldronWidth / 2, cauldronY - cauldronHeight / 2 - 10, cauldronWidth, 10);

    // Bubbling effect if mix has ingredients
    if (currentMix.length > 0) {
      ctx.fillStyle = 'rgba(138, 43, 226, 0.6)';
      for (let i = 0; i < 5; i++) {
        const bubbleX = cauldronX + (Math.random() - 0.5) * 80;
        const bubbleY = cauldronY + (Math.random() - 0.5) * 40;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 3 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawCurrentMix = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const startX = width / 2 - (currentMix.length * 40) / 2;
    const y = height - 150;

    currentMix.forEach((type, index) => {
      const ingredientType = INGREDIENT_TYPES.find(t => t.type === type);
      if (!ingredientType) return;

      const x = startX + index * 40;
      
      ctx.fillStyle = ingredientType.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ingredientType.color;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ingredientType.emoji, x, y);
    });
  };

  const spawnIngredient = (width: number, height: number) => {
    const type = INGREDIENT_TYPES[Math.floor(Math.random() * INGREDIENT_TYPES.length)];
    const size = 25;
    const margin = size + 10;
    
    ingredientsRef.current.push({
      id: Math.random().toString(36),
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2 - 200),
      color: type.color,
      type: type.type,
      size,
      velocityX: (Math.random() - 0.5) * 2,
      velocityY: (Math.random() - 0.5) * 2,
      emoji: type.emoji,
    });
  };

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

    // Check if clicked on ingredient
    const ingredients = ingredientsRef.current;
    for (let i = ingredients.length - 1; i >= 0; i--) {
      const ingredient = ingredients[i];
      const distance = Math.sqrt(
        Math.pow(x - ingredient.x, 2) + Math.pow(y - ingredient.y, 2)
      );

      if (distance < ingredient.size * 1.5) {
        // Add to cauldron
        const newMix = [...currentMix, ingredient.type];
        setCurrentMix(newMix);
        ingredients.splice(i, 1);

        // Check if recipe is complete
        if (newMix.length === targetRecipe.length) {
          checkRecipe(newMix);
        }
        break;
      }
    }
  };

  const checkRecipe = (mix: string[]) => {
    const isMatch = mix.every((type, index) => type === targetRecipe[index]);

    if (isMatch) {
      // Success!
      const points = 100 * comboMultiplier * stats.level;
      const xp = 30 * comboMultiplier;
      
      setStats(prev => ({
        score: prev.score + points,
        matches: prev.matches + 1,
        combosCompleted: prev.combosCompleted + 1,
        xpEarned: prev.xpEarned + xp,
        level: prev.level + (prev.matches % 5 === 4 ? 1 : 0),
      }));

      setComboMultiplier(prev => prev + 0.5);
      setCurrentMix([]);
      setTargetRecipe(generateRecipe(stats.level + (stats.matches % 5 === 4 ? 1 : 0)));
      spawnRateRef.current = Math.max(800, spawnRateRef.current - 50);
    } else {
      // Failed - reset combo
      setComboMultiplier(1);
      setCurrentMix([]);
      
      // Lose a life or end game
      if (stats.matches > 0) {
        setStats(prev => ({
          ...prev,
          score: Math.max(0, prev.score - 50),
        }));
      } else {
        setGameState('gameover');
      }
    }
  };

  const clearMix = () => {
    setCurrentMix([]);
  };

  const startGame = () => {
    ingredientsRef.current = [];
    startTimeRef.current = 0;
    lastSpawnRef.current = 0;
    spawnRateRef.current = 2000;
    setCurrentMix([]);
    setComboMultiplier(1);
    setStats({
      score: 0,
      matches: 0,
      combosCompleted: 0,
      xpEarned: 0,
      level: 1,
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-900 to-purple-950">
      <Header />
      
      <main id="main-content" className="flex-1 pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Game Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold font-serif text-yellow-400 mb-2">
              🧪 Potion Mixing
            </h1>
            <p className="text-purple-200">
              Match the recipe by collecting floating ingredients!
            </p>
          </div>

          {/* Game Canvas Container */}
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-600">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasClick}
              className="w-full h-[500px] cursor-pointer touch-none"
              style={{ touchAction: 'none' }}
            />

            {/* HUD Overlay (during gameplay) */}
            {gameState === 'playing' && (
              <div className="absolute top-4 left-4 right-4 pointer-events-none">
                <div className="flex justify-between items-start">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
                    <div className="text-yellow-400 font-bold text-xl mb-1">
                      Score: {stats.score}
                    </div>
                    <div className="text-purple-300 text-sm">
                      Level {stats.level} | Combo: {comboMultiplier}x
                    </div>
                    <div className="text-green-300 text-sm">
                      Matches: {stats.matches}
                    </div>
                  </div>

                  <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
                    <div className="text-white font-bold mb-2">Target Recipe:</div>
                    <div className="flex gap-2">
                      {targetRecipe.map((type, index) => {
                        const ingredientType = INGREDIENT_TYPES.find(t => t.type === type);
                        return (
                          <span key={index} className="text-2xl">
                            {ingredientType?.emoji}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pointer-events-auto">
                    <button
                      onClick={clearMix}
                      className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white text-sm font-bold transition-colors"
                    >
                      🗑️ Clear
                    </button>
                    <button
                      onClick={pauseGame}
                      className="bg-black/60 hover:bg-black/80 px-3 py-2 rounded text-white text-sm font-bold transition-colors"
                    >
                      ⏸
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Overlay */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md">
                  <h2 className="text-3xl font-bold mb-4 text-purple-400">How to Play</h2>
                  <div className="text-left space-y-3 mb-6 text-purple-200">
                    <p>🧪 <strong>Click ingredients</strong> to add them to your cauldron</p>
                    <p>📜 <strong>Match the recipe</strong> shown at the top right</p>
                    <p>✨ <strong>Order matters!</strong> Get the sequence right</p>
                    <p>🔥 Wrong recipes break your combo multiplier</p>
                    <p>⚡ Level up every 5 matches for harder recipes</p>
                  </div>
                  
                  <div className="mb-6 space-y-2 bg-purple-900/30 rounded-lg p-4">
                    <h3 className="font-bold text-yellow-400 mb-2">Ingredients:</h3>
                    {INGREDIENT_TYPES.map((type) => (
                      <div key={type.type} className="flex items-center gap-3 text-sm">
                        <span className="text-2xl">{type.emoji}</span>
                        <span>{type.name}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startGame}
                    className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full mb-3"
                  >
                    🧙 Start Mixing
                  </button>
                  
                  <button
                    onClick={() => router.push('/games')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Games
                  </button>
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <h2 className="text-3xl font-bold mb-6 text-purple-400">⏸ Paused</h2>
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
                  <h2 className="text-4xl font-bold mb-4 text-purple-400">Game Over!</h2>
                  <p className="text-gray-300 mb-6">You created an incorrect potion!</p>
                  
                  <div className="bg-purple-900/50 rounded-lg p-6 mb-6 space-y-3">
                    <div className="text-2xl font-bold text-yellow-400">
                      Final Score: {stats.score}
                    </div>
                    <div className="text-lg text-green-300">
                      ✅ Potions Made: {stats.matches}
                    </div>
                    <div className="text-lg text-blue-300">
                      🏆 Max Level: {stats.level}
                    </div>
                    <div className="text-lg text-purple-300">
                      ⚡ Max Combo: {Math.floor(comboMultiplier * 10) / 10}x
                    </div>
                    {isAuthenticated && (
                      <div className="text-lg text-pink-300 pt-3 border-t border-white/20">
                        🎁 XP Earned: {stats.xpEarned}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={startGame}
                      className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full"
                    >
                      🔄 Try Again
                    </button>
                    <button
                      onClick={() => router.push('/games')}
                      className="bg-gray-700 hover:bg-gray-600 px-8 py-3 text-white font-bold rounded-lg w-full transition-colors"
                    >
                      🏠 Back to Games
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Below Canvas */}
          <div className="mt-6 text-center text-purple-200 text-sm">
            <p>💡 Tip: Click the Clear button if you make a mistake before completing the recipe!</p>
            {!isAuthenticated && (
              <p className="mt-2 text-yellow-300">
                🔐 <a href="/account" className="underline">Sign in</a> to save your XP!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
