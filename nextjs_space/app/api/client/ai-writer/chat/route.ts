import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * 🎨 AI CONTENT WRITER STUDIO - CHAT
 * Chat with AI about content adjustments and improvements
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  currentContent?: string;
  conversationHistory?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  console.log('💬 [AI Writer Chat] API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse request
    const body: ChatRequest = await request.json();
    const { message, currentContent, conversationHistory = [] } = body;

    console.log('📦 [AI Writer Chat] Message:', message.substring(0, 100));

    // 3. Validate
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 4. Build conversation
    const messages: any[] = [];

    // System message
    messages.push({
      role: 'system',
      content: `Je bent een expert content schrijver en editor. Je helpt gebruikers met het verbeteren en aanpassen van hun content.

Je taken:
- Content aanpassen op basis van feedback
- Secties herschrijven
- SEO suggesties geven
- Toon en stijl aanpassen
- Content inkorten of uitbreiden
- Structuur verbeteren

Als er huidige content is, refereer je daar naar in je antwoorden. Geef concrete, uitvoerbare suggesties.`,
    });

    // Add conversation history if any
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current content context if available
    let userMessage = message;
    if (currentContent) {
      userMessage = `[HUIDIGE CONTENT]:\n${currentContent}\n\n[VRAAG]: ${message}`;
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    console.log('🤖 [AI Writer Chat] Generating response...');

    // 5. Generate AI response
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_45,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = response.choices[0]?.message?.content || '';

    // 6. Return response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [AI Writer Chat] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process chat message',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
