/**
 * Email Service
 */

import nodemailer from 'nodemailer';
import { config } from '../config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter
    // In development, use ethereal email for testing
    // In production, use a real SMTP service
    if (config.email.host && config.email.port) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.user && config.email.pass ? {
          user: config.email.user,
          pass: config.email.pass,
        } : undefined,
      });
    } else {
      // Fallback to console logging if no email config
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      } as any);
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });

      if (config.isDevelopment) {
        console.log('Email sent:', info.messageId);
        if (info.response && typeof info.response === 'object' && 'toString' in info.response) {
          console.log('Preview:', info.response.toString());
        }
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${config.app.url}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 6px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to The Alchemy Table!</h2>
            <p>Thank you for registering. Please verify your email address to activate your account.</p>
            <p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to The Alchemy Table!

Thank you for registering. Please verify your email address by visiting:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.
    `;

    await this.sendEmail({
      to,
      subject: 'Verify Your Email - The Alchemy Table',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.app.url}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 6px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for The Alchemy Table.</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

We received a request to reset your password for The Alchemy Table.

Please visit the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `;

    await this.sendEmail({
      to,
      subject: 'Password Reset - The Alchemy Table',
      html,
      text,
    });
  }
}
