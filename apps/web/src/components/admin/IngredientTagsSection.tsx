'use client';

/**
 * Ingredient Tags Section
 * 
 * Comprehensive tag management for ingredients in the admin dashboard.
 * Includes all 6 tag categories with proper validation and UI.
 */

import TagDropdown from './TagDropdown';
import type { IngredientTags } from '@alchemy/types';
import {
  INGREDIENT_TAG_META,
  INGREDIENT_FLAVOR_PRIMARY_OPTIONS,
  INGREDIENT_FLAVOR_SECONDARY_OPTIONS,
  INGREDIENT_FUNCTION_OPTIONS,
  INGREDIENT_CAFFEINE_BEHAVIOR_OPTIONS,
  INGREDIENT_SAFETY_FLAG_OPTIONS,
  INGREDIENT_VISUAL_EFFECT_OPTIONS,
} from '@alchemy/types';

interface IngredientTagsSectionProps {
  value: Partial<IngredientTags>;
  onChange: (tags: Partial<IngredientTags>) => void;
  disabled?: boolean;
}

export default function IngredientTagsSection({
  value,
  onChange,
  disabled = false,
}: IngredientTagsSectionProps) {
  const handleChange = (field: keyof IngredientTags, newValue: string | string[]) => {
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
          Structured metadata to power blend previews, filters, and UI behavior.
        </p>
      </div>

      {/* Flavor Profile (Primary) */}
      <TagDropdown
        label={INGREDIENT_TAG_META.flavorProfilePrimary.label}
        description={INGREDIENT_TAG_META.flavorProfilePrimary.description}
        value={value.flavorProfilePrimary || []}
        options={INGREDIENT_FLAVOR_PRIMARY_OPTIONS}
        onChange={(v) => handleChange('flavorProfilePrimary', v)}
        multiSelect={INGREDIENT_TAG_META.flavorProfilePrimary.multiSelect}
        maxSelections={INGREDIENT_TAG_META.flavorProfilePrimary.maxSelections}
        required={INGREDIENT_TAG_META.flavorProfilePrimary.required}
        placeholder="Select primary flavor profiles (max 3)"
        disabled={disabled}
      />

      {/* Flavor Profile (Secondary) */}
      <TagDropdown
        label={INGREDIENT_TAG_META.flavorProfileSecondary.label}
        description={INGREDIENT_TAG_META.flavorProfileSecondary.description}
        value={value.flavorProfileSecondary || []}
        options={INGREDIENT_FLAVOR_SECONDARY_OPTIONS}
        onChange={(v) => handleChange('flavorProfileSecondary', v)}
        multiSelect={INGREDIENT_TAG_META.flavorProfileSecondary.multiSelect}
        maxSelections={INGREDIENT_TAG_META.flavorProfileSecondary.maxSelections}
        required={INGREDIENT_TAG_META.flavorProfileSecondary.required}
        placeholder="Select secondary nuances (max 3)"
        disabled={disabled}
      />

      {/* Ingredient Function */}
      <TagDropdown
        label={INGREDIENT_TAG_META.ingredientFunction.label}
        description={INGREDIENT_TAG_META.ingredientFunction.description}
        value={value.ingredientFunction || ''}
        options={INGREDIENT_FUNCTION_OPTIONS}
        onChange={(v) => handleChange('ingredientFunction', v)}
        multiSelect={INGREDIENT_TAG_META.ingredientFunction.multiSelect}
        required={INGREDIENT_TAG_META.ingredientFunction.required}
        placeholder="Select ingredient function"
        disabled={disabled}
      />

      {/* Caffeine Behavior */}
      <TagDropdown
        label={INGREDIENT_TAG_META.caffeineBehavior.label}
        description={INGREDIENT_TAG_META.caffeineBehavior.description}
        value={value.caffeineBehavior || ''}
        options={INGREDIENT_CAFFEINE_BEHAVIOR_OPTIONS}
        onChange={(v) => handleChange('caffeineBehavior', v)}
        multiSelect={INGREDIENT_TAG_META.caffeineBehavior.multiSelect}
        required={INGREDIENT_TAG_META.caffeineBehavior.required}
        placeholder="Select caffeine behavior"
        disabled={disabled}
      />

      {/* Safety Flags */}
      <TagDropdown
        label={INGREDIENT_TAG_META.safetyFlags.label}
        description={INGREDIENT_TAG_META.safetyFlags.description}
        value={value.safetyFlags || []}
        options={INGREDIENT_SAFETY_FLAG_OPTIONS}
        onChange={(v) => handleChange('safetyFlags', v)}
        multiSelect={INGREDIENT_TAG_META.safetyFlags.multiSelect}
        required={INGREDIENT_TAG_META.safetyFlags.required}
        placeholder="Select any applicable safety flags"
        disabled={disabled}
      />

      {/* Visual Effect */}
      <TagDropdown
        label={INGREDIENT_TAG_META.visualEffect.label}
        description={INGREDIENT_TAG_META.visualEffect.description}
        value={value.visualEffect || []}
        options={INGREDIENT_VISUAL_EFFECT_OPTIONS}
        onChange={(v) => handleChange('visualEffect', v)}
        multiSelect={INGREDIENT_TAG_META.visualEffect.multiSelect}
        maxSelections={INGREDIENT_TAG_META.visualEffect.maxSelections}
        required={INGREDIENT_TAG_META.visualEffect.required}
        placeholder="Select visual effects (max 2)"
        disabled={disabled}
      />
    </div>
  );
}
