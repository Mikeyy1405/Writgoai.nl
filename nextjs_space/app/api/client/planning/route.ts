export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout
export const runtime = 'nodejs';

/**
 * Unified Planning API
 * Consolidates all content planning functionality:
 * - generate: Generate new content plan for project
 * - refresh: Refresh existing plan with new ideas
 * - analyze: Analyze website/WordPress for content gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  performCompleteContentResearch,
  refreshDailyInsights,
  analyzeWebsiteDeep,
  MasterContentPlan
} from '@/lib/intelligent-content-planner';

// POST /api/client/planning
// Body: { action: 'generate' | 'refresh' | 'analyze', projectId, options }
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
    const { action, projectId, options = {} } = body;

    switch (action) {
      case 'generate':
        return await generateContentPlan(client, projectId, options);
      
      case 'refresh':
        return await refreshContentPlan(client, projectId, options);
      
      case 'analyze':
        return await analyzeForContent(client, projectId, options);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Planning API error:', error);
    return NextResponse.json(
      { error: error.message || 'Planning operation failed' },
      { status: 500 }
    );
  }
}

// GET /api/client/planning?projectId=xxx
// Retrieve existing content plan
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get article ideas for this project
    const articleIdeas = await prisma.articleIdea.findMany({
      where: {
        clientId: client.id,
        projectId: projectId
      },
      include: {
        savedContent: {
          select: {
            id: true,
            publishedUrl: true,
            publishedAt: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { aiScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        niche: project.niche,
      },
      contentStrategy: project.contentStrategy,
      articleIdeas,
      hasData: !!project.contentStrategy,
    });

  } catch (error: any) {
    console.error('Get planning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get content plan' },
      { status: 500 }
    );
  }
}

// Generate new content plan
async function generateContentPlan(client: any, projectId: string, options: any) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: client.id }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  console.log(`🚀 Generating content plan for project: ${project.name}`);

  const websiteUrl = project.websiteUrl || '';
  const niche = project.niche || project.name || 'algemeen';
  const targetAudience = project.targetAudience || 'Nederlandse lezers';
  const keywords = project.keywords || [];

  // Perform complete content research
  const contentPlan: MasterContentPlan = await performCompleteContentResearch(
    websiteUrl,
    niche,
    targetAudience,
    keywords,
    project.name
  );

  // Save to database
  const articleIdeasData = contentPlan.contentIdeas.map(idea => ({
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
    aiScore: idea.trending ? 90 : (idea.competitorGap ? 80 : 70),
    trending: idea.trending,
    competitorGap: idea.competitorGap,
    status: 'idea',
  }));

  // Update project with content plan
  await prisma.project.update({
    where: { id: project.id },
    data: {
      contentAnalysis: {
        websiteAnalysis: contentPlan.websiteAnalysis,
        competitorAnalysis: contentPlan.competitorAnalysis,
        trendingTopics: contentPlan.trendingTopics,
      } as any,
      contentAnalysisStatus: 'completed',
      contentAnalysisDate: new Date(),
      contentStrategy: contentPlan as any,
      contentStrategyStatus: 'completed',
      contentStrategyDate: new Date(),
    }
  });

  // Clean up old ideas (30+ days old and already published)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.articleIdea.deleteMany({
    where: {
      clientId: client.id,
      projectId: projectId,
      status: { in: ['written', 'published'] },
      createdAt: { lt: thirtyDaysAgo }
    }
  });

  // Save new ideas
  await Promise.all(
    articleIdeasData.map(ideaData =>
      prisma.articleIdea.upsert({
        where: {
          clientId_slug: {
            clientId: client.id,
            slug: ideaData.slug,
          }
        },
        update: {
          secondaryKeywords: ideaData.secondaryKeywords,
          contentOutline: ideaData.contentOutline,
          aiScore: ideaData.aiScore,
          trending: ideaData.trending,
          competitorGap: ideaData.competitorGap,
        },
        create: ideaData,
      })
    )
  );

  return NextResponse.json({
    success: true,
    plan: contentPlan,
    articleIdeas: articleIdeasData,
    message: `${contentPlan.summary.totalIdeas} content ideeën gegenereerd!`,
  });
}

// Refresh existing plan with new ideas
async function refreshContentPlan(client: any, projectId: string, options: any) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: client.id }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  console.log(`🔄 Refreshing content plan for project: ${project.name}`);

  // Get existing plan
  const existingPlan = project.contentStrategy as any as MasterContentPlan;

  if (!existingPlan) {
    return NextResponse.json({ error: 'No existing plan found. Generate one first.' }, { status: 400 });
  }

  const niche = project.niche || project.name || 'algemeen';
  const targetAudience = project.targetAudience || 'Nederlandse lezers';

  // Generate fresh ideas
  const newIdeas = await refreshDailyInsights(
    existingPlan,
    niche,
    targetAudience
  );

  // Save new ideas to database
  const articleIdeasData = newIdeas.map(idea => ({
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
    aiScore: idea.trending ? 90 : (idea.competitorGap ? 80 : 70),
    trending: idea.trending,
    competitorGap: idea.competitorGap,
    status: 'idea',
  }));

  await Promise.all(
    articleIdeasData.map(ideaData =>
      prisma.articleIdea.upsert({
        where: {
          clientId_slug: {
            clientId: client.id,
            slug: ideaData.slug,
          }
        },
        update: {
          secondaryKeywords: ideaData.secondaryKeywords,
          contentOutline: ideaData.contentOutline,
          aiScore: ideaData.aiScore,
          trending: ideaData.trending,
          competitorGap: ideaData.competitorGap,
        },
        create: ideaData,
      })
    )
  );

  return NextResponse.json({
    success: true,
    newIdeas: articleIdeasData,
    message: `${newIdeas.length} nieuwe ideeën toegevoegd!`,
  });
}

// Analyze website for content gaps
async function analyzeForContent(client: any, projectId: string, options: any) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, clientId: client.id }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  console.log(`🔍 Analyzing website for project: ${project.name}`);

  const websiteUrl = project.websiteUrl || '';
  const niche = project.niche || project.name || 'algemeen';

  if (!websiteUrl) {
    return NextResponse.json({ error: 'Website URL required for analysis' }, { status: 400 });
  }

  // Perform deep website analysis
  const websiteAnalysis = await analyzeWebsiteDeep(
    websiteUrl,
    niche,
    project.name
  );

  // Update project with analysis
  await prisma.project.update({
    where: { id: project.id },
    data: {
      contentAnalysis: {
        websiteAnalysis: websiteAnalysis,
      } as any,
      contentAnalysisStatus: 'completed',
      contentAnalysisDate: new Date(),
    }
  });

  return NextResponse.json({
    success: true,
    websiteAnalysis,
    message: `Website geanalyseerd: ${websiteAnalysis.existingTopics.length} topics gevonden, ${websiteAnalysis.contentGaps.length} gaps geïdentificeerd`,
  });
}
