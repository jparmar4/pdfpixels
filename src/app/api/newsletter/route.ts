import { NextRequest, NextResponse } from 'next/server';

// Newsletter subscription endpoint
// In production, replace the console.log with your email service (Mailchimp, SendGrid, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Rate limiting: In production, implement proper rate limiting with Redis/IP tracking
    // For now, this is a placeholder that logs the subscription

    // TODO: Replace with actual email service integration
    // Example integrations:
    // - Mailchimp: Add to list via API
    // - SendGrid: Add to contact list
    // - ConvertKit: Add subscriber
    // - Database: Store in subscribers table
    console.log(`[Newsletter] New subscription: ${email}`);

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Newsletter] Error processing subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
