/**
 * Auth Routes Tests
 */

import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from '../routes/auth.routes';
import { AuthService } from '../services/auth.service';

// Mock the auth service
jest.mock('../services/auth.service');

describe('Auth Routes', () => {
  let app: FastifyInstance;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(authRoutes);
    
    mockAuthService = jest.mocked(AuthService.prototype);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResult = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        users: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.register = jest.fn().mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!',
          username: 'testuser',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockResult);
    });

    it('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'Password123!',
          username: 'testuser',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should reject registration with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'short',
          username: 'testuser',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should reject registration with short username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password123!',
          username: 'ab',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should handle duplicate email error', async () => {
      mockAuthService.register = jest.fn().mockRejectedValue(
        new Error('Email already in use')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'existing@example.com',
          password: 'Password123!',
          username: 'testuser',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Email already in use');
    });

    it('should reject registration with missing body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Request body is required');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResult = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        users: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.login = jest.fn().mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('accessToken', 'test-access-token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('test@example.com');

      // Check that refresh token is set as cookie
      const cookies = response.cookies;
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie?.value).toBe('test-refresh-token');
    });

    it('should reject login with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'invalid-email',
          password: 'Password123!',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should reject login with incorrect credentials', async () => {
      mockAuthService.login = jest.fn().mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should reject login with missing body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Request body is required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          refreshToken: 'test-refresh-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken = jest.fn().mockResolvedValue(mockResult);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'old-refresh-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.accessToken).toBe('new-access-token');
    });

    it('should reject refresh with invalid token', async () => {
      mockAuthService.refreshToken = jest.fn().mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /auth/password-reset-request', () => {
    it('should send password reset email successfully', async () => {
      mockAuthService.requestPasswordReset = jest.fn().mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/password-reset-request',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Password reset email sent');
    });

    it('should reject invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/password-reset-request',
        payload: {
          email: 'invalid-email',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });
  });

  describe('POST /auth/password-reset', () => {
    it('should reset password successfully', async () => {
      mockAuthService.resetPassword = jest.fn().mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/password-reset',
        payload: {
          token: 'reset-token',
          newPassword: 'NewPassword123!',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Password reset successfully');
    });

    it('should reject short passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/password-reset',
        payload: {
          token: 'reset-token',
          newPassword: 'short',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should reject invalid reset token', async () => {
      mockAuthService.resetPassword = jest.fn().mockRejectedValue(
        new Error('Invalid or expired reset token')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/auth/password-reset',
        payload: {
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid or expired reset token');
    });
  });
});
