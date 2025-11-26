
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/video-workflow/content-calendar
 * Generate a content calendar based on niche
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
    const { niche, targetAudience, videosPerWeek, duration = 30 } = data;

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Generate content calendar using AI
    const prompt = `Genereer een content kalender voor video's over "${niche}".
    
Doelgroep: ${targetAudience || 'Algemeen publiek'}
Aantal video's per week: ${videosPerWeek}
Video lengte: ${duration} seconden

Genereer 20 video ideeën die:
- Relevant zijn voor de niche "${niche}"
- Aantrekkelijk zijn voor de doelgroep
- Geschikt zijn voor korte video's (${duration}s)
- Gevarieerd zijn qua onderwerp
- SEO-vriendelijk zijn
- Trending topics bevatten

Geef het resultaat in JSON formaat:
[
  {
    "title": "Video titel",
    "description": "Korte beschrijving",
    "hook": "Pakkende openingszin",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]`;

    const aiResponse = await fetch('https://api.abacus.ai/v0/chat/completeChatMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || aiData.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const videoIdeas = JSON.parse(jsonMatch[0]);

    // Save to database
    const savedIdeas = await Promise.all(
      videoIdeas.map(async (idea: any, index: number) => {
        return await prisma.videoIdea.create({
          data: {
            clientId: client.id,
            title: idea.title,
            description: idea.description,
            hook: idea.hook,
            keywords: idea.keywords || [],
            niche,
            targetAudience,
            duration,
            order: index,
            status: 'PENDING',
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      message: `${savedIdeas.length} video ideeën gegenereerd!`,
    });

  } catch (error) {
    console.error('Error generating content calendar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content calendar' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video-workflow/content-calendar
 * Get all video ideas for the client
 */
export async function GET() {
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

    const ideas = await prisma.videoIdea.findMany({
      where: { clientId: client.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Error fetching content calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content calendar' },
      { status: 500 }
    );
  }
}
