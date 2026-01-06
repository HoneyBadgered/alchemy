'use client';

/**
 * Blend Tags Section
 * 
 * Comprehensive tag management for blends in the admin dashboard.
 * Includes all 6 tag categories focused on experiential metadata.
 */

import TagDropdown from './TagDropdown';
import type { BlendTags } from '@alchemy/types';
import {
  BLEND_TAG_META,
  BLEND_MOOD_INTENT_OPTIONS,
  BLEND_FLAVOR_DIRECTION_OPTIONS,
  BLEND_TIME_OCCASION_OPTIONS,
  BLEND_SEASONAL_AVAILABILITY_OPTIONS,
  BLEND_ZONE_AFFINITY_OPTIONS,
  BLEND_ENERGY_FEEL_OPTIONS,
} from '@alchemy/types';

interface BlendTagsSectionProps {
  value: Partial<BlendTags>;
  onChange: (tags: Partial<BlendTags>) => void;
  disabled?: boolean;
  isCurated?: boolean; // Determines if moodIntent is required
}

export default function BlendTagsSection({
  value,
  onChange,
  disabled = false,
  isCurated = false,
}: BlendTagsSectionProps) {
  const handleChange = (field: keyof BlendTags, newValue: string | string[]) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Admin Tags</h3>
        <p className="text-sm text-gray-500 mt-1">
          Experiential metadata to power zones, recommendations, and discovery.
        </p>
      </div>

      {/* Mood / Intent */}
      <TagDropdown
        label={BLEND_TAG_META.moodIntent.label}
        description={BLEND_TAG_META.moodIntent.description}
        value={value.moodIntent || []}
        options={BLEND_MOOD_INTENT_OPTIONS}
        onChange={(v) => handleChange('moodIntent', v)}
        multiSelect={BLEND_TAG_META.moodIntent.multiSelect}
        maxSelections={BLEND_TAG_META.moodIntent.maxSelections}
        required={isCurated} // Required for curated blends
        placeholder="Select mood/intent (max 3)"
        disabled={disabled}
      />

      {/* Flavor Direction */}
      <TagDropdown
        label={BLEND_TAG_META.flavorDirection.label}
        description={BLEND_TAG_META.flavorDirection.description}
        value={value.flavorDirection || []}
        options={BLEND_FLAVOR_DIRECTION_OPTIONS}
        onChange={(v) => handleChange('flavorDirection', v)}
        multiSelect={BLEND_TAG_META.flavorDirection.multiSelect}
        maxSelections={BLEND_TAG_META.flavorDirection.maxSelections}
        required={BLEND_TAG_META.flavorDirection.required}
        placeholder="Select flavor directions (max 3)"
        disabled={disabled}
      />

      {/* Time / Occasion */}
      <TagDropdown
        label={BLEND_TAG_META.timeOccasion.label}
        description={BLEND_TAG_META.timeOccasion.description}
        value={value.timeOccasion || []}
        options={BLEND_TIME_OCCASION_OPTIONS}
        onChange={(v) => handleChange('timeOccasion', v)}
        multiSelect={BLEND_TAG_META.timeOccasion.multiSelect}
        maxSelections={BLEND_TAG_META.timeOccasion.maxSelections}
        required={BLEND_TAG_META.timeOccasion.required}
        placeholder="Select occasions (max 2)"
        disabled={disabled}
      />

      {/* Seasonal / Availability */}
      <TagDropdown
        label={BLEND_TAG_META.seasonalAvailability.label}
        description={BLEND_TAG_META.seasonalAvailability.description}
        value={value.seasonalAvailability || 'evergreen'}
        options={BLEND_SEASONAL_AVAILABILITY_OPTIONS}
        onChange={(v) => handleChange('seasonalAvailability', v)}
        multiSelect={BLEND_TAG_META.seasonalAvailability.multiSelect}
        required={BLEND_TAG_META.seasonalAvailability.required}
        placeholder="Select availability"
        disabled={disabled}
      />

      {/* Zone Affinity */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="flex items-start mb-2">
          <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-600">
            Admin-only field. Zones should still be inferable from mood/flavor tags.
          </p>
        </div>
        <TagDropdown
          label={BLEND_TAG_META.zoneAffinity.label}
          description={BLEND_TAG_META.zoneAffinity.description}
          value={value.zoneAffinity || []}
          options={BLEND_ZONE_AFFINITY_OPTIONS}
          onChange={(v) => handleChange('zoneAffinity', v)}
          multiSelect={BLEND_TAG_META.zoneAffinity.multiSelect}
          required={BLEND_TAG_META.zoneAffinity.required}
          placeholder="Select zone affinities (merchandising hint)"
          disabled={disabled}
        />
      </div>

      {/* Energy / Caffeine Feel */}
      <TagDropdown
        label={BLEND_TAG_META.energyFeel.label}
        description={BLEND_TAG_META.energyFeel.description}
        value={value.energyFeel || ''}
        options={BLEND_ENERGY_FEEL_OPTIONS}
        onChange={(v) => handleChange('energyFeel', v)}
        multiSelect={BLEND_TAG_META.energyFeel.multiSelect}
        required={BLEND_TAG_META.energyFeel.required}
        placeholder="Select energy feel"
        disabled={disabled}
      />
    </div>
  );
}
