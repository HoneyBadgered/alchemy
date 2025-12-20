/**
 * Authentication Service
 */

import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateSecureToken, hashToken } from '../utils/token';
import { EmailService } from './email.service';
import crypto from 'crypto';

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetInput {
  token: string;
  newPassword: string;
}

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
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

  async register(input: RegisterInput) {
    // Validate password strength
    this.validatePasswordStrength(input.password);

    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = input.email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: input.username },
        ],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Generate email verification token
    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with initial player state and profile
    const userId = crypto.randomUUID();
    const user = await prisma.users.create({
      data: {
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        username: input.username,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpires,
        updatedAt: new Date(),
        user_profiles: {
          create: {
            id: crypto.randomUUID(),
            updatedAt: new Date(),
          },
        },
        player_states: {
          create: {
            id: crypto.randomUUID(),
            level: 1,
            xp: 0,
            totalXp: 0,
            updatedAt: new Date(),
          },
        },
        player_cosmetics: {
          create: {
            id: crypto.randomUUID(),
            unlockedThemes: [],
            unlockedSkins: [],
            updatedAt: new Date(),
          },
        },
      },
      include: {
        player_states: true,
        user_profiles: true,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      users: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    };
  }

  async login(input: LoginInput) {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = input.email.toLowerCase();

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(input.password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login (only if player_states exists - admin users may not have one)
    try {
      await prisma.player_states.update({
        where: { userId: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      // Player state doesn't exist - this is fine for admin users
      console.log(`No player state for user ${user.id} - skipping lastLoginAt update`);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      users: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    };
  }

  async logout(userId: string, refreshToken: string) {
    // Remove the specific refresh token
    const hashedToken = hashToken(refreshToken);
    await prisma.refresh_tokens.deleteMany({
      where: {
        userId,
        token: hashedToken,
      },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.users.findUnique({
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
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = input.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    // Don't reveal if user exists for security
    if (!user) {
      return { message: 'If an account exists, a password reset email has been sent' };
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const hashedResetToken = hashToken(resetToken);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If an account exists, a password reset email has been sent' };
  }

  async resetPassword(input: PasswordResetInput) {
    // Validate password strength
    this.validatePasswordStrength(input.newPassword);

    const hashedToken = hashToken(input.token);

    // Find user with valid reset token
    const user = await prisma.users.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(input.newPassword);

    // Update password and clear reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all refresh tokens for security
    await prisma.refresh_tokens.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const hashedToken = hashToken(token);

    // Find user with valid verification token
    const user = await prisma.users.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified and clear token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists and is not verified, a verification email has been sent' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.users.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return { message: 'If an account exists and is not verified, a verification email has been sent' };
  }

  async verifyRefreshToken(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);

    const storedToken = await prisma.refresh_tokens.findUnique({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    return storedToken.users;
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refresh_tokens.create({
      data: {
        id: crypto.randomUUID(),
        token: hashedToken,
        userId,
        expiresAt,
      },
    });
  }
}
