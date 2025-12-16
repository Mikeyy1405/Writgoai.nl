/**
 * WordPress Content Analysis API Route
 * 
 * POST: Analyze WordPress site and generate content gap analysis
 * 
 * Refactored to use shared service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  validateClientAndProject,
  fetchWordPressPosts,
  analyzeWordPressContentGaps,
  saveArticleIdeas,
  mapServiceError
} from '@/lib/services/content-plan-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/simplified/content-plan/analyze-wordpress
 * Analyze WordPress site and generate content plan based on gaps
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ 
        error: 'Invalid input',
        message: 'Project ID is verplicht'
      }, { status: 400 });
    }

    // Validate client and project (consolidated validation)
    const { client, project } = await validateClientAndProject(session, projectId);

    if (!project.websiteUrl) {
      return NextResponse.json({ 
        error: 'No website URL',
        message: 'Geen website URL gevonden voor dit project'
      }, { status: 400 });
    }

    console.log(`[analyze-wordpress] Analyzing WordPress site: ${project.websiteUrl}`);

    // Fetch existing WordPress posts using shared service
    const existingPosts = await fetchWordPressPosts(project.websiteUrl, {
      perPage: 50,
      timeout: 10000
    });

    // Generate content gap analysis using shared service
    const topics = await analyzeWordPressContentGaps(project, existingPosts);

    console.log(`[analyze-wordpress] Successfully generated ${topics.length} topics`);

    // Save ideas to database using shared service
    const savedIdeas = await saveArticleIdeas(
      topics,
      client.id,
      project.id,
      { useUpsert: false } // Use create for new ideas
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
