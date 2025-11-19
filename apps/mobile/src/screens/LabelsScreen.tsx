import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function LabelsScreen() {
  const [customName, setCustomName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('elegant');
  const [selectedTone, setSelectedTone] = useState('professional');

  const styles = [
    { id: 'elegant', name: 'Elegant', emoji: '✨' },
    { id: 'rustic', name: 'Rustic', emoji: '🌿' },
    { id: 'modern', name: 'Modern', emoji: '🎨' },
    { id: 'mystical', name: 'Mystical', emoji: '🔮' },
  ];

  const tones = [
    { id: 'professional', name: 'Professional' },
    { id: 'playful', name: 'Playful' },
    { id: 'poetic', name: 'Poetic' },
    { id: 'mysterious', name: 'Mysterious' },
  ];

  const handleGenerate = () => {
    console.log('Generating label with:', { customName, selectedStyle, selectedTone });
  };

  return (
    <SafeAreaView style={screenStyles.container}>
      <ScrollView style={screenStyles.scrollView}>
        {/* Header */}
        <View style={screenStyles.header}>
          <Text style={screenStyles.title}>Label Studio</Text>
          <Text style={screenStyles.subtitle}>
            Create custom labels for your blends
          </Text>
        </View>

        {/* Custom Name Input */}
        <View style={screenStyles.section}>
          <Text style={screenStyles.label}>Custom Name (Optional)</Text>
          <TextInput
            style={screenStyles.input}
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g., Moonlight Serenity"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Style Selection */}
        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Style</Text>
          <View style={screenStyles.optionsGrid}>
            {styles.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => setSelectedStyle(style.id)}
                style={[
                  screenStyles.optionCard,
                  selectedStyle === style.id && screenStyles.optionCardSelected,
                ]}
              >
                <Text style={screenStyles.optionEmoji}>{style.emoji}</Text>
                <Text
                  style={[
                    screenStyles.optionName,
                    selectedStyle === style.id && screenStyles.optionNameSelected,
                  ]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tone Selection */}
        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Tone</Text>
          <View style={screenStyles.optionsGrid}>
            {tones.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                onPress={() => setSelectedTone(tone.id)}
                style={[
                  screenStyles.optionCard,
                  selectedTone === tone.id && screenStyles.optionCardSelected,
                ]}
              >
                <Text
                  style={[
                    screenStyles.optionName,
                    selectedTone === tone.id && screenStyles.optionNameSelected,
                  ]}
                >
                  {tone.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View style={screenStyles.section}>
          <TouchableOpacity
            style={screenStyles.generateButton}
            onPress={handleGenerate}
          >
            <Text style={screenStyles.generateButtonText}>
              Generate Custom Label
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={screenStyles.section}>
          <Text style={screenStyles.sectionTitle}>Preview</Text>
          <View style={screenStyles.previewCard}>
            <View style={screenStyles.preview}>
              <Text style={screenStyles.previewEmoji}>🏷️</Text>
              <Text style={screenStyles.previewText}>
                Your custom label will appear here
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3c7',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    width: '45%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  optionCardSelected: {
    borderColor: '#9333ea',
    backgroundColor: '#f3e8ff',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionName: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionNameSelected: {
    color: '#9333ea',
  },
  generateButton: {
    backgroundColor: '#9333ea',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
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
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
