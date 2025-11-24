/**
 * Stripe Utils Tests
 * Tests for the Stripe lazy initialization and optional configuration
 */

// Mock config before importing anything
jest.mock('../config', () => ({
  config: {
    stripeSecretKey: undefined,
    isDevelopment: true,
  },
}));

describe('Stripe Utils', () => {
  beforeEach(() => {
    // Clear module cache to test different configurations
    jest.resetModules();
  });

  it('should allow importing stripe module without configuration', () => {
    // Mock config without Stripe key
    jest.doMock('../config', () => ({
      config: {
        stripeSecretKey: undefined,
        isDevelopment: true,
      },
    }));

    // This should not throw an error during import
    expect(() => {
      require('../utils/stripe');
    }).not.toThrow();
  });

  it('should check if Stripe is configured', () => {
    // Mock config with Stripe key
    jest.doMock('../config', () => ({
      config: {
        stripeSecretKey: 'sk_test_123',
        isDevelopment: true,
      },
    }));

    const { isStripeConfigured } = require('../utils/stripe');
    expect(isStripeConfigured()).toBe(true);
  });

  it('should check if Stripe is not configured', () => {
    // Mock config without Stripe key
    jest.doMock('../config', () => ({
      config: {
        stripeSecretKey: undefined,
        isDevelopment: true,
      },
    }));

    const { isStripeConfigured } = require('../utils/stripe');
    expect(isStripeConfigured()).toBe(false);
  });

  it('should throw error when using Stripe without configuration in development', () => {
    // Mock config without Stripe key
    jest.doMock('../config', () => ({
      config: {
        stripeSecretKey: undefined,
        isDevelopment: true,
      },
    }));

    const { stripe } = require('../utils/stripe');

    // Accessing any Stripe method should throw with development message
    expect(() => {
      stripe.paymentIntents.create({});
    }).toThrow(/STRIPE_SECRET_KEY is not configured.*development mode/);
  });

  it('should throw error when using Stripe without configuration in production', () => {
    // Mock config without Stripe key in production
    jest.doMock('../config', () => ({
      config: {
        stripeSecretKey: undefined,
        isDevelopment: false,
      },
    }));

    const { stripe } = require('../utils/stripe');

    // Accessing any Stripe method should throw
    expect(() => {
      stripe.paymentIntents.create({});
    }).toThrow('STRIPE_SECRET_KEY is not configured');
  });
});
