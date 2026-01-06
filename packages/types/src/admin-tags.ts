/**
 * Admin Tag Dropdown Types
 * 
 * Comprehensive type definitions for ingredient and blend tagging system
 * in the admin dashboard.
 */

// ============================================================================
// INGREDIENT TAGS
// ============================================================================

/**
 * Flavor Profile (Primary) - Required, Multi-select (max 3)
 * Powers blend previews, flavor balance calculations, and filtering
 */
export type IngredientFlavorPrimary =
  | 'floral'
  | 'citrus'
  | 'fruity'
  | 'herbal'
  | 'grassy'
  | 'earthy'
  | 'smoky'
  | 'roasted'
  | 'spicy'
  | 'sweet'
  | 'bitter'
  | 'nutty';

/**
 * Flavor Profile (Secondary/Nuance) - Optional, Multi-select (max 3)
 * Used for descriptions only, not logic. Enhances admin clarity.
 */
export type IngredientFlavorSecondary =
  | 'honeyed'
  | 'creamy'
  | 'fresh'
  | 'bright'
  | 'soft'
  | 'warming'
  | 'cooling'
  | 'clean'
  | 'dry'
  | 'round';

/**
 * Ingredient Function - Required, Single-select
 * Informs usage caps, UI warnings, and auto-role inference
 */
export type IngredientFunction =
  | 'base-compatible'
  | 'accent'
  | 'modifier'
  | 'dominant-if-overused'
  | 'aroma-only'
  | 'color-effect'
  | 'sweetening-effect';

/**
 * Safety & Disclosure Flags - Optional, Multi-select
 * Triggers warnings and contextual copy in UI
 */
export type IngredientSafetyFlag =
  | 'blood-pressure-note'
  | 'medication-interaction'
  | 'pregnancy-caution'
  | 'allergen-nuts'
  | 'limit-quantity';

/**
 * Visual/Experiential Effect - Optional, Multi-select (max 2)
 * Used in UI previews and storytelling
 */
export type IngredientVisualEffect =
  | 'color-changing'
  | 'deep-color'
  | 'pale-liquor'
  | 'dramatic'
  | 'subtle-appearance';

// ============================================================================
// BLEND TAGS
// ============================================================================

/**
 * Mood/Intent - Required for curated blends, Optional for user blends
 * Multi-select (max 3)
 * Drives zones, recommendations, and brand tone
 */
export type BlendMoodIntent =
  | 'calming'
  | 'restorative'
  | 'focusing'
  | 'grounding'
  | 'comforting'
  | 'contemplative'
  | 'uplifting'
  | 'warming'
  | 'quiet'
  | 'centering';

/**
 * Flavor Direction - Required, Multi-select (max 3)
 * Sets expectations, drives storefront filters
 */
export type BlendFlavorDirection =
  | 'floral'
  | 'citrus'
  | 'herbal'
  | 'earthy'
  | 'smoky'
  | 'spicy'
  | 'sweet'
  | 'roasted'
  | 'fresh';

/**
 * Time/Occasion - Optional, Multi-select (max 2)
 * Powers discovery, bundles, and recommendation logic
 */
export type BlendTimeOccasion =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'before-bed'
  | 'after-meal'
  | 'work'
  | 'study'
  | 'ritual';

/**
 * Seasonal/Availability - Optional, Single-select
 * Powers The Liminal Tent and merchandising control
 */
export type BlendSeasonalAvailability =
  | 'evergreen'
  | 'seasonal'
  | 'limited'
  | 'rotating'
  | 'experimental';

/**
 * Zone Affinity - Optional, Multi-select
 * Admin-only hint for merchandising, not user-facing
 */
export type BlendZoneAffinity =
  | 'The Hearthhouse'
  | 'The Conservatory'
  | 'The East Pavilion'
  | 'The Observatory'
  | 'The Liminal Tent';

/**
 * Energy/Caffeine Feel - Optional, Single-select
 * Human-readable caffeine framing
 */
export type BlendEnergyFeel =
  | 'caffeine-free'
  | 'gentle'
  | 'balanced'
  | 'stimulating';

// ============================================================================
// AGGREGATE TYPES
// ============================================================================

/**
 * Complete ingredient tag structure
 */
export interface IngredientTags {
  flavorProfilePrimary: IngredientFlavorPrimary[];      // Required, max 3
  flavorProfileSecondary: IngredientFlavorSecondary[];  // Optional, max 3
  ingredientFunction: IngredientFunction | null;        // Required
  safetyFlags: IngredientSafetyFlag[];                  // Optional, multi
  visualEffect: IngredientVisualEffect[];               // Optional, max 2
}

