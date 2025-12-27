/**
 * Authentication Flow Integration Tests
 * Tests the complete authentication journey from registration to protected routes
 */

import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from '../routes/auth.routes';
import { AuthService } from '../services/auth.service';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refresh_tokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    password_reset_tokens: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-1' }),
}));

describe('Authentication Flow Integration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(authRoutes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Complete Registration Flow', () => {
    it('should register, verify email, and login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        username: 'newuser',
        passwordHash: 'hashed-password',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Step 1: Register new user
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.users.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
      });

      const registerResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          username: 'newuser',
        },
      });

      expect(registerResponse.statusCode).toBe(201);
      const registerBody = JSON.parse(registerResponse.body);
      expect(registerBody).toHaveProperty('accessToken');
      expect(registerBody).toHaveProperty('refreshToken');

      // Step 2: Verify email (simulated)
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      (prisma.users.update as jest.Mock).mockResolvedValue(verifiedUser);

      // Step 3: Login with verified account
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(verifiedUser);
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-2',
        token: 'new-refresh-token',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginBody = JSON.parse(loginResponse.body);
      expect(loginBody).toHaveProperty('accessToken');
      expect(loginBody.user.email).toBe('newuser@example.com');
    });
  });

  describe('Password Reset Flow', () => {
    it('should request reset, receive token, and reset password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
        passwordHash: 'old-hashed-password',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Step 1: Request password reset
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.password_reset_tokens.create as jest.Mock).mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        token: 'reset-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const resetRequestResponse = await app.inject({
        method: 'POST',
        url: '/auth/password-reset-request',
        payload: {
          email: 'user@example.com',
        },
      });

      expect(resetRequestResponse.statusCode).toBe(200);

      // Step 2: Reset password with token
      (prisma.password_reset_tokens.findFirst as jest.Mock).mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        token: 'reset-token',
        expiresAt: new Date(Date.now() + 3600000),
      });
      (prisma.users.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });
      (prisma.password_reset_tokens.delete as jest.Mock).mockResolvedValue({});
      (prisma.refresh_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const resetResponse = await app.inject({
        method: 'POST',
        url: '/auth/password-reset',
        payload: {
          token: 'reset-token',
          newPassword: 'NewSecurePass123!',
        },
      });

      expect(resetResponse.statusCode).toBe(200);

      // Step 3: Login with new password
      (prisma.users.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      });
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-3',
        token: 'refresh-after-reset',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'NewSecurePass123!',
        },
      });

      expect(loginResponse.statusCode).toBe(200);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token when expired', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      };

      // Step 1: Initial login
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: 'initial-refresh-token',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(loginResponse.statusCode).toBe(200);
      const loginBody = JSON.parse(loginResponse.body);
      const initialAccessToken = loginBody.accessToken;

      // Step 2: Refresh token after access token expires
      (prisma.refresh_tokens.findFirst as jest.Mock).mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        token: 'initial-refresh-token',
        expiresAt: new Date(Date.now() + 86400000),
      });
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-2',
        token: 'new-refresh-token',
      });

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'initial-refresh-token',
        },
      });

      expect(refreshResponse.statusCode).toBe(200);
      const refreshBody = JSON.parse(refreshResponse.body);
      expect(refreshBody).toHaveProperty('accessToken');
      expect(refreshBody.accessToken).not.toBe(initialAccessToken);
    });
  });

  describe('Logout Flow', () => {
    it('should logout and invalidate refresh token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
      };

      // Step 1: Login
      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
      });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'SecurePass123!',
        },
      });

      expect(loginResponse.statusCode).toBe(200);

      // Step 2: Logout
      (prisma.refresh_tokens.findFirst as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
      });
      (prisma.refresh_tokens.delete as jest.Mock).mockResolvedValue({});

      const logoutResponse = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: 'Bearer mock-token',
        },
        payload: {
          refreshToken: 'refresh-token',
        },
      });

      expect(logoutResponse.statusCode).toBe(200);

      // Step 3: Try to refresh with invalidated token (should fail)
      (prisma.refresh_tokens.findFirst as jest.Mock).mockResolvedValue(null);

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'refresh-token',
        },
      });

      expect(refreshResponse.statusCode).toBe(400);
    });
  });

  describe('Security: Failed Login Attempts', () => {
    it('should handle multiple failed login attempts', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        username: 'testuser',
        passwordHash: 'correct-hash',
      };

      (prisma.users.findFirst as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt to return false for wrong password
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      // Attempt 1
      const attempt1 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        },
      });

      expect(attempt1.statusCode).toBe(400);

      // Attempt 2
      const attempt2 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'AlsoWrong123!',
        },
      });

      expect(attempt2.statusCode).toBe(400);

      // Successful login with correct password
      bcrypt.compare.mockResolvedValue(true);
      (prisma.refresh_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        token: 'refresh-token',
      });

      const successfulLogin = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'CorrectPassword123!',
        },
      });

      expect(successfulLogin.statusCode).toBe(200);
    });
  });
});
