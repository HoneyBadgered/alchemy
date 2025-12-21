import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const games = [
  {
    id: 'forage',
    title: "🌿 Herbalist's Run",
    description: 'Collect magical herbs along an enchanted forest path. Click or tap to gather ingredients as the path speeds up!',
    difficulty: 'Medium',
    xpReward: '5-25 XP per item',
    color: '#16a34a',
    features: ['Progressive difficulty', 'Ingredient collection', 'Mobile-friendly'],
  },
  {
    id: 'pour',
    title: '🫖 Perfect Pour',
    description: 'Fill tea cups to perfection without spilling a drop. Press and hold to pour, release at the perfect moment!',
    difficulty: 'Easy',
    xpReward: '20+ XP per cup',
    color: '#d97706',
    features: ['Timing-based', 'Progressive difficulty', 'Precision gameplay'],
  },
  {
    id: 'potion-mixing',
    title: '🧪 Potion Mixing',
    description: 'Match ingredient sequences in the correct order! Build combos for massive XP bonuses. Recipes get longer as you level up!',
    difficulty: 'Medium',
    xpReward: '30+ XP per match',
    color: '#9333ea',
    features: ['Puzzle-based', 'Combo system', 'Memory challenge'],
  },
  {
    id: 'tea-pet',
    title: '🐾 Tea Pet Companion',
    description: 'Adopt and care for your tea companion! Feed treats, play together, and groom them to unlock special brewing perks!',
    difficulty: 'Easy',
    xpReward: '20 XP per action',
    color: '#e11d48',
    features: ['Virtual pet', 'Unlock perks', 'Daily care'],
  },
];

export default function GamesScreen({ navigation }: any) {
  const handleGamePress = (gameId: string) => {
    // Navigate to specific game screen
    if (gameId === 'forage') {
      navigation.navigate('ForageGame');
    } else {
      // Show coming soon alert for other games
      alert(`${gameId} coming soon!`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Mini Games</Text>
          <Text style={styles.subtitle}>
            Play games to earn XP and unlock rewards!
          </Text>
        </View>

        <View style={styles.gamesGrid}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { borderColor: game.color }]}
              onPress={() => handleGamePress(game.id)}
              activeOpacity={0.7}
            >
              <View style={styles.gameHeader}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{game.difficulty}</Text>
                </View>
              </View>

              <Text style={styles.gameDescription}>{game.description}</Text>

              <View style={styles.xpBadge}>
                <Text style={styles.xpText}>⭐ {game.xpReward}</Text>
              </View>

              <View style={styles.features}>
                {game.features.map((feature, index) => (
                  <View key={index} style={styles.featureBadge}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.playButton}>
                <Text style={[styles.playButtonText, { color: game.color }]}>
                  Play Now →
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Play daily to maximize your XP gains!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  gamesGrid: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  gameDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  xpBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  featureBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
  },
  playButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fef3c7',
    margin: 16,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});
