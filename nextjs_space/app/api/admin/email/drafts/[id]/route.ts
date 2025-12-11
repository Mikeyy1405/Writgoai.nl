/**
 * API Route: Individual Email Draft
 * GET    /api/admin/email/drafts/[id] - Get draft by ID
 * PUT    /api/admin/email/drafts/[id] - Update draft
 * DELETE /api/admin/email/drafts/[id] - Delete draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET - Get draft by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const draftId = params.id;

    // Get draft
    const draft = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Concept niet gevonden' },
        { status: 404 }
      );
    }

    // Check ownership
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit concept' },
        { status: 403 }
      );
    }

    // Get mailbox info
    const mailbox = await prisma.mailboxConnection.findUnique({
      where: { id: draft.mailboxId },
      select: { email: true, displayName: true, isActive: true },
    });

    return NextResponse.json({
      draft: {
        ...draft,
        mailbox,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/email/drafts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update draft
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const draftId = params.id;

    // Get existing draft
    const existingDraft = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Concept niet gevonden' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingDraft.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit concept' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
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

    // Update draft
    const updatedDraft = await prisma.emailDraft.update({
      where: { id: draftId },
      data: {
        to: to !== undefined ? to : existingDraft.to,
        cc: cc !== undefined ? cc : existingDraft.cc,
        bcc: bcc !== undefined ? bcc : existingDraft.bcc,
        subject: subject !== undefined ? subject : existingDraft.subject,
        bodyHtml: bodyHtml !== undefined ? bodyHtml : existingDraft.bodyHtml,
        bodyText: bodyText !== undefined ? bodyText : existingDraft.bodyText,
        inReplyTo: inReplyTo !== undefined ? inReplyTo : existingDraft.inReplyTo,
        references: references !== undefined ? references : existingDraft.references,
        isReply: isReply !== undefined ? isReply : existingDraft.isReply,
        isForward: isForward !== undefined ? isForward : existingDraft.isForward,
        originalMessageId: originalMessageId !== undefined ? originalMessageId : existingDraft.originalMessageId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
      message: 'Concept bijgewerkt',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/email/drafts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete draft
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const draftId = params.id;

    // Get draft
    const draft = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Concept niet gevonden' },
        { status: 404 }
      );
    }

    // Check ownership
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit concept' },
        { status: 403 }
      );
    }

    // Delete draft
    await prisma.emailDraft.delete({
      where: { id: draftId },
    });

    return NextResponse.json({
      success: true,
      message: 'Concept verwijderd',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/email/drafts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}
