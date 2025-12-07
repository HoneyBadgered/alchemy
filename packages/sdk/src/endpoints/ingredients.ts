/**
 * Ingredients API Endpoints
 */

import type { HttpClient } from '../client/http';
import type { BlendingIngredient } from '../types';

export interface GetIngredientsResponse {
  ingredients: BlendingIngredient[];
  total: number;
}

export interface GetAddInsResponse {
  addIns: BlendingIngredient[];
  botanicals: BlendingIngredient[];
  premium: BlendingIngredient[];
}

export class IngredientsEndpoints {
  constructor(private http: HttpClient) {}

  /**
   * Get all active ingredients for blending
   */
  async getIngredients(params?: {
    category?: string;
    isBase?: boolean;
  }): Promise<GetIngredientsResponse> {
    return this.http.get<GetIngredientsResponse>('/ingredients', { params });
  }

  /**
   * Get all base teas
   */
  async getBaseTeas(): Promise<GetIngredientsResponse> {
    return this.http.get<GetIngredientsResponse>('/ingredients/bases');
  }

  /**
   * Get all add-ins grouped by category
   */
  async getAddIns(): Promise<GetAddInsResponse> {
    return this.http.get<GetAddInsResponse>('/ingredients/add-ins');
  }

  /**
   * Get a single ingredient by ID
   */
  async getIngredientById(id: string): Promise<BlendingIngredient> {
    return this.http.get<BlendingIngredient>(`/ingredients/${id}`);
  }
}
