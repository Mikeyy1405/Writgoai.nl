/**
 * Content Plan Refresh API Route
 * 
 * POST: Refresh existing plan with new ideas based on project analysis
 * 
 * Refactored to use shared service layer (retains specific refreshDailyInsights logic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { refreshDailyInsights, MasterContentPlan } from '@/lib/intelligent-content-planner';
import { 
  validateClientAndProject,
  generateSlug,
  mapServiceError
} from '@/lib/services/content-plan-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/client/content-plan/refresh?projectId=xxx&language=NL
 * Refresh content plan with new ideas
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const language = searchParams.get('language') || 'NL';

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Validate client and project (consolidated validation)
    const { client, project } = await validateClientAndProject(session, projectId);

    console.log(`🔄 Refreshing content plan for project: ${project.name}`);

    // Get existing plan
    const existingPlan = project.contentStrategy as any as MasterContentPlan;

    if (!existingPlan) {
      return NextResponse.json({ 
        error: 'No existing plan found. Generate one first.' 
      }, { status: 400 });
    }

    const niche = project.niche || project.name || 'algemeen';
    const targetAudience = project.targetAudience || 'Nederlandse lezers';

    // Generate fresh ideas using intelligent-content-planner
    const newIdeas = await refreshDailyInsights(
      existingPlan,
      niche,
      targetAudience
    );

    // Transform ideas to database format
    const articleIdeasData = newIdeas.map(idea => ({
      clientId: client.id,
      projectId: projectId,
      title: idea.title,
      slug: generateSlug(idea.title),
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

    // Upsert ideas (avoid duplicates)
    const savedIdeas = [];
    for (const ideaData of articleIdeasData) {
      try {
        const saved = await prisma.articleIdea.upsert({
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
        });
        savedIdeas.push(saved);
      } catch (error) {
        console.error('Error saving idea:', error);
        // Continue with other ideas
      }
    }

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      message: `${savedIdeas.length} nieuwe ideeën toegevoegd!`,
    });

  } catch (error: any) {
    console.error('[content-plan/refresh] Error:', error);
    const errorResponse = mapServiceError(error);
    return NextResponse.json(
      { 
        error: errorResponse.error,
        message: errorResponse.message,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}
