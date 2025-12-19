/**
 * Blend API Client
 * Client for managing custom tea blends
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BlendAddIn {
  ingredientId: string;
  quantity: number;
}

export interface Blend {
  id: string;
  userId?: string;
  sessionId?: string;
  name?: string;
  baseTeaId: string;
  addIns: BlendAddIn[];
  productId?: string;
  createdAt: string;
  updatedAt: string;
  products?: any; // Product details if populated
}

export interface SaveBlendParams {
  name?: string;
  baseTeaId: string;
  addIns: BlendAddIn[];
  productId?: string;
}

export const blendApi = {
  /**
   * Get all blends for user or session
   */
  async getBlends(token?: string, sessionId?: string): Promise<{ blends: Blend[] }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/blends`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blends');
    }

    return response.json();
  },

  /**
   * Get a specific blend by ID
   */
  async getBlendById(
    id: string,
    token?: string,
    sessionId?: string
  ): Promise<Blend> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/blends/${id}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch blend');
    }

    return response.json();
  },

  /**
   * Save a new blend
   */
  async saveBlend(
    data: SaveBlendParams,
    token?: string,
    sessionId?: string
  ): Promise<Blend> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/blends`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save blend');
    }

    return response.json();
  },

  /**
   * Update blend name
   */
  async updateBlendName(
    id: string,
    name: string,
    token?: string,
    sessionId?: string
  ): Promise<Blend> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/blends/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update blend');
    }

    return response.json();
  },

  /**
   * Delete a blend
   */
  async deleteBlend(
    id: string,
    token?: string,
    sessionId?: string
  ): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/blends/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete blend');
    }

    return response.json();
  },

  /**
   * Migrate guest blends to user account (after login)
   */
  async migrateGuestBlends(
    sessionId: string,
    token: string
  ): Promise<{ migrated: number }> {
    const response = await fetch(`${API_URL}/blends/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to migrate blends');
    }

    return response.json();
  },
};
