
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * POST /api/ai/generate-script
 * Generate a video script using AI
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Call AI API to generate script
    const response = await fetch('https://api.abacus.ai/v1/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Je bent een professionele scriptschrijver voor korte video content. 
Schrijf boeiende, pakkende scripts van 30-60 seconden die:
- Direct de aandacht trekken met een sterke opening
- Waarde leveren met praktische tips of informatie
- Eindigen met een duidelijke call-to-action
- Natuurlijk en conversationeel klinken
- Geschikt zijn voor voice-over

Houd het script tussen 150-250 woorden. Gebruik korte zinnen en alinea's voor goede leesbaarheid.`,
          },
          {
            role: 'user',
            content: `Schrijf een boeiend video script over: ${topic}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content || '';

    if (!script) {
      throw new Error('No script generated');
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate script',
      },
      { status: 500 }
    );
  }
}
