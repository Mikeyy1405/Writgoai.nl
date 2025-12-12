import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/strategy/generate
 * Generate a social media strategy with AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      clientId,
      niche,
      targetAudience,
      tone,
      keywords,
      totalPosts,
      period,
      platforms,
      postsPerWeek,
      contentTypes,
    } = body;

    // Validation
    if (!clientId || !niche || !targetAudience || !platforms?.length) {
      return NextResponse.json(
        { error: 'Ontbrekende verplichte velden' },
        { status: 400 }
      );
    }

    console.log(`[API] Generating social media strategy for client ${clientId}`);

    // Generate strategy with AI
    const strategy = await generateStrategyWithAI({
      niche,
      targetAudience,
      tone,
      keywords,
      totalPosts,
      platforms,
      contentTypes,
    });

    // Save strategy to database
    const savedStrategy = await prisma.socialMediaStrategy.create({
      data: {
        clientId,
        name: `${niche} - Social Media Strategie`,
        description: `${totalPosts} posts voor ${platforms.join(', ')}`,
        niche,
        targetAudience,
        tone,
        keywords: keywords || [],
        totalPosts,
        platforms,
        contentTypes: contentTypes || [],
        status: 'planning',
        createdAt: new Date(),
      },
    });

    // Save placeholder posts (actual content will be generated in batch)
    const postsToCreate = strategy.posts.map((post: any) => ({
      strategyId: savedStrategy.id,
      platform: post.platform,
      contentType: post.contentType,
      topic: post.topic,
      description: post.description,
      status: 'planned',
      scheduledDate: post.scheduledDate,
      createdAt: new Date(),
    }));

    await prisma.socialMediaPost.createMany({
      data: postsToCreate,
    });

    console.log(`[API] Social media strategy created with ${postsToCreate.length} posts`);

    return NextResponse.json({
      id: savedStrategy.id,
      totalPosts: postsToCreate.length,
      platforms,
      message: 'Strategie succesvol aangemaakt',
    });
  } catch (error: any) {
    console.error('[API] Social strategy generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij genereren strategie' },
      { status: 500 }
    );
  }
}

/**
 * Generate strategy structure with AI
 */
async function generateStrategyWithAI(config: any): Promise<any> {
  const prompt = `
Je bent een expert social media strategie consultant. Genereer een complete social media content strategie.

CONFIGURATIE:
- Niche: ${config.niche}
- Doelgroep: ${config.targetAudience}
- Tone: ${config.tone}
- Keywords: ${config.keywords?.join(', ') || 'N/A'}
- Platforms: ${config.platforms.join(', ')}
- Content Types: ${config.contentTypes.join(', ')}
- Totaal Posts: ${config.totalPosts}

INSTRUCTIES:
Genereer ${config.totalPosts} post concepten met een evenwichtige verdeling over:
- Platforms (bijv. ${Math.floor(config.totalPosts / config.platforms.length)} per platform)
- Content types (educational, promotional, engagement, etc.)
- Thema's en onderwerpen

Voor elk post concept, geef:
1. Platform (kies uit: ${config.platforms.join(', ')})
2. Content Type (kies uit: ${config.contentTypes.join(', ')})
3. Topic (specifiek onderwerp, max 10 woorden)
4. Description (korte beschrijving van de post, 1-2 zinnen)
5. Scheduled Date (verdeel posts gelijkmatig over 3-6 maanden vanaf nu)

BELANGRIJKE REGELS:
- Variatie in onderwerpen en formats
- Mix van verschillende content types
- Posts moeten relevant zijn voor de niche en doelgroep
- Gebruik keywords strategisch
- Timing moet logisch zijn (niet alle posts op dezelfde dag)

Antwoord ALLEEN met valid JSON in dit exacte format (geen markdown):
{
  "posts": [
    {
      "platform": "linkedin",
      "contentType": "educational",
      "topic": "Onderwerp van de post",
      "description": "Korte beschrijving",
      "scheduledDate": "2025-01-15T10:00:00Z"
    },
    ...
  ],
  "summary": {
    "totalPosts": ${config.totalPosts},
    "platformDistribution": { "linkedin": 50, "instagram": 75, ... },
    "contentTypeDistribution": { "educational": 100, "promotional": 50, ... }
  }
}
`;

  try {
    const aimlApiKey = process.env.AIML_API_KEY;
    if (!aimlApiKey) {
      throw new Error('AIML_API_KEY niet geconfigureerd');
    }

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aimlApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een social media strategie expert. Antwoord ALLEEN met valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Geen response van AI API');
    }

    // Parse JSON (handle markdown wrapping)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const strategy = JSON.parse(cleanedContent);

    // Validate
    if (!strategy.posts || !Array.isArray(strategy.posts)) {
      throw new Error('Invalid strategy structure');
    }

    return strategy;
  } catch (error: any) {
    console.error('[AI] Strategy generation error:', error);
    
    // Fallback: Generate basic structure
    return generateFallbackStrategy(config);
  }
}

/**
 * Fallback strategy generation (if AI fails)
 */
function generateFallbackStrategy(config: any): any {
  const posts = [];
  const postsPerPlatform = Math.floor(config.totalPosts / config.platforms.length);
  const startDate = new Date();

  let postIndex = 0;
  for (const platform of config.platforms) {
    for (let i = 0; i < postsPerPlatform; i++) {
      const contentType = config.contentTypes[i % config.contentTypes.length];
      const daysOffset = Math.floor(postIndex / 2); // 2 posts per day
      
      posts.push({
        platform,
        contentType,
        topic: `${config.niche} - ${contentType} post ${i + 1}`,
        description: `Post over ${config.niche} gericht op ${config.targetAudience}`,
        scheduledDate: new Date(
          startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      
      postIndex++;
    }
  }

  return {
    posts,
    summary: {
      totalPosts: posts.length,
      platformDistribution: config.platforms.reduce((acc: any, p: string) => {
        acc[p] = postsPerPlatform;
        return acc;
      }, {}),
    },
  };
}
