/**
 * Simplified Content Plan API Routes
 * 
 * GET: Retrieve existing content plans
 * POST: Generate new content plan based on keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ContentPlanTopic {
  title: string;
  description: string;
  keywords: string[];
  priority: string;
  reason?: string;
}

interface ContentPlanData {
  source: string;
  keyword?: string;
  topics: ContentPlanTopic[];
  generatedAt: string;
}

/**
 * GET /api/simplified/content-plan
 * Retrieve existing content plans for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Je moet ingelogd zijn' 
      }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ 
        error: 'Client not found',
        message: 'Gebruiker niet gevonden'
      }, { status: 404 });
    }

    // Get all article ideas grouped by project or keyword
    const ideas = await prisma.articleIdea.findMany({
      where: {
        clientId: client.id,
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 100 // Limit to recent ideas
    });

    // Group ideas into plans
    const plansMap = new Map<string, any>();

    ideas.forEach(idea => {
      const key = idea.projectId || idea.targetKeyword || 'general';
      
      if (!plansMap.has(key)) {
        plansMap.set(key, {
          id: key,
          source: idea.projectId ? 'wordpress' : 'manual',
          name: idea.projectId ? `Project Plan` : `Keyword Plan: ${idea.targetKeyword || 'General'}`,
          plan: {
            source: idea.projectId ? 'wordpress' : 'manual',
            keyword: idea.targetKeyword,
            topics: [] as ContentPlanTopic[],
            generatedAt: idea.createdAt.toISOString(),
          },
          lastGenerated: idea.createdAt.toISOString(),
        });
      }

      const plan = plansMap.get(key);
      plan.plan.topics.push({
        title: idea.title,
        description: idea.description || '',
        keywords: idea.keywords || [],
        priority: idea.priority || 'medium',
        reason: idea.reason,
      });

      // Update last generated date if this idea is newer
      if (new Date(idea.createdAt) > new Date(plan.lastGenerated)) {
        plan.lastGenerated = idea.createdAt.toISOString();
      }
    });

    const plans = Array.from(plansMap.values());

    return NextResponse.json({
      success: true,
      plans,
    });

  } catch (error: any) {
    console.error('[simplified/content-plan] GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get content plans',
        message: 'Kan content plannen niet ophalen',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simplified/content-plan
 * Generate new content plan based on keyword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Je moet ingelogd zijn'
      }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ 
        error: 'Client not found',
        message: 'Gebruiker niet gevonden'
      }, { status: 404 });
    }

    const body = await request.json();
    const { projectId, keyword } = body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return NextResponse.json({ 
        error: 'Invalid input',
        message: 'Voer een geldig keyword in'
      }, { status: 400 });
    }

    // Validate project if provided
    let project = null;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId, clientId: client.id }
      });

      if (!project) {
        return NextResponse.json({ 
          error: 'Project not found',
          message: 'Project niet gevonden'
        }, { status: 404 });
      }
    }

    // Generate content plan using AI
    const prompt = `Je bent een expert SEO content strategist. Genereer een uitgebreid content plan voor het keyword: "${keyword}".

${project ? `Context: Dit is voor de website "${project.name}" (${project.websiteUrl || 'geen URL'}) in de niche "${project.niche || 'algemeen'}"` : ''}

Genereer 8-12 artikel topics die:
1. Gerelateerd zijn aan het hoofdkeyword
2. Verschillende zoekintents dekken (informationeel, transactioneel, navigational)
3. Long-tail variaties bevatten
4. Content gaps adresseren

Geef je antwoord als een JSON array met objecten in dit formaat:
{
  "topics": [
    {
      "title": "Artikel titel",
      "description": "Korte beschrijving van wat het artikel behandelt",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high|medium|low",
      "reason": "Waarom dit topic belangrijk is"
    }
  ]
}

Geef ALLEEN de JSON terug, geen extra tekst.`;

    const aiResponse = await chatCompletion(
      [
        { role: 'system', content: 'Je bent een SEO expert die gestructureerde JSON content plannen genereert.' },
        { role: 'user', content: prompt }
      ],
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        max_tokens: 4000,
      }
    );

    let topics: ContentPlanTopic[] = [];
    try {
      const cleanedResponse = aiResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(cleanedResponse);
      topics = parsed.topics || [];
    } catch (parseError) {
      console.error('[simplified/content-plan] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    if (topics.length === 0) {
      throw new Error('No topics generated');
    }

    // Save ideas to database
    const savedIdeas = await Promise.all(
      topics.map((topic, index) =>
        prisma.articleIdea.create({
          data: {
            clientId: client.id,
            projectId: projectId || null,
            title: topic.title,
            description: topic.description,
            keywords: topic.keywords,
            priority: topic.priority,
            reason: topic.reason,
            targetKeyword: keyword,
            aiScore: 1.0 - (index * 0.05), // Decreasing score based on order
            searchVolume: 0,
          },
        })
      )
    );

    console.log(`[simplified/content-plan] Generated ${topics.length} topics for keyword: ${keyword}`);

    return NextResponse.json({
      success: true,
      topics,
      savedCount: savedIdeas.length,
    });

  } catch (error: any) {
    console.error('[simplified/content-plan] POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate content plan',
        message: 'Kan content plan niet genereren',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
