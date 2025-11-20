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
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme || !theme.isActive) {
      throw new Error('Theme not found');
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
    const cosmetics = await prisma.playerCosmetics.findUnique({
      where: { userId },
    });

    if (!cosmetics) {
      throw new Error('Player cosmetics not found');
    }

    return {
      unlockedThemes: cosmetics.unlockedThemes,
      unlockedSkins: cosmetics.unlockedSkins,
      activeThemeId: cosmetics.activeThemeId,
      activeTableSkinId: cosmetics.activeTableSkinId,
    };
  }

  async setTheme(userId: string, themeId: string) {
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
      throw new Error('Player state not found');
    }

    if (!playerCosmetics) {
      throw new Error('Player cosmetics not found');
    }

    // Get theme
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme || !theme.isActive) {
      throw new Error('Theme not found');
    }

    // Check if player can use this theme
    const hasUnlocked = playerCosmetics.unlockedThemes.includes(themeId);
    const meetsLevel = playerState.level >= theme.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      throw new Error('Theme not unlocked');
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
      throw new Error('Player state not found');
    }

    if (!playerCosmetics) {
      throw new Error('Player cosmetics not found');
    }

    // Get table skin
    const skin = await prisma.tableSkin.findUnique({
      where: { id: skinId },
    });

    if (!skin || !skin.isActive) {
      throw new Error('Table skin not found');
    }

    // Check if player can use this skin
    const hasUnlocked = playerCosmetics.unlockedSkins.includes(skinId);
    const meetsLevel = playerState.level >= skin.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      throw new Error('Table skin not unlocked');
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
