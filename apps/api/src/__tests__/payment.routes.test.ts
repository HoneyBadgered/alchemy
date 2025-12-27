/**
 * Payment Routes Tests
 */

import Fastify, { FastifyInstance } from 'fastify';
import { paymentRoutes } from '../routes/payment.routes';
import { PaymentService } from '../services/payment.service';

// Mock the payment service
jest.mock('../services/payment.service');

// Mock stripe utils
jest.mock('../utils/stripe', () => ({
  stripe: {},
  isStripeConfigured: jest.fn().mockReturnValue(true),
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  optionalAuthMiddleware: async (request: any, reply: any) => {
    if (request.headers.authorization) {
      request.user = { userId: 'user-1' };
    }
  },
}));

describe('Payment Routes', () => {
  let app: FastifyInstance;
  let mockPaymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(paymentRoutes);
    
    mockPaymentService = jest.mocked(PaymentService.prototype);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /payments/config', () => {
    it('should return Stripe configuration status', async () => {
      const { isStripeConfigured } = require('../utils/stripe');
      isStripeConfigured.mockReturnValue(true);

      const response = await app.inject({
        method: 'GET',
        url: '/payments/config',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.configured).toBe(true);
    });

    it('should return false when Stripe is not configured', async () => {
      const { isStripeConfigured } = require('../utils/stripe');
      isStripeConfigured.mockReturnValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/payments/config',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.configured).toBe(false);
    });
  });

  describe('POST /payments/create-intent', () => {
    it('should create payment intent for authenticated user', async () => {
      const mockPaymentIntent = {
        clientSecret: 'pi_test_secret_123',
        paymentIntentId: 'pi_test_123',
        amount: 4999,
      };

      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(mockPaymentIntent);

      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          orderId: 'order-1',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clientSecret).toBe('pi_test_secret_123');
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        orderId: 'order-1',
        userId: 'user-1',
        sessionId: undefined,
      });
    });

    it('should create payment intent for guest with session ID', async () => {
      const mockPaymentIntent = {
        clientSecret: 'pi_guest_secret_123',
        paymentIntentId: 'pi_guest_123',
        amount: 2999,
      };

      mockPaymentService.createPaymentIntent = jest.fn().mockResolvedValue(mockPaymentIntent);

      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          'x-session-id': 'session-123',
        },
        payload: {
          orderId: 'order-2',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.clientSecret).toBe('pi_guest_secret_123');
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        orderId: 'order-2',
        userId: undefined,
        sessionId: 'session-123',
      });
    });

    it('should require authentication or session ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        payload: {
          orderId: 'order-1',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('authentication or x-session-id');
    });

    it('should validate orderId is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should return 503 when Stripe is not configured', async () => {
      const { isStripeConfigured } = require('../utils/stripe');
      isStripeConfigured.mockReturnValue(false);

      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          orderId: 'order-1',
        },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('not available');
      expect(body.configured).toBe(false);
    });

    it('should handle order not found error', async () => {
      mockPaymentService.createPaymentIntent = jest.fn().mockRejectedValue(
        new Error('Order not found')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          orderId: 'non-existent-order',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Order not found');
    });

    it('should handle already paid orders', async () => {
      mockPaymentService.createPaymentIntent = jest.fn().mockRejectedValue(
        new Error('Order already paid')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/payments/create-intent',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          orderId: 'paid-order',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Order already paid');
    });
  });

  describe('GET /payments/status/:orderId', () => {
    it('should get payment status for authenticated user', async () => {
      const mockStatus = {
        orderId: 'order-1',
        status: 'succeeded',
        paymentIntentId: 'pi_123',
        amount: 4999,
      };

      mockPaymentService.getPaymentStatus = jest.fn().mockResolvedValue(mockStatus);

      const response = await app.inject({
        method: 'GET',
        url: '/payments/status/order-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('succeeded');
      expect(mockPaymentService.getPaymentStatus).toHaveBeenCalledWith({
        orderId: 'order-1',
        userId: 'user-1',
        sessionId: undefined,
      });
    });

    it('should get payment status for guest with session ID', async () => {
      const mockStatus = {
        orderId: 'order-2',
        status: 'pending',
        paymentIntentId: 'pi_456',
        amount: 2999,
      };

      mockPaymentService.getPaymentStatus = jest.fn().mockResolvedValue(mockStatus);

      const response = await app.inject({
        method: 'GET',
        url: '/payments/status/order-2',
        headers: {
          'x-session-id': 'session-123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('pending');
    });

    it('should return 404 for non-existent order', async () => {
      mockPaymentService.getPaymentStatus = jest.fn().mockRejectedValue(
        new Error('Order not found')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/payments/status/non-existent',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 503 when Stripe is not configured', async () => {
      const { isStripeConfigured } = require('../utils/stripe');
      isStripeConfigured.mockReturnValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/payments/status/order-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.configured).toBe(false);
    });
  });

  describe('POST /payments/webhook', () => {
    it('should handle Stripe webhook events', async () => {
      mockPaymentService.handleWebhook = jest.fn().mockResolvedValue({
        received: true,
        eventType: 'payment_intent.succeeded',
      });

      const mockStripeSignature = 'whsec_test_signature';
      const mockPayload = JSON.stringify({
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/payments/webhook',
        headers: {
          'stripe-signature': mockStripeSignature,
        },
        payload: mockPayload,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.received).toBe(true);
    });

    it('should reject webhooks without signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments/webhook',
        payload: JSON.stringify({ type: 'test' }),
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle duplicate webhook events', async () => {
      mockPaymentService.handleWebhook = jest.fn().mockResolvedValue({
        received: true,
        duplicate: true,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/payments/webhook',
        headers: {
          'stripe-signature': 'whsec_test_signature',
        },
        payload: JSON.stringify({
          id: 'evt_duplicate',
          type: 'payment_intent.succeeded',
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.duplicate).toBe(true);
    });
  });
});