/**
 * Complete blend tag structure
 */
export interface BlendTags {
  moodIntent: BlendMoodIntent[];                        // Required for curated, max 3
  flavorDirection: BlendFlavorDirection[];              // Required, max 3
  timeOccasion: BlendTimeOccasion[];                    // Optional, max 2
  seasonalAvailability: BlendSeasonalAvailability | null; // Optional
  zoneAffinity: BlendZoneAffinity[];                    // Optional, multi (admin-only)
  energyFeel: BlendEnergyFeel | null;                   // Optional
}

// ============================================================================
// DISPLAY METADATA
// ============================================================================

/**
 * Tag category metadata for UI rendering
 */
export interface TagCategoryMeta {
  label: string;
  description: string;
  required: boolean;
  maxSelections?: number;
  multiSelect: boolean;
}

/**
 * Ingredient tag metadata for admin UI
 */
export const INGREDIENT_TAG_META: Record<keyof IngredientTags, TagCategoryMeta> = {
  flavorProfilePrimary: {
    label: 'Flavor Profile (Primary)',
    description: 'Power blend previews and flavor balance calculations',
    required: true,
    maxSelections: 3,
    multiSelect: true,
  },
  flavorProfileSecondary: {
    label: 'Flavor Profile (Secondary / Nuance)',
    description: 'Used only in descriptions, not logic',
    required: false,
    maxSelections: 3,
    multiSelect: true,
  },
  ingredientFunction: {
    label: 'Ingredient Function',
    description: 'Informs usage caps and UI warnings',
    required: true,
    multiSelect: false,
  },
  safetyFlags: {
    label: 'Safety & Disclosure Flags',
    description: 'Triggers warnings and contextual copy',
    required: false,
    multiSelect: true,
  },
  visualEffect: {
    label: 'Visual / Experiential Effect',
    description: 'Used in UI previews and storytelling',
    required: false,
    maxSelections: 2,
    multiSelect: true,
  },
};

/**
 * Blend tag metadata for admin UI
 */
export const BLEND_TAG_META: Record<keyof BlendTags, TagCategoryMeta> = {
  moodIntent: {
    label: 'Mood / Intent ⭐',
    description: 'Drives zones, recommendations, and brand tone',
    required: true, // for curated blends
    maxSelections: 3,
    multiSelect: true,
  },
  flavorDirection: {
    label: 'Flavor Direction',
    description: 'Sets expectations and drives storefront filters',
    required: true,
    maxSelections: 3,
    multiSelect: true,
  },
  timeOccasion: {
    label: 'Time / Occasion',
    description: 'Powers discovery, bundles, and recommendations',
    required: false,
    maxSelections: 2,
    multiSelect: true,
  },
  seasonalAvailability: {
    label: 'Seasonal / Availability',
    description: 'Powers The Liminal Tent and merchandising',
    required: false,
    multiSelect: false,
  },
  zoneAffinity: {
    label: 'Zone Affinity (Admin-Only)',
    description: 'Merchandising hint, zones should still be inferable',
    required: false,
    multiSelect: true,
  },
  energyFeel: {
    label: 'Energy / Caffeine Feel',
    description: 'Human-readable caffeine framing',
    required: false,
    multiSelect: false,
  },
};

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

/**
 * Formatted options for dropdowns with display labels
 */
export interface TagOption {
  value: string;
  label: string;
  description?: string;
}

export const INGREDIENT_FLAVOR_PRIMARY_OPTIONS: TagOption[] = [
  { value: 'floral', label: 'Floral' },
  { value: 'citrus', label: 'Citrus' },
  { value: 'fruity', label: 'Fruity' },
  { value: 'herbal', label: 'Herbal' },
  { value: 'grassy', label: 'Grassy' },
  { value: 'earthy', label: 'Earthy' },
  { value: 'smoky', label: 'Smoky' },
  { value: 'roasted', label: 'Roasted' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'sweet', label: 'Sweet' },
  { value: 'bitter', label: 'Bitter' },
  { value: 'nutty', label: 'Nutty' },
];

