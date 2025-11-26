
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/video-workflow/generate-script
 * Generate a video script using AI
 */
export async function POST(request: Request) {
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

    const data = await request.json();
    const { 
      ideaId,
      title, 
      description, 
      hook,
      duration = 30, 
      tone = 'engaging',
      language = 'Dutch',
      includeCallToAction = true 
    } = data;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Calculate approximate word count (150 words per minute for normal speech)
    const wordsPerSecond = 2.5;
    const targetWords = Math.floor(duration * wordsPerSecond);

    const prompt = `Schrijf een video script in het ${language} voor een korte video.

Titel: ${title}
Beschrijving: ${description || 'Geen specifieke beschrijving'}
Opening hook: ${hook || 'Maak zelf een pakkende opening'}
Duur: ${duration} seconden (ongeveer ${targetWords} woorden)
Toon: ${tone}

BELANGRIJKE INSTRUCTIES:
- Schrijf ALLEEN de voice-over tekst, geen camera instructies of acties
- Begin direct met de hook, geen introductie
- Houd het kort en krachtig
- Gebruik korte zinnen die goed klinken als ze worden uitgesproken
- Geen markdown, geen opmaak, alleen platte tekst
- Exact ${targetWords} woorden (+/- 10%)
${includeCallToAction ? '- Eindig met een sterke call-to-action' : ''}

Schrijf nu het script:`;

    const aiResponse = await fetch('https://api.abacus.ai/v0/chat/completeChatMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const script = aiData.choices?.[0]?.message?.content || aiData.content || '';

    // Clean up the script
    const cleanScript = script
      .replace(/```.*?```/gs, '') // Remove code blocks
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[.*?\]/g, '') // Remove brackets
      .replace(/\(.*?\)/g, '') // Remove parentheses with instructions
      .trim();

    // Update video idea if ideaId is provided
    if (ideaId) {
      await prisma.videoIdea.update({
        where: { id: ideaId },
        data: {
          script: cleanScript,
          scriptGeneratedAt: new Date(),
          status: 'SCRIPT_READY',
        },
      });
    }

    const wordCount = cleanScript.split(/\s+/).length;

    return NextResponse.json({
      success: true,
      script: cleanScript,
      wordCount,
      estimatedDuration: Math.round(wordCount / wordsPerSecond),
      message: 'Script gegenereerd!',
    });

  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate script' },
      { status: 500 }
    );
  }
}
