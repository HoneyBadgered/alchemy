/**
 * Gamification Endpoints
 */

import type { HttpClient } from '../client/http';
import type { PlayerProgress, PlayerQuest, InventoryItem } from '../types';

export class GamificationEndpoints {
  constructor(private http: HttpClient) {}

  async getProgress(): Promise<PlayerProgress> {
    return this.http.get<PlayerProgress>('/me/progress');
  }

  async getQuests(): Promise<PlayerQuest[]> {
    return this.http.get<PlayerQuest[]>('/me/quests');
  }

  async claimQuest(questId: string): Promise<{ success: boolean; xpGained?: number }> {
    return this.http.post(`/me/quests/${questId}/claim`);
  }

  async getInventory(): Promise<InventoryItem[]> {
    return this.http.get<InventoryItem[]>('/me/inventory');
  }
}