export const INGREDIENT_FLAVOR_SECONDARY_OPTIONS: TagOption[] = [
  { value: 'honeyed', label: 'Honeyed' },
  { value: 'creamy', label: 'Creamy' },
  { value: 'fresh', label: 'Fresh' },
  { value: 'bright', label: 'Bright' },
  { value: 'soft', label: 'Soft' },
  { value: 'warming', label: 'Warming' },
  { value: 'cooling', label: 'Cooling' },
  { value: 'clean', label: 'Clean' },
  { value: 'dry', label: 'Dry' },
  { value: 'round', label: 'Round' },
];

export const INGREDIENT_FUNCTION_OPTIONS: TagOption[] = [
  { value: 'base-compatible', label: 'Base Compatible', description: 'Can be used as a base tea' },
  { value: 'accent', label: 'Accent', description: 'Adds subtle flavor notes' },
  { value: 'modifier', label: 'Modifier', description: 'Changes blend character' },
  { value: 'dominant-if-overused', label: 'Dominant If Overused', description: 'Use sparingly' },
  { value: 'aroma-only', label: 'Aroma Only', description: 'Primarily for scent' },
  { value: 'color-effect', label: 'Color Effect', description: 'Changes liquor color' },
  { value: 'sweetening-effect', label: 'Sweetening Effect', description: 'Adds sweetness' },
];

export const INGREDIENT_SAFETY_FLAG_OPTIONS: TagOption[] = [
  { value: 'blood-pressure-note', label: 'Blood Pressure Note' },
  { value: 'medication-interaction', label: 'Medication Interaction' },
  { value: 'pregnancy-caution', label: 'Pregnancy Caution' },
  { value: 'allergen-nuts', label: 'Allergen: Nuts' },
  { value: 'limit-quantity', label: 'Limit Quantity' },
];

export const INGREDIENT_VISUAL_EFFECT_OPTIONS: TagOption[] = [
  { value: 'color-changing', label: 'Color-Changing' },
  { value: 'deep-color', label: 'Deep Color' },
  { value: 'pale-liquor', label: 'Pale Liquor' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'subtle-appearance', label: 'Subtle Appearance' },
];

export const BLEND_MOOD_INTENT_OPTIONS: TagOption[] = [
  { value: 'calming', label: 'Calming' },
  { value: 'restorative', label: 'Restorative' },
  { value: 'focusing', label: 'Focusing' },
  { value: 'grounding', label: 'Grounding' },
  { value: 'comforting', label: 'Comforting' },
  { value: 'contemplative', label: 'Contemplative' },
  { value: 'uplifting', label: 'Uplifting' },
  { value: 'warming', label: 'Warming' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'centering', label: 'Centering' },
];

export const BLEND_FLAVOR_DIRECTION_OPTIONS: TagOption[] = [
  { value: 'floral', label: 'Floral' },
  { value: 'citrus', label: 'Citrus' },
  { value: 'herbal', label: 'Herbal' },
  { value: 'earthy', label: 'Earthy' },
  { value: 'smoky', label: 'Smoky' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'sweet', label: 'Sweet' },
  { value: 'roasted', label: 'Roasted' },
  { value: 'fresh', label: 'Fresh' },
];

export const BLEND_TIME_OCCASION_OPTIONS: TagOption[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'before-bed', label: 'Before Bed' },
  { value: 'after-meal', label: 'After Meal' },
  { value: 'work', label: 'Work' },
  { value: 'study', label: 'Study' },
  { value: 'ritual', label: 'Ritual' },
];

export const BLEND_SEASONAL_AVAILABILITY_OPTIONS: TagOption[] = [
  { value: 'evergreen', label: 'Evergreen', description: 'Always available' },
  { value: 'seasonal', label: 'Seasonal', description: 'Available during specific seasons' },
  { value: 'limited', label: 'Limited', description: 'Limited time offering' },
  { value: 'rotating', label: 'Rotating', description: 'Rotates in and out' },
  { value: 'experimental', label: 'Experimental', description: 'Test batch' },
];

export const BLEND_ZONE_AFFINITY_OPTIONS: TagOption[] = [
  { value: 'The Hearthhouse', label: 'The Hearthhouse' },
  { value: 'The Conservatory', label: 'The Conservatory' },
  { value: 'The East Pavilion', label: 'The East Pavilion' },
  { value: 'The Observatory', label: 'The Observatory' },
  { value: 'The Liminal Tent', label: 'The Liminal Tent' },
];

export const BLEND_ENERGY_FEEL_OPTIONS: TagOption[] = [
  { value: 'caffeine-free', label: 'Caffeine-Free' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'stimulating', label: 'Stimulating' },
];
