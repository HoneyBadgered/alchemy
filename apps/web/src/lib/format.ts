/**
 * Formatting utilities
 */

/**
 * Format quantity display - removes trailing .0 for whole numbers
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "5" for 5.0, "2.5" for 2.5)
 */
export const formatQuantity = (value: number): string => {
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
};
