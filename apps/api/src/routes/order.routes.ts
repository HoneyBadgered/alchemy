/**
 * Order Routes
 * Customer-facing order endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { OrderService } from '../services/order.service';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
});

const placeOrderSchema = z.object({
  shippingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  customerNotes: z.string().optional(),
  discountCode: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

const orderListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService();

  /**
   * Place an order from the user's or guest's cart
   * POST /orders
   * Supports both authenticated users and guests (via x-session-id header)
   * Rate limit: 10 orders per hour to prevent spam
   */
  fastify.post('/orders', {
    preHandler: optionalAuthMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;
      const data = placeOrderSchema.parse(request.body);

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({
            message: 'Invalid session ID format',
          });
        }
      }

      // Require either authentication or session ID
      if (!userId && !sessionId) {
        return reply.status(400).send({
          message: 'Either authentication or x-session-id header required',
        });
      }

      // For guest checkout, require email
      if (!userId && !data.guestEmail) {
        return reply.status(400).send({
          message: 'Guest email is required for guest checkout',
        });
      }
      
      const order = await orderService.placeOrder({
        userId,
        sessionId,
        guestEmail: data.guestEmail,
        ...data,
      });

      return reply.status(201).send(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      // Log the actual error for debugging
      fastify.log.error('Order placement error:', error);
      
      return reply.status(400).send({ 
        message: (error as Error).message || 'Failed to place order. Please try again.'
      });
    }
  });

  /**
   * Get user's order history
   * GET /orders
   * Requires authentication
   */
  fastify.get('/orders', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const filters = orderListFiltersSchema.parse(request.query);
      
      const result = await orderService.getOrders(userId, filters);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      return reply.status(500).send({ 
        message: (error as Error).message 
      });
    }
  });

  /**
   * Get a single order by ID
   * GET /orders/:id
   * Requires authentication
   */
  fastify.get('/orders/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      
      const order = await orderService.getOrder(id, userId);
      return reply.send(order);
    } catch (error) {
      return reply.status(404).send({ 
        message: (error as Error).message 
      });
    }
  });

  /**
   * Get order receipt (HTML format for printing/PDF)
   * GET /orders/:id/receipt
   */
  fastify.get('/orders/:id/receipt', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      
      const order = await orderService.getOrder(id, userId);
      
      // Generate HTML receipt
      const html = generateReceiptHTML(order);
      
      reply.type('text/html');
      return reply.send(html);
    } catch (error) {
      reply.type('application/json');
      return reply.status(404).send({ 
        message: (error as Error).message || 'Order not found'
      });
    }
  });
}

/**
 * Generate HTML receipt for an order
 */
function generateReceiptHTML(order: any): string {
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toFixed(2)}`;
  };
  
  // Calculate values from order data
  const subtotal = Number(order.totalAmount) - Number(order.taxAmount || 0) - Number(order.shippingCost || 0) + Number(order.discountAmount || 0);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Receipt - ${order.id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #1a1a1a;
    }
    .order-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
    }
    .info-section p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals div {
      padding: 8px 0;
    }
    .totals .total {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 12px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Alchemy Table</h1>
    <p>Order Receipt</p>
  </div>
  
  <div class="order-info">
    <div class="info-section">
      <h3>Order Information</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Payment Status:</strong> ${order.stripePaymentStatus || 'pending'}</p>
      ${order.guestEmail ? `<p><strong>Email:</strong> ${order.guestEmail}</p>` : ''}
    </div>
    
    <div class="info-section">
      <h3>Contact Information</h3>
      ${order.users?.email ? `<p><strong>Email:</strong> ${order.users.email}</p>` : ''}
      ${order.guestEmail && !order.users?.email ? `<p><strong>Email:</strong> ${order.guestEmail}</p>` : ''}
      <p><strong>Shipping Method:</strong> ${order.shippingMethod || 'Standard'}</p>
      ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items.map((item: any) => `
        <tr>
          <td>${item.products.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.price)}</td>
          <td class="text-right">${formatCurrency(Number(item.price) * item.quantity)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</div>
    ${order.discountAmount && Number(order.discountAmount) > 0 ? `<div><strong>Discount${order.discountCode ? ` (${order.discountCode})` : ''}:</strong> -${formatCurrency(order.discountAmount)}</div>` : ''}
    <div><strong>Tax:</strong> ${formatCurrency(order.taxAmount || 0)}</div>
    <div><strong>Shipping:</strong> ${formatCurrency(order.shippingCost || 0)}</div>
    <div class="total"><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</div>
  </div>
  
  <div class="footer">
    <p>Thank you for your order!</p>
    <p>Questions? Contact us at support@alchemytable.com</p>
  </div>
  
  <script>
    // Auto-print dialog when opened in new window
    if (window.location.search.includes('print=true')) {
      window.onload = () => window.print();
    }
  </script>
</body>
</html>
  `.trim();
}
