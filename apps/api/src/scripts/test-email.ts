/**
 * Test Email Script
 * Run with: npx tsx src/scripts/test-email.ts
 */

import { OrderNotificationService } from '../services/order-notification.service';

async function testEmail() {
  const notificationService = new OrderNotificationService();
  
  const testData = {
    orderId: 'test-order-123',
    customerEmail: 'lvbernstein@gmail.com', // Your email to receive it
    customerName: 'Lauren',
    orderNumber: '#12345',
    totalAmount: 59.99,
    items: [
      {
        productName: 'Midnight Rose Blend',
        quantity: 2,
        price: 24.99
      },
      {
        productName: 'Golden Hour Tea',
        quantity: 1,
        price: 10.01
      }
    ]
  };

  console.log('🧪 Testing Order Confirmation Email...');
  console.log('📧 Sending to:', testData.customerEmail);
  console.log('');

  try {
    await notificationService.sendOrderConfirmation(testData);
    console.log('✅ Order confirmation email sent successfully!');
    console.log('📬 Check your inbox at:', testData.customerEmail);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:');
    console.error(error);
    process.exit(1);
  }

  console.log('');
  console.log('🧪 Testing Shipping Notification Email...');

  const shippingData = {
    ...testData,
    trackingNumber: '1Z999AA10123456784',
    carrierName: 'UPS',
    shippedAt: new Date(),
  };

  try {
    await notificationService.sendShippingNotification(shippingData);
    console.log('✅ Shipping notification email sent successfully!');
    console.log('📬 Check your inbox at:', testData.customerEmail);
  } catch (error) {
    console.error('❌ Failed to send shipping notification email:');
    console.error(error);
    process.exit(1);
  }

  console.log('');
  console.log('🧪 Testing Delivery Notification Email...');

  try {
    await notificationService.sendDeliveryNotification(testData.orderId, testData.customerEmail);
    console.log('✅ Delivery notification email sent successfully!');
    console.log('📬 Check your inbox at:', testData.customerEmail);
  } catch (error) {
    console.error('❌ Failed to send delivery notification email:');
    console.error(error);
    process.exit(1);
  }

  console.log('');
  console.log('🎉 All test emails sent successfully!');
  console.log('📧 Check your inbox at:', testData.customerEmail);
  process.exit(0);
}

testEmail();
