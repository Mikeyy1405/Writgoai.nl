/**
 * API Route: Send Email
 * POST /api/admin/email/send
 * 
 * Sends an email via SMTP using configured mailbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { sendEmail } from '@/lib/email/smtp-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      mailboxId,
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      inReplyTo,
      references,
      draftId, // Optional: if sending from draft, we can delete it
    } = body;

    // Validate required fields
    if (!mailboxId || !to || to.length === 0 || !subject) {
      return NextResponse.json(
        { error: 'Mailbox ID, ontvangers en onderwerp zijn verplicht' },
        { status: 400 }
      );
    }

    if (!bodyHtml && !bodyText) {
      return NextResponse.json(
        { error: 'Email body (HTML of text) is verplicht' },
        { status: 400 }
      );
    }

    // Get mailbox configuration
    const mailbox = await prisma.mailboxConnection.findUnique({
      where: { id: mailboxId },
    });

    if (!mailbox) {
      return NextResponse.json(
        { error: 'Mailbox configuratie niet gevonden' },
        { status: 404 }
      );
    }

    // Check if mailbox is active
    if (!mailbox.isActive) {
      return NextResponse.json(
        { error: 'Mailbox is niet actief' },
        { status: 400 }
      );
    }

    // Validate SMTP settings
    if (!mailbox.smtpHost || !mailbox.smtpPort || !mailbox.password) {
      return NextResponse.json(
        { error: 'SMTP configuratie is niet compleet' },
        { status: 400 }
      );
    }

    // Prepare email config
    const emailConfig = {
      smtpHost: mailbox.smtpHost,
      smtpPort: mailbox.smtpPort,
      smtpTls: mailbox.smtpTls ?? true,
      email: mailbox.email,
      password: mailbox.password,
      displayName: mailbox.displayName || undefined,
    };

    // Prepare email data
    const emailData = {
      to: Array.isArray(to) ? to : [to],
      cc: cc && cc.length > 0 ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc && bcc.length > 0 ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject,
      bodyHtml,
      bodyText,
      inReplyTo,
      references: references && references.length > 0 ? references : undefined,
    };

    // Send email
    const result = await sendEmail(emailConfig, emailData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Fout bij verzenden email' },
        { status: 500 }
      );
    }

    // If sending from draft, delete the draft
    if (draftId) {
      try {
        await prisma.emailDraft.delete({
          where: { id: draftId },
        });
      } catch (deleteError) {
        console.error('Failed to delete draft after sending:', deleteError);
        // Don't fail the request if draft deletion fails
      }
    }

    // Update mailbox last sync time
    await prisma.mailboxConnection.update({
      where: { id: mailboxId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email succesvol verzonden',
    });
  } catch (error: any) {
    console.error('Error in /api/admin/email/send:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}
