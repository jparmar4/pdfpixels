import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeEmailSubject(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.info('[Email] Resend not configured. Skipping email send.');
    return { success: false, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@pdfpixels.com',
      to,
      subject,
      html,
    });
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error };
  }
}
