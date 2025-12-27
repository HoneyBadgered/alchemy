/**
 * Email Utility for Web App Contact Form
 */

import nodemailer from 'nodemailer';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send contact form submission emails
 */
export async function sendContactFormEmails(data: ContactFormData): Promise<void> {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@alchemytable.com';
  const adminEmail = process.env.ADMIN_EMAIL || 'support@alchemytable.com';

  // Create transporter
  let transporter: nodemailer.Transporter;
  
  if (emailHost && emailPort) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: emailUser && emailPass ? {
        user: emailUser,
        pass: emailPass,
      } : undefined,
    });
  } else {
    // Fallback to console logging if no email config
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    } as nodemailer.TransportOptions);
  }

  // Send notification to admin
  await sendAdminNotification(transporter, emailFrom, adminEmail, data);
  
  // Send confirmation to user
  await sendUserConfirmation(transporter, emailFrom, data);
}

/**
 * Send notification email to admin
 */
async function sendAdminNotification(
  transporter: nodemailer.Transporter,
  from: string,
  adminEmail: string,
  data: ContactFormData
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9333ea; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 6px 6px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #555; }
          .field-value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #9333ea; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${data.name} (${data.email})</div>
            </div>
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${data.subject}</div>
            </div>
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>Received: ${new Date().toLocaleString()}</p>
              <p>Reply to: ${data.email}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Contact Form Submission

From: ${data.name} (${data.email})
Subject: ${data.subject}

Message:
${data.message}

Received: ${new Date().toLocaleString()}
Reply to: ${data.email}
  `.trim();

  const info = await transporter.sendMail({
    from,
    to: adminEmail,
    subject: `Contact Form: ${data.subject}`,
    html,
    text,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('Admin notification sent:', info.messageId);
    if (info.response && typeof info.response === 'object' && 'toString' in info.response) {
      console.log('Preview:', info.response.toString());
    }
  }
}

/**
 * Send confirmation email to user
 */
async function sendUserConfirmation(
  transporter: nodemailer.Transporter,
  from: string,
  data: ContactFormData
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9333ea; color: white; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 6px 6px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✓ Message Received</h2>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>Thank you for contacting The Alchemy Table! We've received your message about "${data.subject}" and will get back to you as soon as possible.</p>
            <p>Our team typically responds within 24-48 hours during business days.</p>
            <div class="footer">
              <p>If you have any urgent concerns, please call us at (555) 123-4567.</p>
              <p>© ${new Date().getFullYear()} The Alchemy Table</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Message Received

Hi ${data.name},

Thank you for contacting The Alchemy Table! We've received your message about "${data.subject}" and will get back to you as soon as possible.

Our team typically responds within 24-48 hours during business days.

If you have any urgent concerns, please call us at (555) 123-4567.

© ${new Date().getFullYear()} The Alchemy Table
  `.trim();

  const info = await transporter.sendMail({
    from,
    to: data.email,
    subject: 'We received your message - The Alchemy Table',
    html,
    text,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('User confirmation sent:', info.messageId);
    if (info.response && typeof info.response === 'object' && 'toString' in info.response) {
      console.log('Preview:', info.response.toString());
    }
  }
}
