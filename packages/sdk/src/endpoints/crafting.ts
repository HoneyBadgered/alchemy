/**
 * Crafting Endpoints
 */

import type { HttpClient } from '../client/http';
import type { Recipe } from '@alchemy/core';
import type { CraftRequest, CraftResponse } from '../types';

export class CraftingEndpoints {
  constructor(private http: HttpClient) {}

  async getRecipes(): Promise<Recipe[]> {
    return this.http.get<Recipe[]>('/recipes');
  }

  async craft(data: CraftRequest): Promise<CraftResponse> {
    return this.http.post<CraftResponse>('/craft', data);
  }
}
