import { NextResponse } from 'next/server';
import { sendContactFormEmails } from '@/lib/email';

/**
 * Contact form API endpoint
 * Sends emails to admin and user confirmation
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
    
    // Validate field lengths
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      );
    }
    
    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be less than 200 characters' },
        { status: 400 }
      );
    }
    
    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be less than 5000 characters' },
        { status: 400 }
      );
    }
    
    // Log the contact form submission
    console.log('Contact form submission received:', {
      name,
      email,
      subject,
      timestamp: new Date().toISOString(),
    });
    
    // Send emails
    try {
      await sendContactFormEmails({ name, email, subject, message });
      console.log('Contact form emails sent successfully');
    } catch (emailError) {
      console.error('Failed to send contact form emails:', emailError);
      // Don't fail the request if email sending fails
      // The user still gets a response, but we log the error
    }
    
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
