/**
 * User Profile Service
 * Handles user profile management including profile data, preferences, and account operations
 */

import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import crypto from 'crypto';

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

const VALID_FLAVOR_PREFERENCES = ['floral', 'fruity', 'earthy', 'smoky', 'sweet', 'herbal'];
const VALID_CAFFEINE_PREFERENCES = ['none', 'low', 'medium', 'high'];

export class UserProfileService {
  /**
   * Get user profile details
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        user_profiles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            flavorPreferences: true,
            caffeinePreference: true,
            allergyNotes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile details
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Validate flavor preferences if provided
    if (input.flavorPreferences) {
      const invalidFlavors = input.flavorPreferences.filter(
        (f) => !VALID_FLAVOR_PREFERENCES.includes(f.toLowerCase())
      );
      if (invalidFlavors.length > 0) {
        throw new Error(`Invalid flavor preferences: ${invalidFlavors.join(', ')}. Valid options are: ${VALID_FLAVOR_PREFERENCES.join(', ')}`);
      }
      input.flavorPreferences = input.flavorPreferences.map((f) => f.toLowerCase());
    }

    // Validate caffeine preference if provided
    if (input.caffeinePreference) {
      if (!VALID_CAFFEINE_PREFERENCES.includes(input.caffeinePreference.toLowerCase())) {
        throw new Error(`Invalid caffeine preference. Valid options are: ${VALID_CAFFEINE_PREFERENCES.join(', ')}`);
      }
      input.caffeinePreference = input.caffeinePreference.toLowerCase();
    }

    // Check if profile exists
    const existingProfile = await prisma.user_profiles.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const profile = await prisma.user_profiles.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          ...input,
        },
      });
      return profile;
    }

    // Update existing profile
    const profile = await prisma.user_profiles.update({
      where: { userId },
      data: input,
    });

    return profile;
  }

  /**
   * Update user account details (email, username, password)
   */
  async updateAccount(userId: string, input: UpdateAccountInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateData: { email?: string; username?: string; password?: string } = {};

    // Handle email update
    if (input.email && input.email !== user.email) {
      const normalizedEmail = input.email.toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        throw new Error('Email is already in use');
      }
      updateData.email = normalizedEmail;
    }

    // Handle username update
    if (input.username && input.username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existingUser) {
        throw new Error('Username is already in use');
      }
      if (input.username.length < 3 || input.username.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
      }
      updateData.username = input.username;
    }

    // Handle password update
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new Error('Current password is required to set a new password');
      }
      
      const isValid = await verifyPassword(input.currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      this.validatePasswordStrength(input.newPassword);
      updateData.password = await hashPassword(input.newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password before deletion
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Delete user (cascades to all related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: 'Account deleted successfully' };
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }
}
