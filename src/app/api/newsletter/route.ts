import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, remaining, resetIn } = rateLimit(`newsletter:${ip}`, 5, 60_000);

    if (!allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('Invalid JSON body', 400);
    }

    const { email } = body;

    if (!email || typeof email !== 'string') {
      return apiError('Email address is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return apiError('Please provide a valid email address', 400);
    }

    const existing = await db.subscriber.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: true, message: 'You are already subscribed!' },
        { status: 200 }
      );
    }

    await db.subscriber.create({ data: { email: normalizedEmail } });

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to PdfPixels Newsletter!',
      html: `<p>Thanks for subscribing to the PdfPixels newsletter!</p><p>You'll now receive updates on new tools, tips, and features.</p>`,
    });

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed to newsletter', emailSent: emailSent.success },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Newsletter] Error processing subscription:', error);
    return apiError('Internal server error', 500);
  }
}
