import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InventoryScreen() {
  const inventoryItems = [
    { id: '1', name: 'Lavender', emoji: '🌸', quantity: 12 },
    { id: '2', name: 'Chamomile', emoji: '🌼', quantity: 8 },
    { id: '3', name: 'Mint', emoji: '🌿', quantity: 15 },
    { id: '4', name: 'Rose', emoji: '🌹', quantity: 5 },
    { id: '5', name: 'Healing Potion', emoji: '🧪', quantity: 3 },
    { id: '6', name: 'Calming Blend', emoji: '☕', quantity: 2 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{inventoryItems.length} items</Text>
        </View>

        {/* Inventory Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {inventoryItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>×{item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dbeafe',
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
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  quantityBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '600',
  },
});
