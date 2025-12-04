/**
 * Generate AI Reply API
 * Generate AI-powered reply for an inbox email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateAIReply } from '@/lib/email-ai-assistant';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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
    const { tone, customInstructions } = body;

    // Get inbox email
    const email = await prisma.inboxEmail.findUnique({
      where: { id: params.id },
      include: {
        mailbox: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Verify mailbox belongs to client
    if (email.mailbox.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate AI reply
    const result = await generateAIReply(
      email.body,
      email.subject,
      email.from,
      tone || 'professional',
      customInstructions || null,
      client.id
    );

    return NextResponse.json({
      reply: result.reply,
      creditsUsed: result.creditsUsed,
    });
  } catch (error: any) {
    console.error('[AI Reply] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI reply' },
      { status: 500 }
    );
  }
}
