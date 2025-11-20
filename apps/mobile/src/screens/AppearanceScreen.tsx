import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function AppearanceScreen() {
  const [selectedTheme, setSelectedTheme] = useState('cozy');
  const [selectedTableSkin, setSelectedTableSkin] = useState('oak');

  const themes = [
    { id: 'cozy', name: 'Cozy Forest', emoji: '🌲', unlocked: true },
    { id: 'mystical', name: 'Mystical Cave', emoji: '✨', unlocked: true },
    { id: 'celestial', name: 'Celestial Sky', emoji: '🌟', unlocked: false },
    { id: 'volcanic', name: 'Volcanic Forge', emoji: '🔥', unlocked: false },
  ];

  const tableSkins = [
    { id: 'oak', name: 'Oak Wood', emoji: '🪵', unlocked: true },
    { id: 'marble', name: 'Marble', emoji: '⬜', unlocked: true },
    { id: 'crystal', name: 'Crystal', emoji: '💎', unlocked: false },
    { id: 'obsidian', name: 'Obsidian', emoji: '⬛', unlocked: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.subtitle}>
            Customize your alchemy experience
          </Text>
        </View>

        {/* Themes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Themes</Text>
          <View style={styles.grid}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => theme.unlocked && setSelectedTheme(theme.id)}
                disabled={!theme.unlocked}
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardSelected,
                  !theme.unlocked && styles.themeCardLocked,
                ]}
              >
                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                <Text
                  style={[
                    styles.themeName,
                    selectedTheme === theme.id && styles.themeNameSelected,
                  ]}
                >
                  {theme.name}
                </Text>
                {!theme.unlocked && (
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Table Skins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Table Skins</Text>
          <View style={styles.grid}>
            {tableSkins.map((skin) => (
              <TouchableOpacity
                key={skin.id}
                onPress={() => skin.unlocked && setSelectedTableSkin(skin.id)}
                disabled={!skin.unlocked}
                style={[
                  styles.themeCard,
                  selectedTableSkin === skin.id && styles.themeCardSelected,
                  !skin.unlocked && styles.themeCardLocked,
                ]}
              >
                <Text style={styles.themeEmoji}>{skin.emoji}</Text>
                <Text
                  style={[
                    styles.themeName,
                    selectedTableSkin === skin.id && styles.themeNameSelected,
                  ]}
                >
                  {skin.name}
                </Text>
                {!skin.unlocked && (
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.preview}>
              <Text style={styles.previewEmoji}>
                {themes.find((t) => t.id === selectedTheme)?.emoji}
              </Text>
              <Text style={styles.previewText}>
                Theme: {themes.find((t) => t.id === selectedTheme)?.name}
              </Text>
              <Text style={styles.previewEmoji}>
                {tableSkins.find((s) => s.id === selectedTableSkin)?.emoji}
              </Text>
              <Text style={styles.previewText}>
                Table: {tableSkins.find((s) => s.id === selectedTableSkin)?.name}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fce7f3',
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  themeCard: {
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
  themeCardSelected: {
    backgroundColor: '#9333ea',
    borderWidth: 4,
    borderColor: '#c084fc',
  },
  themeCardLocked: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  themeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeNameSelected: {
    color: '#fff',
  },
  lockedText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preview: {
    backgroundColor: '#92400e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  previewText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
});
