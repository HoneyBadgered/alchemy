/**
 * Zod Schema Helpers with Automatic Sanitization
 * 
 * Integration helpers that combine Zod validation with HTML sanitization
 * using transform() to automatically clean inputs during validation.
 */

import { z } from 'zod';
import { sanitizeStrict, sanitizeBasic, sanitizeMarkdown } from './sanitizer';

/**
 * Required string with strict sanitization (plain text only)
 * Use for: usernames, blend names, titles
 */
export const sanitizedString = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .transform(val => sanitizeStrict(val) || '')
    .refine(val => val.length > 0, 'Field cannot be empty after sanitization');

/**
 * Optional string with strict sanitization
 * Use for: optional text fields that should be plain text
 */
export const sanitizedOptionalString = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .optional()
    .nullable()
    .transform(val => val ? sanitizeStrict(val) : null);

/**
 * Required text with basic HTML sanitization
 * Use for: descriptions, notes, longer text fields
 */
export const sanitizedText = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .transform(val => sanitizeBasic(val) || '')
    .refine(val => val.length > 0, 'Field cannot be empty after sanitization');

/**
 * Optional text with basic HTML sanitization
 */
export const sanitizedOptionalText = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .optional()
    .nullable()
    .transform(val => val ? sanitizeBasic(val) : null);

/**
 * Markdown text with safe HTML sanitization
 * Use for: blog posts, articles, rich content
 */
export const sanitizedMarkdownText = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .transform(val => sanitizeMarkdown(val) || '')
    .refine(val => val.length > 0, 'Field cannot be empty after sanitization');

/**
 * Optional markdown text
 */
export const sanitizedOptionalMarkdownText = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .optional()
    .nullable()
    .transform(val => val ? sanitizeMarkdown(val) : null);

/**
 * Array of strings with sanitization
 * Use for: tags, categories, lists
 */
export const sanitizedStringArray = (maxItems: number = 100) =>
  z.array(z.string())
    .max(maxItems)
    .transform(arr => arr.map(item => sanitizeStrict(item)).filter((item): item is string => item !== null));
