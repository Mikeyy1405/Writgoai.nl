
/**
 * Email Reply API
 * Send a reply to an email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendEmailReply } from '@/lib/email-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emailId, message, includeHtml } = body;

    if (!emailId || !message) {
      return NextResponse.json(
        { error: 'Email ID and message are required' },
        { status: 400 }
      );
    }

    // Get original email
    const originalEmail = await prisma.email.findUnique({
      where: { id: emailId },
      include: { thread: true },
    });

    if (!originalEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Prepare reply subject
    const replySubject = originalEmail.subject.startsWith('Re:')
      ? originalEmail.subject
      : `Re: ${originalEmail.subject}`;

    // Send reply
    const messageId = await sendEmailReply({
      to: originalEmail.from,
      cc: originalEmail.cc.filter(email => email !== process.env.EMAIL_USER),
      subject: replySubject,
      text: message,
      html: includeHtml ? `<p>${message.replace(/\n/g, '<br>')}</p>` : undefined,
      inReplyTo: originalEmail.messageId,
      references: [...originalEmail.references, originalEmail.messageId],
      threadId: originalEmail.threadId,
    });

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Reply sent successfully',
    });
  } catch (error: any) {
    console.error('[Admin] Error sending reply:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}
