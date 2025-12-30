/**
 * CUID Generator Utility
 * Wrapper for generating collision-resistant unique IDs
 */

import { createId } from '@paralleldrive/cuid2';

/**
 * Generate a new CUID
 */
export function cuid(): string {
  return createId();
}
