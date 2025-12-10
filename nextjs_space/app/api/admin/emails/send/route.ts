/**
 * Send Email API
 * POST /api/admin/emails/send - Send a new email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, body: emailBody, html, replyTo } = body;

    if (!to || !subject || (!emailBody && !html)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and body or html' },
        { status: 400 }
      );
    }

    // Send email using existing email service
    const htmlContent = html || `<p>${emailBody.replace(/\n/g, '<br>')}</p>`;
    const textContent = emailBody || html?.replace(/<[^>]*>/g, '');

    const result = await sendEmail(
      to,
      subject,
      htmlContent,
      textContent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    console.error('[Admin] Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
