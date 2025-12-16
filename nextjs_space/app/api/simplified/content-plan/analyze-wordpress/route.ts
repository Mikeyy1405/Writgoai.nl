/**
 * WordPress Content Analysis API Route
 * 
 * POST: Analyze WordPress site and generate content gap analysis
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

interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt?: { rendered: string };
  categories?: number[];
  tags?: number[];
}

/**
 * POST /api/simplified/content-plan/analyze-wordpress
 * Analyze WordPress site and generate content plan based on gaps
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
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ 
        error: 'Invalid input',
        message: 'Project ID is verplicht'
      }, { status: 400 });
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found',
        message: 'Project niet gevonden'
      }, { status: 404 });
    }

    if (!project.websiteUrl) {
      return NextResponse.json({ 
        error: 'No website URL',
        message: 'Geen website URL gevonden voor dit project'
      }, { status: 400 });
    }

    console.log(`[analyze-wordpress] Analyzing WordPress site: ${project.websiteUrl}`);

    // Fetch existing WordPress posts
    let existingPosts: WordPressPost[] = [];
    try {
      const wpApiUrl = `${project.websiteUrl}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,excerpt,categories,tags`;
      const response = await fetch(wpApiUrl, {
        headers: {
          'User-Agent': 'WritGoAI Content Planner/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        existingPosts = await response.json();
        console.log(`[analyze-wordpress] Fetched ${existingPosts.length} existing posts`);
      } else {
        console.warn(`[analyze-wordpress] Failed to fetch posts: ${response.status}`);
        // Continue without existing posts data
      }
    } catch (fetchError: any) {
      console.warn(`[analyze-wordpress] Error fetching WordPress content:`, fetchError.message);
      // Continue without existing posts data
    }

    // Prepare content summary for AI
    const existingTitles = existingPosts.map(post => post.title.rendered).slice(0, 30);
    const contentSummary = existingTitles.length > 0
      ? `Bestaande artikelen:\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : 'Geen bestaande content gevonden of site niet toegankelijk';

    // Generate content gap analysis using AI
    const prompt = `Je bent een expert SEO content strategist. Analyseer de WordPress website en genereer een content plan.

Website: ${project.name} (${project.websiteUrl})
Niche: ${project.niche || 'Niet gespecificeerd'}

${contentSummary}

Gebaseerd op de bestaande content (of het ontbreken daarvan), genereer 8-12 nieuwe artikel topics die:
1. Content gaps invullen die nog niet gedekt zijn
2. De niche en doelgroep aanspreken
3. Verschillende zoekintents dekken
4. SEO-vriendelijk zijn met goede zoekvolume potentie
5. Complementair zijn aan bestaande content

Geef je antwoord als een JSON object met dit formaat:
{
  "topics": [
    {
      "title": "Artikel titel",
      "description": "Korte beschrijving van het artikel",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high|medium|low",
      "reason": "Waarom dit topic een content gap invult"
    }
  ]
}

Geef ALLEEN de JSON terug, geen extra tekst.`;

    const aiResponse = await chatCompletion(
      [
        { role: 'system', content: 'Je bent een SEO expert die WordPress sites analyseert en gestructureerde JSON content plannen genereert.' },
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
      console.error('[analyze-wordpress] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    if (topics.length === 0) {
      throw new Error('No topics generated from analysis');
    }

    // Save ideas to database
    const savedIdeas = await Promise.all(
      topics.map((topic, index) =>
        prisma.articleIdea.create({
          data: {
            clientId: client.id,
            projectId: project.id,
            title: topic.title,
            description: topic.description,
            keywords: topic.keywords,
            priority: topic.priority,
            reason: topic.reason,
            aiScore: 1.0 - (index * 0.05),
            searchVolume: 0,
          },
        })
      )
    );

    console.log(`[analyze-wordpress] Generated ${topics.length} content gap topics for project: ${project.name}`);

    return NextResponse.json({
      success: true,
      topics,
      savedCount: savedIdeas.length,
      existingPostsAnalyzed: existingPosts.length,
    });

  } catch (error: any) {
    console.error('[analyze-wordpress] POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze WordPress site',
        message: 'Kan WordPress site niet analyseren',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
