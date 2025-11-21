/**
 * Cosmetics Service
 */

import { prisma } from '../utils/prisma';

export class CosmeticsService {
  async getThemes() {
    const themes = await prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { requiredLevel: 'asc' },
    });

    return themes;
  }

  async getThemeSkins(themeId: string) {
    if (!themeId) {
      throw new Error('Theme ID is required');
    }

    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      const error = new Error('Theme not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!theme.isActive) {
      const error = new Error('Theme is not available');
      (error as any).statusCode = 404;
      throw error;
    }

    const skins = await prisma.tableSkin.findMany({
      where: {
        themeId,
        isActive: true,
      },
      orderBy: { requiredLevel: 'asc' },
    });

    return skins;
  }

  async getMyCosmetics(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cosmetics = await prisma.playerCosmetics.findUnique({
      where: { userId },
    });

    if (!cosmetics) {
      const error = new Error('Player cosmetics not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      unlockedThemes: cosmetics.unlockedThemes,
      unlockedSkins: cosmetics.unlockedSkins,
      activeThemeId: cosmetics.activeThemeId,
      activeTableSkinId: cosmetics.activeTableSkinId,
    };
  }

  async setTheme(userId: string, themeId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!themeId) {
      throw new Error('Theme ID is required');
    }

    // Get player state and cosmetics
    const [playerState, playerCosmetics] = await Promise.all([
      prisma.playerState.findUnique({
        where: { userId },
      }),
      prisma.playerCosmetics.findUnique({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      const error = new Error('Player state not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!playerCosmetics) {
      const error = new Error('Player cosmetics not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Get theme
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      const error = new Error('Theme not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!theme.isActive) {
      const error = new Error('Theme is not available');
      (error as any).statusCode = 400;
      throw error;
    }

    // Check if player can use this theme
    const hasUnlocked = playerCosmetics.unlockedThemes.includes(themeId);
    const meetsLevel = playerState.level >= theme.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      const error = new Error(`Theme not unlocked. Required level: ${theme.requiredLevel}`);
      (error as any).statusCode = 403;
      throw error;
    }

    // Update active theme
    await prisma.playerCosmetics.update({
      where: { userId },
      data: {
        activeThemeId: themeId,
        ...(hasUnlocked ? {} : { unlockedThemes: { push: themeId } }),
      },
    });

    return { success: true };
  }

  async setTableSkin(userId: string, skinId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!skinId) {
      throw new Error('Skin ID is required');
    }

    // Get player state and cosmetics
    const [playerState, playerCosmetics] = await Promise.all([
      prisma.playerState.findUnique({
        where: { userId },
      }),
      prisma.playerCosmetics.findUnique({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      const error = new Error('Player state not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!playerCosmetics) {
      const error = new Error('Player cosmetics not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Get table skin
    const skin = await prisma.tableSkin.findUnique({
      where: { id: skinId },
    });

    if (!skin) {
      const error = new Error('Table skin not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!skin.isActive) {
      const error = new Error('Table skin is not available');
      (error as any).statusCode = 400;
      throw error;
    }

    // Check if player can use this skin
    const hasUnlocked = playerCosmetics.unlockedSkins.includes(skinId);
    const meetsLevel = playerState.level >= skin.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      const error = new Error(`Table skin not unlocked. Required level: ${skin.requiredLevel}`);
      (error as any).statusCode = 403;
      throw error;
    }

    // Update active skin
    await prisma.playerCosmetics.update({
      where: { userId },
      data: {
        activeTableSkinId: skinId,
        ...(hasUnlocked ? {} : { unlockedSkins: { push: skinId } }),
      },
    });

    return { success: true };
  }
}
