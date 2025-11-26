
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all email drafts for the logged-in client
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const isTemplate = searchParams.get('isTemplate') === 'true';
    const isFavorite = searchParams.get('isFavorite') === 'true';

    const where: any = {
      clientId: client.id,
    };

    if (status) {
      where.status = status;
    }

    if (isTemplate) {
      where.isTemplate = true;
    }

    if (isFavorite) {
      where.isFavorite = true;
    }

    const emailDrafts = await prisma.emailDraft.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ emailDrafts });
  } catch (error) {
    console.error('Error fetching email drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email drafts' },
      { status: 500 }
    );
  }
}

// POST - Create a new email draft
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();

    const emailDraft = await prisma.emailDraft.create({
      data: {
        clientId: client.id,
        title: body.title,
        subject: body.subject,
        recipient: body.recipient,
        recipientName: body.recipientName,
        content: body.content,
        language: body.language || 'NL',
        emailType: body.emailType || 'new',
        originalContext: body.originalContext,
        customInstructions: body.customInstructions,
        tone: body.tone || 'professional',
        length: body.length || 'medium',
        status: body.status || 'draft',
        isTemplate: body.isTemplate || false,
        aiGenerated: body.aiGenerated !== undefined ? body.aiGenerated : true,
        aiModel: body.aiModel,
        tokensUsed: body.tokensUsed,
        generatedAt: body.aiGenerated ? new Date() : undefined,
        tags: body.tags || [],
        category: body.category,
      },
    });

    return NextResponse.json({ success: true, emailDraft });
  } catch (error) {
    console.error('Error creating email draft:', error);
    return NextResponse.json(
      { error: 'Failed to create email draft' },
      { status: 500 }
    );
  }
}
