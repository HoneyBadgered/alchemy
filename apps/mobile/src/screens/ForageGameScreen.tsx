import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Canvas, Group, Text as SkiaText, useFont, Circle } from '@shopify/react-native-skia';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const GAME_HEIGHT = screenHeight * 0.65;

export default function ForageGameScreen({ navigation }: any) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    collected: 0,
    missed: 0,
    xpEarned: 0,
    ingredientsEarned: {},
  });

  const ingredientsRef = useRef<Ingredient[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const speedRef = useRef<number>(2);
  const spawnRateRef = useRef<number>(1200);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = Date.now();

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
        lastSpawnRef.current = now;
      }

      const elapsed = now - startTimeRef.current;

      // Increase difficulty over time
      speedRef.current = 2 + elapsed / 20000;
      spawnRateRef.current = Math.max(400, 1200 - elapsed / 50);

      // Spawn new ingredients
      if (now - lastSpawnRef.current > spawnRateRef.current) {
        spawnIngredient();
        lastSpawnRef.current = now;
      }

      // Update ingredients
      const ingredients = ingredientsRef.current;
      for (let i = ingredients.length - 1; i >= 0; i--) {
        const ingredient = ingredients[i];
        ingredient.y += speedRef.current;

        // Remove if off screen (missed)
        if (ingredient.y > GAME_HEIGHT + 50) {
          ingredients.splice(i, 1);
          setStats(prev => ({
            ...prev,
            missed: prev.missed + 1,
          }));
        }
      }

      // Force re-render
      setStats(prev => ({ ...prev }));

      // Check fail condition
      const total = stats.collected + stats.missed;
      if (total > 10 && stats.missed / total > 0.3) {
        setGameState('gameover');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, stats.collected, stats.missed]);

  const spawnIngredient = () => {
    const rand = Math.random();
    let type;
    if (rand < 0.7) {
      type = INGREDIENT_TYPES[Math.floor(Math.random() * 3)];
    } else if (rand < 0.95) {
      type = INGREDIENT_TYPES[3 + Math.floor(Math.random() * 2)];
    } else {
      type = INGREDIENT_TYPES[5 + Math.floor(Math.random() * 2)];
    }

    ingredientsRef.current.push({
      id: Math.random().toString(36),
      x: Math.random() * (screenWidth - 100) + 50,
      y: -50,
      size: 30,
      emoji: type.emoji,
      name: type.name,
      rarity: type.rarity,
      points: type.points,
    });
  };

  const handleTouch = (event: any) => {
    if (gameState !== 'playing') return;

    const { locationX, locationY } = event.nativeEvent;

    // Provide haptic or visual feedback for any tap
    const ingredients = ingredientsRef.current;
    for (let i = ingredients.length - 1; i >= 0; i--) {
      const ingredient = ingredients[i];
      const distance = Math.sqrt(
        Math.pow(locationX - ingredient.x, 2) + Math.pow(locationY - ingredient.y, 2)
      );

      if (distance < ingredient.size * 3) {
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
        break;
      }
    }
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

  const pauseGame = () => setGameState('paused');
  const resumeGame = () => setGameState('playing');
  const quitGame = () => {
    setGameState('menu');
    ingredientsRef.current = [];
  };

  const collectionRate = stats.collected + stats.missed > 0
    ? Math.round((stats.collected / (stats.collected + stats.missed)) * 100)
    : 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>🌿 Herbalist's Run</Text>
          <Text style={styles.subtitle}>Forage magical herbs</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.gameContainer}>
        <TouchableOpacity 
          style={styles.canvas} 
          onPress={handleTouch}
          activeOpacity={1}
        >
          <View style={styles.background}>
            {ingredientsRef.current.map((ingredient) => (
              <View
                key={ingredient.id}
                style={[
                  styles.ingredient,
                  {
                    left: ingredient.x - ingredient.size / 2,
                    top: ingredient.y - ingredient.size / 2,
                  },
                ]}
              >
                <Text style={styles.ingredientEmoji}>{ingredient.emoji}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* HUD Overlay */}
        {gameState === 'playing' && (
          <View style={styles.hud}>
            <View style={styles.hudLeft}>
              <Text style={styles.hudScore}>Score: {stats.score}</Text>
              <Text style={styles.hudStats}>
                Collected: {stats.collected} | Missed: {stats.missed}
              </Text>
              <Text style={styles.hudStats}>Success: {collectionRate}%</Text>
            </View>
            <TouchableOpacity onPress={pauseGame} style={styles.pauseButton}>
              <Text style={styles.pauseButtonText}>⏸</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>How to Play</Text>
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>🖱️ Tap to collect herbs as they appear</Text>
                <Text style={styles.instructionText}>⚡ The path speeds up over time</Text>
                <Text style={styles.instructionText}>✅ Collect at least 70% to survive</Text>
                <Text style={styles.instructionText}>🎁 Earn XP and ingredients</Text>
              </View>

              <View style={styles.rarityInfo}>
                <View style={styles.rarityRow}>
                  <Text style={styles.rarityEmoji}>🌿</Text>
                  <Text style={styles.rarityText}>Common (10pts)</Text>
                </View>
                <View style={styles.rarityRow}>
                  <Text style={styles.rarityEmoji}>🌺</Text>
                  <Text style={styles.rarityText}>Rare (25pts)</Text>
                </View>
                <View style={styles.rarityRow}>
                  <Text style={styles.rarityEmoji}>✨</Text>
                  <Text style={styles.rarityText}>Legendary (50pts)</Text>
                </View>
              </View>

              <TouchableOpacity onPress={startGame} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>🌲 Start Foraging</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>⏸ Paused</Text>
              <TouchableOpacity onPress={resumeGame} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>▶ Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={quitGame} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>🏠 Quit to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.gameOverTitle}>Game Over!</Text>
              <Text style={styles.gameOverSubtitle}>You missed too many herbs!</Text>

              <View style={styles.statsBox}>
                <Text style={styles.finalScore}>Final Score: {stats.score}</Text>
                <Text style={styles.statLine}>🌿 Collected: {stats.collected}</Text>
                <Text style={styles.statLine}>❌ Missed: {stats.missed}</Text>
                <Text style={styles.statLine}>✨ Success Rate: {collectionRate}%</Text>
                <Text style={styles.xpLine}>🎁 XP Earned: {stats.xpEarned}</Text>
              </View>

              {Object.keys(stats.ingredientsEarned).length > 0 && (
                <View style={styles.ingredientsBox}>
                  <Text style={styles.ingredientsTitle}>Ingredients Collected:</Text>
                  {Object.entries(stats.ingredientsEarned).map(([name, count]) => (
                    <Text key={name} style={styles.ingredientStat}>
                      {name}: {count}x
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity onPress={startGame} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>🔄 Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>🏠 Back to Games</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Legendary ingredients (✨🌙) are worth more points!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a3a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f2419',
  },
  backButton: {
    color: '#90ee90',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#90ee90',
    textAlign: 'center',
  },
  gameContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2d5a3d',
    position: 'relative',
  },
  canvas: {
    flex: 1,
    position: 'relative',
  },
  background: {
    flex: 1,
    backgroundColor: '#1a3a2e',
  },
  ingredient: {
    position: 'absolute',
  },
  ingredientEmoji: {
    fontSize: 40,
  },
  hud: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudLeft: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
  },
  hudScore: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hudStats: {
    color: '#90ee90',
    fontSize: 12,
  },
  pauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
  },
  pauseButtonText: {
    fontSize: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayContent: {
    width: '100%',
    maxWidth: 400,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructions: {
    marginBottom: 20,
  },
  instructionText: {
    color: '#90ee90',
    fontSize: 14,
    marginBottom: 8,
  },
  rarityInfo: {
    marginBottom: 20,
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rarityEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  rarityText: {
    color: '#90ee90',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#fbbf24',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
    padding: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsBox: {
    backgroundColor: 'rgba(45, 90, 61, 0.5)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 12,
  },
  statLine: {
    fontSize: 16,
    color: '#90ee90',
    marginBottom: 4,
  },
  xpLine: {
    fontSize: 16,
    color: '#a78bfa',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  ingredientsBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  ingredientStat: {
    fontSize: 12,
    color: '#90ee90',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fef3c7',
    margin: 16,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
});
