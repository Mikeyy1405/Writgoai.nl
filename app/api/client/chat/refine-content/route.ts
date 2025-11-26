
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendChatCompletion } from '@/lib/aiml-chat-client';
import { PERSONALITY_PRESETS } from '@/lib/chat-settings';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, instruction, conversationId, settings } = await req.json();

    if (!content || !instruction) {
      return NextResponse.json(
        { error: 'Content en instruction zijn vereist' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Build system prompt based on settings
    const personalityPrompt = settings?.personality
      ? PERSONALITY_PRESETS[settings.personality].systemPrompt
      : '';

    const systemPrompt = `${personalityPrompt}\n\nJe taak is om content te verfijnen op basis van de instructies van de gebruiker. Behoud de kern van de content, maar pas deze aan volgens de gegeven instructie.`;

    // Refine content
    const response = await sendChatCompletion({
      model: 'gpt-5.1',
      temperature: settings?.temperature || 0.7,
      stream: false,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Hier is de content die verfijnd moet worden:\n\n${content}\n\nInstructie: ${instruction}`,
        },
      ],
    });

    // Type guard to check if response is not a stream
    if ('choices' in response) {
      const refinedContent = response.choices[0]?.message?.content || '';
      if (!refinedContent) {
        throw new Error('Geen verfijnde content ontvangen');
      }

      // Save to conversation history
      if (conversationId) {
        await prisma.chatMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: `**Verfijnde content:**\n\n${refinedContent}\n\n*Verfijning instructie: ${instruction}*`,
            model: 'gpt-5.1',
          },
        });
      }

      return NextResponse.json({ refinedContent });
    }

    throw new Error('Onverwachte response type');
  } catch (error: any) {
    console.error('Content refinement error:', error);
    return NextResponse.json(
      { error: error.message || 'Content verfijnen mislukt' },
      { status: 500 }
    );
  }
}
