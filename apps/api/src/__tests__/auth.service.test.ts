/**
 * Auth Service Tests
 */

import { AuthService } from '../services/auth.service';

// Mock dependencies
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    playerState: {
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  })),
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn((pwd) => Promise.resolve(`hashed_${pwd}`)),
  verifyPassword: jest.fn((pwd, hash) => Promise.resolve(hash === `hashed_${pwd}`)),
}));

jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'access_token'),
  generateRefreshToken: jest.fn(() => 'refresh_token'),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a user with strong password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: false,
        createdAt: new Date(),
        profile: {},
        playerState: { level: 1, xp: 0 },
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'StrongPass123',
        username: 'testuser',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('user');
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
      expect(prisma.users.create).toHaveBeenCalled();
      expect(prisma.refresh_tokens.create).toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'weak',
          username: 'testuser',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'weakpass123',
          username: 'testuser',
        })
      ).rejects.toThrow('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'WeakPassword',
          username: 'testuser',
        })
      ).rejects.toThrow('Password must contain at least one number');
    });

    it('should reject duplicate email', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue({
        id: 'existing_user',
        email: 'test@example.com',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'StrongPass123',
          username: 'testuser',
        })
      ).rejects.toThrow('User with this email or username already exists');
    });

    it('should normalize email to lowercase during registration', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        emailVerified: false,
        createdAt: new Date(),
        profile: {},
        playerState: { level: 1, xp: 0 },
      });

      await authService.register({
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123',
        username: 'testuser',
      });

      // Verify that create was called with lowercase email
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        password: 'hashed_StrongPass123',
        emailVerified: true,
        createdAt: new Date(),
      });

      prisma.player_states.update.mockResolvedValue({});

      const result = await authService.login({
        email: 'test@example.com',
        password: 'StrongPass123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('user');
      expect(result.accessToken).toBe('access_token');
      expect(prisma.player_states.update).toHaveBeenCalled();
    });

    it('should return admin role for admin users', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'admin_123',
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'admin',
        password: 'hashed_AdminPass123',
        emailVerified: true,
        createdAt: new Date(),
      });

      prisma.player_states.update.mockResolvedValue({});

      const result = await authService.login({
        email: 'admin@example.com',
        password: 'AdminPass123',
      });

      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.role).toBe('admin');
      expect(result.accessToken).toBe('access_token');
    });

    it('should reject invalid credentials', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'StrongPass123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject wrong password', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_CorrectPass123',
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPass123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should login with uppercase email (case-insensitive)', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        password: 'hashed_StrongPass123',
        emailVerified: true,
        createdAt: new Date(),
      });

      prisma.player_states.update.mockResolvedValue({});

      const result = await authService.login({
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access_token');
      // Verify that findUnique was called with lowercase email
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should login with mixed case email (case-insensitive)', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'admin_123',
        email: 'admin@alchemy.dev',
        username: 'admin',
        role: 'admin',
        password: 'hashed_Admin123!',
        emailVerified: true,
        createdAt: new Date(),
      });

      prisma.player_states.update.mockResolvedValue({});

      const result = await authService.login({
        email: 'Admin@Alchemy.Dev',
        password: 'Admin123!',
      });

      expect(result.user.email).toBe('admin@alchemy.dev');
      expect(result.user.role).toBe('admin');
      // Verify that findUnique was called with lowercase email
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@alchemy.dev' },
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      });

      prisma.users.update.mockResolvedValue({});

      const result = await authService.requestPasswordReset({
        email: 'test@example.com',
      });

      expect(result.message).toContain('password reset email');
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should not reveal if user does not exist', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findUnique.mockResolvedValue(null);

      const result = await authService.requestPasswordReset({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toContain('password reset email');
      expect(prisma.users.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      });

      prisma.users.update.mockResolvedValue({});

      const result = await authService.resetPassword({
        token: 'valid_token',
        newPassword: 'NewPass123',
      });

      expect(result.message).toBe('Password reset successful');
      expect(prisma.users.update).toHaveBeenCalled();
      expect(prisma.refresh_tokens.deleteMany).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalid_token',
          newPassword: 'NewPass123',
        })
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should validate new password strength', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      });

      await expect(
        authService.resetPassword({
          token: 'valid_token',
          newPassword: 'weak',
        })
      ).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      });

      prisma.users.update.mockResolvedValue({});

      const result = await authService.verifyEmail('valid_token');

      expect(result.message).toBe('Email verified successfully');
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
    });

    it('should reject invalid verification token', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.users.findFirst.mockResolvedValue(null);

      await expect(
        authService.verifyEmail('invalid_token')
      ).rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token', async () => {
      const { prisma } = require('../utils/prisma');
      
      await authService.logout('user_123', 'refresh_token');

      expect(prisma.refresh_tokens.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          token: expect.any(String),
        },
      });
    });
  });
});
