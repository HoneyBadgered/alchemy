/**
 * Profile API Client
 * Handles user profile and address management API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Profile types
export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  flavorPreferences?: string[];
  caffeinePreference?: string;
  allergyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  profile?: UserProfile;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  flavorPreferences?: string[];
  caffeinePreference?: string | null;
  allergyNotes?: string | null;
}

export interface UpdateAccountInput {
  email?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Address types
export interface Address {
  id: string;
  userId: string;
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
}

export interface AddressListResponse {
  addresses: Address[];
}

export const profileApi = {
  /**
   * Get user profile
   */
  async getProfile(token: string): Promise<UserWithProfile> {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch profile');
    }

    return response.json();
  },

  /**
   * Update user profile
   */
  async updateProfile(input: UpdateProfileInput, token: string): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  },

  /**
   * Update user account (email, username, password)
   */
  async updateAccount(input: UpdateAccountInput, token: string): Promise<UserWithProfile> {
    const response = await fetch(`${API_URL}/profile/account`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update account');
    }

    return response.json();
  },

  /**
   * Delete user account
   */
  async deleteAccount(password: string, token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/profile/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete account');
    }

    return response.json();
  },
};

export const addressApi = {
  /**
   * Get all addresses
   */
  async getAddresses(token: string): Promise<AddressListResponse> {
    const response = await fetch(`${API_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch addresses');
    }

    return response.json();
  },

  /**
   * Get a single address
   */
  async getAddress(addressId: string, token: string): Promise<Address> {
    const response = await fetch(`${API_URL}/addresses/${addressId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch address');
    }

    return response.json();
  },

  /**
   * Add a new address
   */
  async addAddress(input: CreateAddressInput, token: string): Promise<Address> {
    const response = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add address');
    }

    return response.json();
  },

  /**
   * Update an address
   */
  async updateAddress(addressId: string, input: UpdateAddressInput, token: string): Promise<Address> {
    const response = await fetch(`${API_URL}/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update address');
    }

    return response.json();
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string, token: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete address');
    }

    return response.json();
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string, token: string): Promise<Address> {
    const response = await fetch(`${API_URL}/addresses/${addressId}/default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set default address');
    }

    return response.json();
  },
};
