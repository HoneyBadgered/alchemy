/**
 * Cosmetics Service
 */

import { prisma } from '../utils/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

export class CosmeticsService {
  async getThemes() {
    const themes = await prisma.themes.findMany({
      where: { isActive: true },
      orderBy: { requiredLevel: 'asc' },
    });

    return themes;
  }

  async getThemeSkins(themeId: string) {
    if (!themeId) {
      throw new BadRequestError('Theme ID is required');
    }

    const theme = await prisma.themes.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundError('Theme not found');
    }

    if (!theme.isActive) {
      throw new NotFoundError('Theme is not available');
    }

    const skins = await prisma.table_skins.findMany({
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
      throw new BadRequestError('User ID is required');
    }

    const cosmetics = await prisma.player_cosmetics.findUnique({
      where: { userId },
    });

    if (!cosmetics) {
      throw new NotFoundError('Player cosmetics not found');
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
      throw new BadRequestError('User ID is required');
    }

    if (!themeId) {
      throw new BadRequestError('Theme ID is required');
    }

    // Get player state and cosmetics
    const [playerState, playerCosmetics] = await Promise.all([
      prisma.player_states.findUnique({
        where: { userId },
      }),
      prisma.player_cosmetics.findUnique({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      throw new NotFoundError('Player state not found');
    }

    if (!playerCosmetics) {
      throw new NotFoundError('Player cosmetics not found');
    }

    // Get theme
    const theme = await prisma.themes.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundError('Theme not found');
    }

    if (!theme.isActive) {
      throw new BadRequestError('Theme is not available');
    }

    // Check if player can use this theme
    const hasUnlocked = playerCosmetics.unlockedThemes.includes(themeId);
    const meetsLevel = playerState.level >= theme.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      throw new ForbiddenError(`Theme not unlocked. Required level: ${theme.requiredLevel}`);
    }

    // Update active theme
    await prisma.player_cosmetics.update({
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
      throw new BadRequestError('User ID is required');
    }

    if (!skinId) {
      throw new BadRequestError('Skin ID is required');
    }

    // Get player state and cosmetics
    const [playerState, playerCosmetics] = await Promise.all([
      prisma.player_states.findUnique({
        where: { userId },
      }),
      prisma.player_cosmetics.findUnique({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      throw new NotFoundError('Player state not found');
    }

    if (!playerCosmetics) {
      throw new NotFoundError('Player cosmetics not found');
    }

    // Get table skin
    const skin = await prisma.table_skins.findUnique({
      where: { id: skinId },
    });

    if (!skin) {
      throw new NotFoundError('Table skin not found');
    }

    if (!skin.isActive) {
      throw new BadRequestError('Table skin is not available');
    }

    // Check if player can use this skin
    const hasUnlocked = playerCosmetics.unlockedSkins.includes(skinId);
    const meetsLevel = playerState.level >= skin.requiredLevel;

    if (!hasUnlocked && !meetsLevel) {
      throw new ForbiddenError(`Table skin not unlocked. Required level: ${skin.requiredLevel}`);
    }

    // Update active skin
    await prisma.player_cosmetics.update({
      where: { userId },
      data: {
        activeTableSkinId: skinId,
        ...(hasUnlocked ? {} : { unlockedSkins: { push: skinId } }),
      },
    });

    return { success: true };
  }
}
