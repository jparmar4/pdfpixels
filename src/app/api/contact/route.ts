import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { escapeHtml, sanitizeEmailSubject, sendEmail } from '@/lib/email';

const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || '';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = rateLimit(`contact:${ip}`, 3, 60_000);

    if (!allowed) {
      return apiError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return apiError('Invalid JSON body', 400);
    }

    const { name, email, subject, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return apiError('Name is required (minimum 2 characters)', 400);
    }

    const normalizedName = name.trim();

    if (!email || typeof email !== 'string') {
      return apiError('Email address is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return apiError('Please provide a valid email address', 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return apiError('Subject is required', 400);
    }

    const normalizedSubject = sanitizeEmailSubject(subject);
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage || normalizedMessage.length < 10) {
      return apiError('Message is required (minimum 10 characters)', 400);
    }

    await db.contactMessage.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        subject: normalizedSubject,
        message: normalizedMessage,
      },
    });

    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `[PdfPixels Contact] ${normalizedSubject}`,
        html: `<p><strong>From:</strong> ${escapeHtml(normalizedName)} (${escapeHtml(normalizedEmail)})</p><p><strong>Subject:</strong> ${escapeHtml(normalizedSubject)}</p><p><strong>Message:</strong></p><p>${escapeHtml(normalizedMessage).replace(/\n/g, '<br />')}</p>`,
      });
    }

    return NextResponse.json(
      { success: true, message: 'Message received. We will get back to you soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact] Error processing message:', error);
    return apiError('Internal server error', 500);
  }
}
