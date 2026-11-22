import { apiError } from '@/lib/api-response';
import { verifySameOriginRequest } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { escapeHtml, sanitizeEmailSubject, sendEmail } from '@/lib/email';

const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL || '';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LEN = 120;
const MAX_EMAIL_LEN = 254;
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;

export async function POST(request: NextRequest) {
  try {
    if (!verifySameOriginRequest(request)) {
      return apiError('Forbidden: same-origin web request required.', 403, 'ORIGIN_MISMATCH');
    }

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
    if (normalizedName.length > MAX_NAME_LEN) {
      return apiError(`Name must be ${MAX_NAME_LEN} characters or fewer`, 400);
    }

    if (!email || typeof email !== 'string') {
      return apiError('Email address is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > MAX_EMAIL_LEN || !emailRegex.test(normalizedEmail)) {
      return apiError('Please provide a valid email address', 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return apiError('Subject is required', 400);
    }

    const normalizedSubject = sanitizeEmailSubject(subject);
    if (normalizedSubject.length > MAX_SUBJECT_LEN) {
      return apiError(`Subject must be ${MAX_SUBJECT_LEN} characters or fewer`, 400);
    }
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage || normalizedMessage.length < 10) {
      return apiError('Message is required (minimum 10 characters)', 400);
    }
    if (normalizedMessage.length > MAX_MESSAGE_LEN) {
      return apiError(`Message must be ${MAX_MESSAGE_LEN} characters or fewer`, 400);
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
