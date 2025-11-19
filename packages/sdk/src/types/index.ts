/**
 * API Types for The Alchemy Table
 */

import type {
  Player,
  Quest,
  InventoryItem,
  PlayerCosmetics,
} from '@alchemy/core';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

// Player Progress Types
export interface PlayerProgress {
  player: Player;
  quests: PlayerQuest[];
  inventory: InventoryItem[];
  cosmetics: PlayerCosmetics;
}

export interface PlayerQuest {
  questId: string;
  quest: Quest;
  status: 'available' | 'active' | 'completed';
  progress?: number;
  completedAt?: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
}

// Crafting Types
export interface CraftRequest {
  recipeId: string;
}

export interface CraftResponse {
  success: boolean;
  resultItem?: InventoryItem;
  newInventory: InventoryItem[];
  xpGained?: number;
}

// AI Label Types
export interface LabelGenerationRequest {
  stylePreset?: string;
  tonePreset?: string;
  flavorNotes?: string[];
  customPrompt?: string;
}

export interface LabelDesign {
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

// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

// Re-export core types for convenience
export type { InventoryItem, PlayerCosmetics };

