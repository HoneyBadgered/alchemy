/**
 * Cosmetics Endpoints
 */

import type { HttpClient } from '../client/http';
import type { Theme, TableSkin, PlayerCosmetics } from '@alchemy/core';

export class CosmeticsEndpoints {
  constructor(private http: HttpClient) {}

  async getThemes(): Promise<Theme[]> {
    return this.http.get<Theme[]>('/cosmetics/themes');
  }

  async getThemeSkins(themeId: string): Promise<TableSkin[]> {
    return this.http.get<TableSkin[]>(`/cosmetics/themes/${themeId}/skins`);
  }

  async getMyCosmetics(): Promise<PlayerCosmetics> {
    return this.http.get<PlayerCosmetics>('/me/cosmetics');
  }

  async setTheme(themeId: string): Promise<{ success: boolean }> {
    return this.http.post('/me/cosmetics/theme', { themeId });
  }

  async setTableSkin(skinId: string): Promise<{ success: boolean }> {
    return this.http.post('/me/cosmetics/table-skin', { skinId });
  }
}
