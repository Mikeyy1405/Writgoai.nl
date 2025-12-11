/**
 * API Route: Email Drafts
 * GET  /api/admin/email/drafts - List all drafts
 * POST /api/admin/email/drafts - Create new draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET - List all drafts for current user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    // Get all drafts for user
    const drafts = await prisma.emailDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // Get mailbox info for each draft
    const draftsWithMailbox = await Promise.all(
      drafts.map(async (draft: any) => {
        const mailbox = await prisma.mailboxConnection.findUnique({
          where: { id: draft.mailboxId },
          select: { email: true, displayName: true },
        });

        return {
          ...draft,
          mailbox,
        };
      })
    );

    return NextResponse.json({
      drafts: draftsWithMailbox,
      count: drafts.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/email/drafts:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new draft
 */
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

    const userId = session.user.email;

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
      isReply,
      isForward,
      originalMessageId,
    } = body;

    // Validate required fields
    if (!mailboxId) {
      return NextResponse.json(
        { error: 'Mailbox ID is verplicht' },
        { status: 400 }
      );
    }

    // Check if mailbox exists
    const mailbox = await prisma.mailboxConnection.findUnique({
      where: { id: mailboxId },
    });

    if (!mailbox) {
      return NextResponse.json(
        { error: 'Mailbox niet gevonden' },
        { status: 404 }
      );
    }

    // Create draft
    const draft = await prisma.emailDraft.create({
      data: {
        userId,
        mailboxId,
        to: to || [],
        cc: cc || [],
        bcc: bcc || [],
        subject: subject || '',
        bodyHtml: bodyHtml || '',
        bodyText: bodyText || '',
        inReplyTo: inReplyTo || null,
        references: references || [],
        isReply: isReply || false,
        isForward: isForward || false,
        originalMessageId: originalMessageId || null,
      },
    });

    return NextResponse.json({
      success: true,
      draft,
      message: 'Concept opgeslagen',
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/email/drafts:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}
