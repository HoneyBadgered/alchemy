/**
 * User Profile Service Tests
 */

import { UserProfileService } from '../services/user-profile.service';

// Mock dependencies
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn((pwd) => Promise.resolve(`hashed_${pwd}`)),
  verifyPassword: jest.fn((pwd, hash) => Promise.resolve(hash === `hashed_${pwd}`)),
}));

describe('UserProfileService', () => {
  let userProfileService: UserProfileService;

  beforeEach(() => {
    userProfileService = new UserProfileService();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with profile details', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        profile: {
          id: 'profile_123',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          flavorPreferences: ['floral', 'fruity'],
          caffeinePreference: 'low',
          allergyNotes: 'No nuts',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await userProfileService.getProfile('user_123');

      expect(result.id).toBe('user_123');
      expect(result.email).toBe('test@example.com');
      expect(result.user_profiles?.firstName).toBe('John');
      expect(result.user_profiles?.flavorPreferences).toEqual(['floral', 'fruity']);
    });

    it('should throw error if user not found', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(userProfileService.getProfile('invalid_user'))
        .rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should create profile if it does not exist', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.profiles.findUnique.mockResolvedValue(null);
      prisma.users.profiles.create.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await userProfileService.updateProfile('user_123', {
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(prisma.users.profiles.create).toHaveBeenCalled();
      expect(result.firstName).toBe('John');
    });

    it('should update existing profile', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.profiles.findUnique.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
      });
      prisma.users.profiles.update.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const result = await userProfileService.updateProfile('user_123', {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(prisma.users.profiles.update).toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
    });

    it('should validate flavor preferences', async () => {
      await expect(
        userProfileService.updateProfile('user_123', {
          flavorPreferences: ['invalid_flavor'],
        })
      ).rejects.toThrow('Invalid flavor preferences');
    });

    it('should accept valid flavor preferences', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.profiles.findUnique.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
      });
      prisma.users.profiles.update.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        flavorPreferences: ['floral', 'fruity', 'earthy'],
      });

      await userProfileService.updateProfile('user_123', {
        flavorPreferences: ['Floral', 'FRUITY', 'Earthy'],
      });

      expect(prisma.users.profiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flavorPreferences: ['floral', 'fruity', 'earthy'],
          }),
        })
      );
    });

    it('should validate caffeine preference', async () => {
      await expect(
        userProfileService.updateProfile('user_123', {
          caffeinePreference: 'super_high',
        })
      ).rejects.toThrow('Invalid caffeine preference');
    });

    it('should accept valid caffeine preferences', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.profiles.findUnique.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
      });
      prisma.users.profiles.update.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        caffeinePreference: 'medium',
      });

      await userProfileService.updateProfile('user_123', {
        caffeinePreference: 'MEDIUM',
      });

      expect(prisma.users.profiles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            caffeinePreference: 'medium',
          }),
        })
      );
    });
  });

  describe('updateAccount', () => {
    it('should update email', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique
        .mockResolvedValueOnce({
          id: 'user_123',
          email: 'old@example.com',
          username: 'testuser',
          password: 'hashed_password',
        })
        .mockResolvedValueOnce(null); // No user with new email

      prisma.users.update.mockResolvedValue({
        id: 'user_123',
        email: 'new@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userProfileService.updateAccount('user_123', {
        email: 'new@example.com',
      });

      expect(result.email).toBe('new@example.com');
    });

    it('should reject duplicate email', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique
        .mockResolvedValueOnce({
          id: 'user_123',
          email: 'old@example.com',
        })
        .mockResolvedValueOnce({
          id: 'user_456',
          email: 'taken@example.com',
        });

      await expect(
        userProfileService.updateAccount('user_123', {
          email: 'taken@example.com',
        })
      ).rejects.toThrow('Email is already in use');
    });

    it('should update password with current password verification', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_OldPass123',
      });

      prisma.users.update.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await userProfileService.updateAccount('user_123', {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123',
      });

      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_NewPass123',
          }),
        })
      );
    });

    it('should reject password update without current password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_password',
      });

      await expect(
        userProfileService.updateAccount('user_123', {
          newPassword: 'NewPass123',
        })
      ).rejects.toThrow('Current password is required');
    });

    it('should reject incorrect current password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_CorrectPass123',
      });

      await expect(
        userProfileService.updateAccount('user_123', {
          currentPassword: 'WrongPass123',
          newPassword: 'NewPass123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account with valid password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_ValidPass123',
      });
      prisma.users.delete.mockResolvedValue({});

      const result = await userProfileService.deleteAccount('user_123', 'ValidPass123');

      expect(result.success).toBe(true);
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
    });

    it('should reject deletion with invalid password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_CorrectPass123',
      });

      await expect(
        userProfileService.deleteAccount('user_123', 'WrongPass123')
      ).rejects.toThrow('Invalid password');

      expect(prisma.users.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        userProfileService.deleteAccount('invalid_user', 'password')
      ).rejects.toThrow('User not found');
    });
  });
});
