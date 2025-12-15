import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

/**
 * POST /api/simplified/content-plan
 * Genereer een content plan op basis van een keyword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, projectId } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Genereer topical authority map met AIML API
    const prompt = `Je bent een SEO content strategist. Maak een topical authority map voor het keyword "${keyword}".

Genereer 15-20 gerelateerde topics die samen een complete kennisstructuur vormen.

Voor elk topic geef je:
- Title: De titel van het artikel
- Description: Een korte beschrijving (1-2 zinnen)
- Keywords: 3-5 gerelateerde keywords
- Priority: high, medium, of low

Format je antwoord als JSON array:
[
  {
    "title": "...",
    "description": "...",
    "keywords": ["...", "..."],
    "priority": "high"
  }
]

Geef ALLEEN de JSON array terug, geen extra tekst.`;

    const response = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let topics = [];
    try {
      // Parse de response
      const content = response.content || '';
      // Verwijder markdown code blocks als die er zijn
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        topics = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Sla content plan op in project (als projectId is meegegeven)
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          contentPlan: {
            keyword,
            topics,
            generatedAt: new Date().toISOString(),
          },
          lastPlanGenerated: new Date(),
        },
      });
    } else {
      // Sla op in client als er geen project is
      await prisma.client.update({
        where: { id: client.id },
        data: {
          contentPlan: {
            keyword,
            topics,
            generatedAt: new Date().toISOString(),
          },
          lastPlanGenerated: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      keyword,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simplified/content-plan
 * Haal bestaande content plans op
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal content plans op van client en alle projecten
    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id,
        contentPlan: { not: null },
      },
      select: {
        id: true,
        name: true,
        contentPlan: true,
        lastPlanGenerated: true,
      },
    });

    const plans = [];

    // Client plan
    if (client.contentPlan) {
      plans.push({
        id: 'client',
        source: 'account',
        name: 'Account Plan',
        plan: client.contentPlan,
        lastGenerated: client.lastPlanGenerated,
      });
    }

    // Project plans
    projects.forEach((project) => {
      plans.push({
        id: project.id,
        source: 'project',
        name: project.name,
        plan: project.contentPlan,
        lastGenerated: project.lastPlanGenerated,
      });
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching content plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content plans' },
      { status: 500 }
    );
  }
}
