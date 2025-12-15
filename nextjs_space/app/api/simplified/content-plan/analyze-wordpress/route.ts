import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import {
  scrapeWordPressSite,
  generateContentSummary,
  extractTopicsFromAnalysis,
} from '@/lib/wordpress-scraper';

/**
 * POST /api/simplified/content-plan/analyze-wordpress
 * Analyseer een WordPress site en genereer automatisch een content plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Haal project op met WordPress URL
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.websiteUrl) {
      return NextResponse.json(
        { error: 'Project heeft geen WordPress URL geconfigureerd' },
        { status: 400 }
      );
    }

    console.log(`[WordPress Analyze] Starting analysis for project: ${project.name}`);
    console.log(`[WordPress Analyze] WordPress URL: ${project.websiteUrl}`);

    // Scrape WordPress site
    let analysis;
    try {
      analysis = await scrapeWordPressSite(project.websiteUrl, 50);
    } catch (error: any) {
      console.error('[WordPress Analyze] Scraping error:', error);
      return NextResponse.json(
        { 
          error: 'Kon WordPress site niet analyseren',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Check if we got any posts
    if (analysis.posts.length === 0) {
      return NextResponse.json(
        { 
          error: 'Geen posts gevonden op deze WordPress site',
          details: 'Zorg ervoor dat de WordPress REST API beschikbaar is'
        },
        { status: 400 }
      );
    }

    console.log(`[WordPress Analyze] Found ${analysis.posts.length} posts`);

    // Generate content summary
    const contentSummary = generateContentSummary(analysis);
    const existingTopics = extractTopicsFromAnalysis(analysis);

    console.log(`[WordPress Analyze] Extracted ${existingTopics.length} existing topics`);

    // Use AI to analyze and generate new content ideas
    const prompt = `Je bent een SEO content strategist die een WordPress site analyseert.

WORDPRESS SITE ANALYSE:
${contentSummary}

BESTAANDE TOPICS/THEMA'S:
${existingTopics.join(', ')}

TAAK:
Analyseer deze WordPress site en:
1. Identificeer de hoofdniche/thema van de site
2. Bepaal welke content gaps er zijn (onderwerpen die nog niet of weinig behandeld zijn)
3. Genereer 15-20 NIEUWE content topics die:
   - Passen bij de niche van de site
   - NOG NIET of weinig behandeld zijn op de site
   - Relevant zijn voor de doelgroep
   - SEO-vriendelijk zijn
   - Goed aansluiten bij de bestaande content

Voor elk topic geef je:
- Title: Een pakkende titel voor het artikel
- Description: Een korte beschrijving (1-2 zinnen) wat het artikel behandelt
- Keywords: 3-5 gerelateerde keywords
- Priority: high, medium, of low (gebaseerd op relevantie en content gap)
- Reason: Waarom dit topic relevant is en welke content gap het vult

Format je antwoord als JSON array:
[
  {
    "title": "...",
    "description": "...",
    "keywords": ["...", "..."],
    "priority": "high",
    "reason": "..."
  }
]

BELANGRIJK:
- Genereer ALLEEN topics die nog niet of nauwelijks behandeld zijn
- Focus op content gaps
- Zorg dat topics relevant zijn voor de niche
- Geef ALLEEN de JSON array terug, geen extra tekst`;

    console.log('[WordPress Analyze] Generating content plan with AI...');

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
      console.error('[WordPress Analyze] Error parsing AI response:', error);
      return NextResponse.json(
        { error: 'Kon AI response niet verwerken' },
        { status: 500 }
      );
    }

    console.log(`[WordPress Analyze] Generated ${topics.length} new topics`);

    // Sla content plan op in project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        contentPlan: {
          source: 'wordpress-analysis',
          analyzedUrl: project.websiteUrl,
          existingPosts: analysis.posts.length,
          existingCategories: analysis.categories.map(c => c.name),
          existingTags: analysis.tags.slice(0, 20).map(t => t.name),
          topics,
          generatedAt: new Date().toISOString(),
        },
        lastPlanGenerated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      source: 'wordpress-analysis',
      analyzedUrl: project.websiteUrl,
      existingPosts: analysis.posts.length,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('[WordPress Analyze] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze WordPress site',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
