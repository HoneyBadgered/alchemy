/**
 * Notification Preferences Service
 * Handles user notification preferences
 */

import { prisma } from '../utils/prisma';

export interface UpdateNotificationPreferencesInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  marketingEnabled?: boolean;
  orderUpdates?: boolean;
  backInStock?: boolean;
  announcements?: boolean;
  weeklyDigest?: boolean;
  phoneNumber?: string | null;
}

export class NotificationPreferencesService {
  /**
   * Get user's notification preferences
   */
  async getPreferences(userId: string) {
    let preferences = await prisma.notification_preferences.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notification_preferences.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          marketingEnabled: true,
          orderUpdates: true,
          backInStock: true,
          announcements: true,
          weeklyDigest: false,
        },
      });
    }

    return {
      emailEnabled: preferences.emailEnabled,
      smsEnabled: preferences.smsEnabled,
      marketingEnabled: preferences.marketingEnabled,
      orderUpdates: preferences.orderUpdates,
      backInStock: preferences.backInStock,
      announcements: preferences.announcements,
      weeklyDigest: preferences.weeklyDigest,
      phoneNumber: preferences.phoneNumber,
      updatedAt: preferences.updatedAt,
    };
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(userId: string, input: UpdateNotificationPreferencesInput) {
    // Validate phone number if SMS is enabled
    if (input.smsEnabled === true && !input.phoneNumber) {
      const existing = await prisma.notification_preferences.findUnique({
        where: { userId },
      });
      if (!existing?.phoneNumber) {
        throw new Error('Phone number is required to enable SMS notifications');
      }
    }

    // Validate boolean fields
    const booleanFields = [
      'emailEnabled',
      'smsEnabled',
      'marketingEnabled',
      'orderUpdates',
      'backInStock',
      'announcements',
      'weeklyDigest',
    ] as const;

    for (const field of booleanFields) {
      if (input[field] !== undefined && typeof input[field] !== 'boolean') {
        throw new Error(`${field} must be a boolean value`);
      }
    }

    // Check if preferences exist
    const existing = await prisma.notification_preferences.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Create with provided values and defaults
      const preferences = await prisma.notification_preferences.create({
        data: {
          userId,
          emailEnabled: input.emailEnabled ?? true,
          smsEnabled: input.smsEnabled ?? false,
          marketingEnabled: input.marketingEnabled ?? true,
          orderUpdates: input.orderUpdates ?? true,
          backInStock: input.backInStock ?? true,
          announcements: input.announcements ?? true,
          weeklyDigest: input.weeklyDigest ?? false,
          phoneNumber: input.phoneNumber,
        },
      });
      return preferences;
    }

    // Update existing preferences
    const preferences = await prisma.notification_preferences.update({
      where: { userId },
      data: input,
    });

    return {
      emailEnabled: preferences.emailEnabled,
      smsEnabled: preferences.smsEnabled,
      marketingEnabled: preferences.marketingEnabled,
      orderUpdates: preferences.orderUpdates,
      backInStock: preferences.backInStock,
      announcements: preferences.announcements,
      weeklyDigest: preferences.weeklyDigest,
      phoneNumber: preferences.phoneNumber,
      updatedAt: preferences.updatedAt,
    };
  }

  /**
   * Check if user has opted in to a specific notification type
   */
  async isOptedIn(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await prisma.notification_preferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Default behavior
      switch (notificationType) {
        case 'email':
        case 'orderUpdates':
        case 'announcements':
        case 'backInStock':
          return true;
        default:
          return false;
      }
    }

    switch (notificationType) {
      case 'email':
        return preferences.emailEnabled;
      case 'sms':
        return preferences.smsEnabled && !!preferences.phoneNumber;
      case 'marketing':
        return preferences.marketingEnabled;
      case 'orderUpdates':
        return preferences.orderUpdates;
      case 'backInStock':
        return preferences.backInStock;
      case 'announcements':
        return preferences.announcements;
      case 'weeklyDigest':
        return preferences.weeklyDigest;
      default:
        return false;
    }
  }

  /**
   * Get phone number for SMS notifications (if enabled)
   */
  async getSmsPhoneNumber(userId: string): Promise<string | null> {
    const preferences = await prisma.notification_preferences.findUnique({
      where: { userId },
      select: {
        smsEnabled: true,
        phoneNumber: true,
      },
    });

    if (preferences?.smsEnabled && preferences.phoneNumber) {
      return preferences.phoneNumber;
    }

    return null;
  }
}
