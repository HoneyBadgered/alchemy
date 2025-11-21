/**
 * PaymentService Unit Tests
 */

import { PaymentService } from '../services/payment.service';
import Stripe from 'stripe';

// Mock Prisma Client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderStatusLog: {
      create: jest.fn(),
    },
    stripeWebhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
  };
});

// Mock Stripe
jest.mock('../utils/stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  return {
    stripe: mockStripe,
    STRIPE_PAYMENT_SUCCESS_STATUSES: ['succeeded'],
    STRIPE_PAYMENT_PENDING_STATUSES: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'],
    STRIPE_PAYMENT_FAILED_STATUSES: ['canceled'],
  };
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPrisma: any;
  let mockStripe: any;

  beforeEach(() => {
    paymentService = new PaymentService();
    mockPrisma = require('../utils/prisma').prisma;
    mockStripe = require('../utils/stripe').stripe;
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should throw error if order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        paymentService.createPaymentIntent({
          orderId: 'order-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if order already paid', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: 100.00,
        stripePaymentId: 'pi_test_123',
        user: { email: 'test@example.com' },
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      await expect(
        paymentService.createPaymentIntent({
          orderId: 'order-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Order has already been paid');
    });

    it('should return existing payment intent if still valid', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: 100.00,
        stripePaymentId: 'pi_test_123',
        user: { email: 'test@example.com' },
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_payment_method',
        client_secret: 'pi_test_123_secret',
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.createPaymentIntent({
        orderId: 'order-1',
        userId: 'user-1',
      });

      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(result.clientSecret).toBe('pi_test_123_secret');
    });

    it('should create new payment intent for order', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        totalAmount: 100.00,
        status: 'pending',
        stripePaymentId: null,
        user: { email: 'test@example.com' },
      };

      const mockPaymentIntent = {
        id: 'pi_new_123',
        status: 'requires_payment_method',
        client_secret: 'pi_new_123_secret',
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.createPaymentIntent({
        orderId: 'order-1',
        userId: 'user-1',
      });

      expect(result.paymentIntentId).toBe('pi_new_123');
      expect(result.clientSecret).toBe('pi_new_123_secret');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          stripePaymentId: 'pi_new_123',
          stripePaymentStatus: 'requires_payment_method',
          stripeClientSecret: 'pi_new_123_secret',
          status: 'payment_processing',
        },
      });
    });
  });

  describe('getPaymentStatus', () => {
    it('should throw error if order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        paymentService.getPaymentStatus('order-1', 'user-1')
      ).rejects.toThrow('Order not found');
    });

    it('should return no_payment if no stripe payment id', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'pending',
        stripePaymentId: null,
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await paymentService.getPaymentStatus('order-1', 'user-1');

      expect(result.status).toBe('no_payment');
      expect(result.orderId).toBe('order-1');
    });

    it('should return payment status from Stripe', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'payment_processing',
        stripePaymentId: 'pi_test_123',
        stripePaymentStatus: 'requires_payment_method',
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.getPaymentStatus('order-1', 'user-1');

      expect(result.status).toBe('succeeded');
      expect(result.paymentIntentId).toBe('pi_test_123');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should skip already processed events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        object: 'event',
        api_version: '2024-11-20.acacia',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: null,
        data: {
          object: {
            id: 'pi_test_123',
            metadata: { orderId: 'order-1' },
          },
        },
      } as unknown as Stripe.Event;

      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue({
        id: 'webhook-1',
        eventId: 'evt_test_123',
        processed: true,
      });

      await paymentService.handleWebhookEvent(mockEvent);

      // Should not process again
      expect(mockPrisma.stripeWebhookEvent.upsert).not.toHaveBeenCalled();
    });

    it('should process new webhook events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        object: 'event',
        api_version: '2024-11-20.acacia',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: null,
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            metadata: { orderId: 'order-1' },
          },
        },
      } as unknown as Stripe.Event;

      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'payment_processing',
      };

      mockPrisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeWebhookEvent.upsert.mockResolvedValue({
        id: 'webhook-1',
        eventId: 'evt_test_123',
      });
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await paymentService.handleWebhookEvent(mockEvent);

      expect(mockPrisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: {
          processed: true,
          processedAt: expect.any(Date),
        },
      });
    });
  });
});
