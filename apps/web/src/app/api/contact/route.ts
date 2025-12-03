import { NextResponse } from 'next/server';

/**
 * Contact form API endpoint (stub).
 * In production, this would send emails, store in database, etc.
 * TODO: Replace with actual email service integration (e.g., SendGrid, SES)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, email, subject, message } = body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Stub implementation - log the contact form submission
    // TODO: Integrate with email service to actually send the message
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });
    
    // In production, you would:
    // 1. Send an email to the support team
    // 2. Store the message in a database
    // 3. Send a confirmation email to the user
    // 4. Create a ticket in a support system
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message! We will get back to you soon.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
