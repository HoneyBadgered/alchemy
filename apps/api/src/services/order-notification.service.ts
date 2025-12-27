/**
 * Order Notification Service
 * Handles email notifications for order lifecycle events
 */

import { EmailService } from './email.service';
import { prisma } from '../utils/prisma';
import { config } from '../config';

export interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  orderNumber?: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface ShippingEmailData extends OrderEmailData {
  trackingNumber: string;
  carrierName: string;
  shippedAt: Date;
  trackingUrl?: string;
}

export class OrderNotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send order confirmation email after successful payment
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<void> {
    const { customerEmail, orderId, totalAmount, items } = data;

    const itemsList = items
      .map((item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            .total { font-size: 1.2em; font-weight: bold; padding-top: 15px; border-top: 2px solid #667eea; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Order Confirmed!</h1>
              <p>Thank you for your order</p>
            </div>
            <div class="content">
              <p>Hi${data.customerName ? ` ${data.customerName}` : ''},</p>
              <p>We've received your order and are preparing it for shipment. Here are your order details:</p>
              
              <div class="order-details">
                <h3>Order #${orderId}</h3>
                <table>
                  <thead>
                    <tr style="background: #f0f0f0;">
                      <th style="padding: 8px; text-align: left;">Product</th>
                      <th style="padding: 8px; text-align: center;">Qty</th>
                      <th style="padding: 8px; text-align: right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>
                <div class="total">
                  Total: $${totalAmount.toFixed(2)}
                </div>
              </div>

              <p>You'll receive another email with tracking information once your order ships.</p>
              
              <a href="${config.app.url}/orders/${orderId}" class="button">View Order Status</a>
              
              <div class="footer">
                <p>Questions? Contact us at support@alchemytable.com</p>
                <p>© ${new Date().getFullYear()} The Alchemy Table</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Order Confirmed!

Thank you for your order${data.customerName ? `, ${data.customerName}` : ''}.

Order #${orderId}
${items.map(item => `${item.productName} x${item.quantity} - $${item.price.toFixed(2)}`).join('\n')}

Total: $${totalAmount.toFixed(2)}

You'll receive another email with tracking information once your order ships.

View your order status: ${config.app.url}/orders/${orderId}

Questions? Contact us at support@alchemytable.com
    `.trim();

    await this.emailService.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation #${orderId}`,
      html,
      text,
    });
  }

  /**
   * Send shipping notification when order is shipped
   */
  async sendShippingNotification(data: ShippingEmailData): Promise<void> {
    const { customerEmail, orderId, trackingNumber, carrierName, shippedAt, items } = data;

    // Generate tracking URL based on carrier
    const trackingUrl = this.getTrackingUrl(carrierName, trackingNumber);

    const itemsList = items
      .map((item) => `<li>${item.productName} (x${item.quantity})</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .tracking-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .tracking-number { font-size: 1.3em; font-weight: bold; color: #667eea; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Your Order Has Shipped!</h1>
              <p>Order #${orderId}</p>
            </div>
            <div class="content">
              <p>Hi${data.customerName ? ` ${data.customerName}` : ''},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>
              
              <div class="tracking-box">
                <h3>Shipping Information</h3>
                <p><strong>Carrier:</strong> ${carrierName}</p>
                <p><strong>Tracking Number:</strong></p>
                <div class="tracking-number">${trackingNumber}</div>
                <p><strong>Shipped:</strong> ${shippedAt.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                
                <h4>Items Shipped:</h4>
                <ul>
                  ${itemsList}
                </ul>

                ${trackingUrl ? `<a href="${trackingUrl}" class="button">Track Your Package</a>` : ''}
              </div>

              <p>Your package should arrive within 3-7 business days depending on your location.</p>
              
              <div class="footer">
                <p>Questions about your order? Contact us at support@alchemytable.com</p>
                <p>© ${new Date().getFullYear()} The Alchemy Table</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Your Order Has Shipped!

Order #${orderId}

Shipping Information:
Carrier: ${carrierName}
Tracking Number: ${trackingNumber}
Shipped: ${shippedAt.toLocaleDateString()}

Items Shipped:
${items.map(item => `- ${item.productName} (x${item.quantity})`).join('\n')}

${trackingUrl ? `Track your package: ${trackingUrl}` : ''}

Your package should arrive within 3-7 business days.

Questions? Contact us at support@alchemytable.com
    `.trim();

    await this.emailService.sendEmail({
      to: customerEmail,
      subject: `Your Order Has Shipped! - Tracking #${trackingNumber}`,
      html,
      text,
    });
  }

  /**
   * Send delivery confirmation when order is delivered
   */
  async sendDeliveryNotification(orderId: string, customerEmail: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Order Delivered!</h1>
              <p>Your package has arrived</p>
            </div>
            <div class="content">
              <p>Your order #${orderId} has been delivered!</p>
              <p>We hope you enjoy your Alchemy Table blends. If you have any questions or concerns about your order, please don't hesitate to reach out.</p>
              
              <a href="${config.app.url}/orders/${orderId}" class="button">View Order</a>
              
              <p><strong>Love your blends?</strong> Share your experience and leave a review!</p>
              
              <div class="footer">
                <p>Thank you for choosing The Alchemy Table!</p>
                <p>Questions? Contact us at support@alchemytable.com</p>
                <p>© ${new Date().getFullYear()} The Alchemy Table</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Order Delivered!

Your order #${orderId} has been delivered!

We hope you enjoy your Alchemy Table blends. If you have any questions or concerns, please contact us.

View your order: ${config.app.url}/orders/${orderId}

Thank you for choosing The Alchemy Table!
    `.trim();

    await this.emailService.sendEmail({
      to: customerEmail,
      subject: `Order Delivered! #${orderId}`,
      html,
      text,
    });
  }

  /**
   * Generate tracking URL based on carrier
   */
  private getTrackingUrl(carrier: string, trackingNumber: string): string | null {
    const carrierLower = carrier.toLowerCase();
    
    if (carrierLower.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    } else if (carrierLower.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    } else if (carrierLower.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    } else if (carrierLower.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    }
    
    return null;
  }

  /**
   * Helper to get order data for email notifications
   */
  async getOrderDataForEmail(orderId: string): Promise<OrderEmailData | null> {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: {
          select: {
            email: true,
            username: true,
          },
        },
        order_items: {
          include: {
            products: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const customerEmail = order.guestEmail || order.users?.email;
    if (!customerEmail) {
      return null;
    }

    return {
      orderId: order.id,
      customerEmail,
      customerName: order.users?.username,
      totalAmount: Number(order.totalAmount),
      items: order.order_items.map((item) => ({
        productName: item.products.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    };
  }
}
