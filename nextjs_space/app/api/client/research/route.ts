export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout
export const runtime = 'nodejs';

/**
 * Unified Research API
 * Consolidates all research functionality:
 * - keywords: Keyword research with volumes, difficulty, etc.
 * - content: Content ideas generation
 * - competitors: Competitor analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  generateKeywordOpportunities,
  generateKeywordOpportunitiesFromKeyword,
  scanWebsiteForKeywords,
  strategicallyAnalyzeKeywords,
  findCompetitors,
  analyzeKeywordGaps,
  KeywordData,
  CompetitorData,
  KeywordGap
} from '@/lib/keyword-research';
import { generateContentIdea } from '@/lib/intelligent-content-planner';

// POST /api/client/research
// Body: { type: 'keywords' | 'content' | 'competitors', projectId, query, options }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { projects: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, projectId, query, options = {} } = body;

    switch (type) {
      case 'keywords':
        return await doKeywordResearch(client, projectId, query, options);
      
      case 'content':
        return await generateContentIdeas(client, projectId, options);
      
      case 'competitors':
        return await analyzeCompetitors(client, projectId, options);
      
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: error.message || 'Research operation failed' },
      { status: 500 }
    );
  }
}

// Keyword research with volumes, difficulty, etc.
async function doKeywordResearch(
  client: any,
  projectId: string | undefined,
  query: string,
  options: any
) {
  console.log('🔍 Starting keyword research for:', query);

  let keywords: KeywordData[] = [];
  let websiteUrl = '';
  let niche = query;

  // Check if we have a project or just a keyword
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (project) {
      websiteUrl = project.websiteUrl || '';
      niche = project.niche || project.name || query;
    }
  }

  // Determine if query is a URL or keyword
  const isUrl = query.includes('.') || query.startsWith('http');

  if (isUrl) {
    // URL-based keyword research
    console.log('📊 URL-based research mode');
    const existingKeywords = await scanWebsiteForKeywords(query);
    keywords = await generateKeywordOpportunities(
      query,
      existingKeywords,
      niche,
      options.onProgress
    );
  } else {
    // Keyword-based research
    console.log('🎯 Keyword-based research mode');
    keywords = await generateKeywordOpportunitiesFromKeyword(
      query,
      niche,
      options.onProgress
    );
  }

  // Apply strategic analysis
  if (keywords.length > 0) {
    keywords = await strategicallyAnalyzeKeywords(
      keywords,
      niche,
      options.onProgress
    );
  }

  return NextResponse.json({
    success: true,
    keywords,
    totalKeywords: keywords.length,
    primaryKeywords: keywords.filter(k => k.keywordTier === 'primary').length,
    secondaryKeywords: keywords.filter(k => k.keywordTier === 'secondary').length,
    lsiKeywords: keywords.filter(k => k.keywordTier === 'lsi').length,
    message: `${keywords.length} keywords gevonden`,
  });
}

// Generate content ideas
async function generateContentIdeas(
  client: any,
  projectId: string | undefined,
  options: any
) {
  console.log('💡 Generating content ideas');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required for content ideas' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: client.id }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Get existing content ideas
  const existingIdeas = await prisma.articleIdea.findMany({
    where: {
      clientId: client.id,
      projectId: projectId
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // If we have a custom title from options, generate idea for that
  if (options.title) {
    const niche = project.niche || project.name || 'algemeen';
    const targetAudience = project.targetAudience || 'Nederlandse lezers';

    const idea = await generateContentIdea(
      options.title,
      niche,
      targetAudience
    );

    // Save to database
    const ideaData = {
      clientId: client.id,
      projectId: projectId,
      title: idea.title,
      slug: idea.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      focusKeyword: idea.focusKeyword,
      topic: idea.description,
      secondaryKeywords: idea.secondaryKeywords,
      searchIntent: idea.searchIntent,
      difficulty: idea.estimatedDifficulty,
      contentOutline: { sections: idea.outline.map(h2 => ({ heading: h2, subpoints: [] })) },
      contentType: idea.contentType,
      priority: idea.priority,
      aiScore: 70,
      trending: idea.trending,
      competitorGap: idea.competitorGap,
      status: 'idea',
    };

    await prisma.articleIdea.upsert({
      where: {
        clientId_slug: {
          clientId: client.id,
          slug: ideaData.slug,
        }
      },
      update: ideaData,
      create: ideaData as any,
    });

    return NextResponse.json({
      success: true,
      idea: ideaData,
      message: 'Content idee gegenereerd!',
    });
  }

  // Return existing ideas
  return NextResponse.json({
    success: true,
    ideas: existingIdeas,
    totalIdeas: existingIdeas.length,
    message: `${existingIdeas.length} bestaande content ideeën`,
  });
}

// Analyze competitors
async function analyzeCompetitors(
  client: any,
  projectId: string | undefined,
  options: any
) {
  console.log('🎯 Analyzing competitors');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required for competitor analysis' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: client.id }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const websiteUrl = project.websiteUrl;
  const niche = project.niche || project.name || 'algemeen';

  if (!websiteUrl) {
    return NextResponse.json({ error: 'Website URL required for competitor analysis' }, { status: 400 });
  }

  // Find competitors
  const competitors: CompetitorData[] = await findCompetitors(
    websiteUrl,
    niche,
    options.onProgress
  );

  // Get keyword gaps
  const ownKeywords = await scanWebsiteForKeywords(websiteUrl);
  const keywordGaps: KeywordGap[] = await analyzeKeywordGaps(
    ownKeywords,
    competitors,
    options.onProgress
  );

  // Save competitor analysis to project
  await prisma.project.update({
    where: { id: project.id },
    data: {
      contentAnalysis: {
        ...(project.contentAnalysis as any || {}),
        competitorAnalysis: {
          competitors,
          keywordGaps,
          lastAnalyzed: new Date(),
        }
      } as any,
    }
  });

  return NextResponse.json({
    success: true,
    competitors,
    keywordGaps,
    totalCompetitors: competitors.length,
    totalGaps: keywordGaps.length,
    highOpportunityGaps: keywordGaps.filter(g => g.opportunity === 'high').length,
    message: `${competitors.length} concurrenten geanalyseerd, ${keywordGaps.length} keyword gaps gevonden`,
  });
}
