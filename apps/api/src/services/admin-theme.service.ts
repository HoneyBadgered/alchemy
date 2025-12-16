/**
 * Admin Theme Management Service
 */

import { prisma } from '../utils/prisma';

export interface CreateThemeInput {
  name: string;
  description?: string;
  backgroundUrl?: string;
  colorPalette?: any;
  requiredLevel?: number;
  requiredQuestId?: string;
  isPremium?: boolean;
  price?: number;
  isActive?: boolean;
}

export interface UpdateThemeInput {
  name?: string;
  description?: string;
  backgroundUrl?: string;
  colorPalette?: any;
  requiredLevel?: number;
  requiredQuestId?: string;
  isPremium?: boolean;
  price?: number;
  isActive?: boolean;
}

export class AdminThemeService {
  /**
   * Get all themes
   */
  async getThemes() {
    const themes = await prisma.themes.findMany({
      include: {
        tableSkins: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return themes;
  }

  /**
   * Get single theme by ID
   */
  async getTheme(id: string) {
    const theme = await prisma.themes.findUnique({
      where: { id },
      include: {
        tableSkins: true,
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    return theme;
  }

  /**
   * Create new theme
   */
  async createTheme(data: CreateThemeInput) {
    const theme = await prisma.themes.create({
      data: {
        name: data.name,
        description: data.description,
        backgroundUrl: data.backgroundUrl,
        colorPalette: data.colorPalette,
        requiredLevel: data.requiredLevel ?? 1,
        requiredQuestId: data.requiredQuestId,
        isPremium: data.isPremium ?? false,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    });

    return theme;
  }

  /**
   * Update theme
   */
  async updateTheme(id: string, data: UpdateThemeInput) {
    const theme = await prisma.themes.update({
      where: { id },
      data,
    });

    return theme;
  }

  /**
   * Delete theme
   */
  async deleteTheme(id: string) {
    // Check if theme has table skins
    const theme = await prisma.themes.findUnique({
      where: { id },
      include: {
        tableSkins: true,
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.tableSkins.length > 0) {
      throw new Error('Cannot delete theme with associated table skins. Delete table skins first.');
    }

    await prisma.themes.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Create table skin
   */
  async createTableSkin(data: {
    name: string;
    description?: string;
    themeId: string;
    imageUrl?: string;
    requiredLevel?: number;
    requiredQuestId?: string;
    isPremium?: boolean;
    price?: number;
    isActive?: boolean;
  }) {
    const tableSkin = await prisma.table_skins.create({
      data: {
        name: data.name,
        description: data.description,
        themeId: data.themeId,
        imageUrl: data.imageUrl,
        requiredLevel: data.requiredLevel ?? 1,
        requiredQuestId: data.requiredQuestId,
        isPremium: data.isPremium ?? false,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    });

    return tableSkin;
  }

  /**
   * Update table skin
   */
  async updateTableSkin(id: string, data: {
    name?: string;
    description?: string;
    themeId?: string;
    imageUrl?: string;
    requiredLevel?: number;
    requiredQuestId?: string;
    isPremium?: boolean;
    price?: number;
    isActive?: boolean;
  }) {
    const tableSkin = await prisma.table_skins.update({
      where: { id },
      data,
    });

    return tableSkin;
  }

  /**
   * Delete table skin
   */
  async deleteTableSkin(id: string) {
    await prisma.table_skins.delete({
      where: { id },
    });

    return { success: true };
  }
}
