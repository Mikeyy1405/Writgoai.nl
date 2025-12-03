
/**
 * AI Generate Reply API
 * Generate an AI-powered reply draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emailId, tone, instructions } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Get email and thread context
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        thread: {
          include: {
            emails: {
              orderBy: { receivedAt: 'asc' },
              take: 5, // Last 5 emails for context
            },
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Build context for AI
    const conversationHistory = email.thread.emails
      .map(e => `From: ${e.from}\nSubject: ${e.subject}\n${e.textBody || ''}`)
      .join('\n\n---\n\n');

    const toneInstruction = tone === 'professional' 
      ? 'professional en formeel' 
      : tone === 'friendly' 
      ? 'vriendelijk en persoonlijk'
      : tone === 'concise'
      ? 'kort en to-the-point'
      : 'professioneel maar toegankelijk';

    const prompt = `Je bent een klantenservice medewerker bij WritgoAI, een AI-powered content creatie platform.

Je moet een antwoord schrijven op deze email:

Van: ${email.from}
Onderwerp: ${email.subject}

Email inhoud:
${email.textBody}

${conversationHistory ? `\n\nVorige berichten in deze conversatie:\n${conversationHistory}` : ''}

${instructions ? `\n\nExtra instructies: ${instructions}` : ''}

Schrijf een ${toneInstruction} antwoord. Houd het beknopt maar volledig. Onderteken met "Met vriendelijke groet, Het WritgoAI Team".`;

    // Generate AI response
    const response = await chatCompletion({
      model: 'claude-sonnet-4',
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele klantenservice medewerker bij WritgoAI. Je schrijft heldere, vriendelijke en behulpzame emails.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiReply = response.choices[0].message.content;

    // Save draft to database
    await prisma.email.update({
      where: { id: emailId },
      data: {
        aiDraft: aiReply,
        aiDraftCreatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      draft: aiReply,
    });
  } catch (error: any) {
    console.error('[Admin] Error generating AI reply:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
