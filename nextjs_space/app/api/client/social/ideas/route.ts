import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { trackUsage } from '@/lib/usage-tracking';

export const dynamic = 'force-dynamic';

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: 'trending' | 'seasonal' | 'evergreen' | 'engagement';
  urgency: 'high' | 'medium' | 'low';
  estimatedEngagement: number;
}

/**
 * GET - Fetch stored content ideas for a project
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Try to fetch existing ideas from database
    const ideas = await prisma.socialMediaIdea.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ ideas });

  } catch (error: any) {
    console.error('Error fetching content ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate new AI content ideas for the week
 * Body: { projectId, count? }
 */
export async function POST(req: NextRequest) {
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
    const { projectId, count = 10 } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Track usage
    await trackUsage({
      clientId: client.id,
      projectId,
      tool: 'social_content_ideas',
      action: `Generated ${count} social content ideas`,
      details: { 
        count,
        creditsUsed: 10 
      },
    });

    // Generate content ideas using AI
    const prompt = `Je bent een social media strategie expert. Genereer ${count} content ideeën voor een week aan social media posts.

PROJECT CONTEXT:
- Naam: ${project.name}
- Website: ${project.websiteUrl || 'Niet beschikbaar'}
- Niche: ${project.businessNiche || 'Algemeen'}
- Doelgroep: ${project.targetAudience || 'Breed publiek'}

Genereer diverse content ideeën met een mix van:
1. Trending topics (actueel, buzz-waardig)
2. Seasonal content (seizoensgebonden)
3. Evergreen content (altijd relevant)
4. Engagement boosters (polls, vragen, discussie)

Voor elk idee:
- Een pakkende titel
- Een korte beschrijving (1-2 zinnen)
- Geschikte platforms (linkedin, instagram, twitter, facebook, tiktok)
- Categorie (trending, seasonal, evergreen, engagement)
- Urgentie (high, medium, low)
- Geschatte engagement score (20-95)

Return een JSON array met objecten in dit formaat:
[
  {
    "title": "...",
    "description": "...",
    "suggestedPlatforms": ["linkedin", "instagram"],
    "category": "trending",
    "urgency": "high",
    "estimatedEngagement": 85
  }
]`;

    try {
      const response = await chatCompletion({
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een expert social media content strategist die data-gedreven content ideeën genereert.' 
          },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.9,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';
      
      // Parse JSON response
      let ideas: ContentIdea[] = [];
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || [null, content];
        const jsonString = jsonMatch[1] || content;
        ideas = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }

      // Store ideas in database
      const createdIdeas = await Promise.all(
        ideas.map(idea =>
          prisma.socialMediaIdea.create({
            data: {
              projectId,
              title: idea.title,
              description: idea.description,
              suggestedPlatforms: idea.suggestedPlatforms,
              category: idea.category,
              urgency: idea.urgency,
              estimatedEngagement: idea.estimatedEngagement,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        ideas: createdIdeas,
      });

    } catch (aiError: any) {
      console.error('Error generating ideas with AI:', aiError);
      return NextResponse.json(
        { error: aiError.message || 'Failed to generate ideas' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in content ideas generation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
