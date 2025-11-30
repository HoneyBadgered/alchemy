/**
 * Authentication Middleware Tests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { verifyAccessToken } from '../utils/jwt';

// Mock the jwt utils
jest.mock('../utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
  generateAccessToken: jest.fn(),
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should reject request without authorization header', async () => {
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ message: 'No authorization header' });
    });

    it('should reject request with invalid authorization format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ message: 'Invalid authorization format' });
    });

    it('should reject request with Bearer but no token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ message: 'Invalid authorization format' });
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });

    it('should set request.user for valid token', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (verifyAccessToken as jest.Mock).mockReturnValue(payload);

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toEqual(payload);
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should continue without error when no authorization header', async () => {
      await optionalAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should continue without error with invalid authorization format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await optionalAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should continue without error with Bearer but no token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await optionalAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should continue without error with invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeUndefined();
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should set request.user for valid token', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (verifyAccessToken as jest.Mock).mockReturnValue(payload);

      await optionalAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toEqual(payload);
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
});
