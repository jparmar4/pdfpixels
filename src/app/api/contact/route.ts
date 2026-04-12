import { NextRequest, NextResponse } from 'next/server';

// Contact form submission endpoint
// In production, replace the console.log with your email service (SendGrid, Resend, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message is required (minimum 10 characters)' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual email/notification service
    // Example integrations:
    // - SendGrid: Send email to support@pdfpixels.com
    // - Resend: Forward form data to team
    // - Slack: Post to a channel
    // - Database: Store submissions for review
    console.log(`[Contact] New message from ${name} <${email}> - Subject: ${subject}`);

    return NextResponse.json(
      { success: true, message: 'Message received. We will get back to you soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact] Error processing message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
