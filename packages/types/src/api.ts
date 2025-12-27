/**
 * API-specific types for The Alchemy Table
 */

import type { InventoryItem } from './game';

/**
 * Craft request payload
 */
export interface CraftRequest {
  recipeId: string;
}

/**
 * Craft response
 */
export interface CraftResponse {
  success: boolean;
  resultItem?: InventoryItem;
  newInventory: InventoryItem[];
  xpGained?: number;
}

/**
 * AI Label generation request
 */
export interface LabelGenerationRequest {
  stylePreset?: string;
  tonePreset?: string;
  flavorNotes?: string[];
  customPrompt?: string;
}

/**
 * Label design entity
 */
export interface LabelDesign {
  id: string;
}

/**
 * Blending ingredient (extended)
 */
export interface BlendingIngredient {
  id: string;
  name: string;
  category: string;
  description: string;
  shortTags: string[];
  emoji: string;
  isBase: boolean;
  costPerOz: number;
  tier: 'standard' | 'premium';
  flavorProfile: {
    floral: number;
    citrus: number;
    earthy: number;
    sweet: number;
    caffeine: number;
  };
  caffeineLevel: 'none' | 'low' | 'medium' | 'high';
  baseAmount?: number;
  incrementAmount?: number;
}

/**
 * Label design response
 */
export interface LabelDesignResponse {
  id: string;
  orderId: string;
  name: string;
  tagline: string;
  description: string;
  artworkPrompt?: string;
  artworkUrl?: string;
  status: 'draft' | 'approved';
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment types
 */
export interface CreatePaymentIntentInput {
  amount: number;
  currency?: string;
  orderId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentStatusResult {
  status: string;
  paymentIntentId: string;
}

export interface OrderByPaymentIntentResult {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  };
}

export interface PaymentConfigResult {
  publishableKey: string;
}
