/**
 * Simple Email Service Test
 * Run with: npx tsx src/scripts/test-email-simple.ts
 */

import { EmailService } from '../services/email.service';

async function testEmail() {
  const emailService = new EmailService();
  
  console.log('🧪 Testing Email Service...');
  console.log('');

  // Test 1: Contact Form Notification
  console.log('📧 Testing Contact Form Notification...');
  try {
    await emailService.sendContactFormNotification({
      name: 'Test User',
      email: 'testuser@example.com',
      subject: 'Test Contact Form Submission',
      message: 'This is a test message from the email service test script.'
    });
    console.log('✅ Contact form notification sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send contact form notification:');
    console.error(error);
  }

  console.log('');

  // Test 2: Contact Form Confirmation
  console.log('📧 Testing Contact Form Confirmation...');
  try {
    await emailService.sendContactFormConfirmation({
      name: 'Test User',
      email: 'testuser@example.com',
      subject: 'Test Contact Form Submission'
    });
    console.log('✅ Contact form confirmation sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send contact form confirmation:');
    console.error(error);
  }

  console.log('');

  // Test 3: Verification Email
  console.log('📧 Testing Verification Email...');
  try {
    await emailService.sendVerificationEmail('testuser@example.com', 'test-token-123');
    console.log('✅ Verification email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send verification email:');
    console.error(error);
  }

  console.log('');

  // Test 4: Password Reset Email
  console.log('📧 Testing Password Reset Email...');
  try {
    await emailService.sendPasswordResetEmail('testuser@example.com', 'test-reset-token-456');
    console.log('✅ Password reset email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send password reset email:');
    console.error(error);
  }

  console.log('');
  console.log('🎉 All email service tests completed!');
  console.log('');
  console.log('Note: If no SMTP configuration is provided, emails are logged to console.');
  console.log('To test with a real SMTP server, set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in your .env file.');
  
  process.exit(0);
}

testEmail();
