import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function TableScreen() {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const ingredients = [
    { id: '1', name: 'Lavender', emoji: '🌸' },
    { id: '2', name: 'Chamomile', emoji: '🌼' },
    { id: '3', name: 'Mint', emoji: '🌿' },
    { id: '4', name: 'Rose', emoji: '🌹' },
  ];

  const handleIngredientPress = (id: string) => {
    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== id));
    } else if (selectedIngredients.length < 3) {
      setSelectedIngredients([...selectedIngredients, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>The Alchemy Table</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.levelText}>Level: 1</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '30%' }]} />
            </View>
            <Text style={styles.xpText}>30 XP</Text>
          </View>
        </View>

        {/* Cauldron */}
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <Text style={styles.cauldronTitle}>Cauldron</Text>
            <View style={styles.cauldron}>
              {selectedIngredients.length === 0 ? (
                <Text style={styles.placeholderText}>
                  Select ingredients to craft
                </Text>
              ) : (
                <View style={styles.ingredientsRow}>
                  {selectedIngredients.map((id) => {
                    const ingredient = ingredients.find((i) => i.id === id);
                    return (
                      <Text key={id} style={styles.selectedEmoji}>
                        {ingredient?.emoji}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
            {selectedIngredients.length > 0 && (
              <TouchableOpacity style={styles.craftButton}>
                <Text style={styles.craftButtonText}>
                  Craft Blend ({selectedIngredients.length} ingredients)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Available Ingredients */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Available Ingredients</Text>
          <View style={styles.ingredientsGrid}>
            {ingredients.map((ingredient) => {
              const isSelected = selectedIngredients.includes(ingredient.id);
              return (
                <TouchableOpacity
                  key={ingredient.id}
                  onPress={() => handleIngredientPress(ingredient.id)}
                  style={[
                    styles.ingredientCard,
                    isSelected && styles.ingredientCardSelected,
                  ]}
                >
                  <Text style={styles.ingredientEmoji}>{ingredient.emoji}</Text>
                  <Text
                    style={[
                      styles.ingredientName,
                      isSelected && styles.ingredientNameSelected,
                    ]}
                  >
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#581c87',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#9333ea',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 14,
  },
  tableContainer: {
    padding: 16,
  },
  table: {
    backgroundColor: '#92400e',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cauldronTitle: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  cauldron: {
    backgroundColor: 'rgba(76, 29, 149, 0.3)',
    borderRadius: 100,
    width: 200,
    height: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  ingredientsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedEmoji: {
    fontSize: 40,
  },
  craftButton: {
    backgroundColor: '#9333ea',
    padding: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  craftButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ingredientsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ingredientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredientCardSelected: {
    backgroundColor: '#9333ea',
  },
  ingredientEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientNameSelected: {
    color: '#fff',
  },
});
