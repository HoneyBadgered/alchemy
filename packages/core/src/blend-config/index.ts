/**
 * Blend Configuration
 * Global configuration for blend sizes and options
 */

/**
 * Available blend sizes in ounces
 * This can be modified to add or remove size options globally
 */
export const BLEND_SIZES = [1, 2, 4, 8] as const;

/**
 * Type for blend size values
 */
export type BlendSize = typeof BLEND_SIZES[number];

/**
 * Default blend size
 */
export const DEFAULT_BLEND_SIZE: BlendSize = 2;

/**
 * Check if a value is a valid blend size
 */
export function isValidBlendSize(size: number): size is BlendSize {
  return BLEND_SIZES.includes(size as BlendSize);
}

/**
 * Get blend size label
 */
export function getBlendSizeLabel(size: BlendSize): string {
  return `${size}oz`;
}

/**
 * Get all blend size options for UI
 */
export function getBlendSizeOptions(): Array<{ value: BlendSize; label: string }> {
  return BLEND_SIZES.map(size => ({
    value: size,
    label: getBlendSizeLabel(size),
  }));
}
