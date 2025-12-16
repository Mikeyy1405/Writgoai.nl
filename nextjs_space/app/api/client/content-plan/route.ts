/**
 * Content Plan API Route
 * 
 * GET: Retrieve existing content plan and article ideas for a project
 * Wrapper for the planning API to maintain backward compatibility
 * 
 * Refactored to use shared service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  validateClientAndProject, 
  getArticleIdeas,
  mapServiceError 
} from '@/lib/services/content-plan-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/client/content-plan?projectId=xxx
 * Retrieve existing content plan and ideas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Validate client and project (consolidated validation)
    const { client, project } = await validateClientAndProject(session, projectId);

    // Get article ideas using shared service
    const ideas = await getArticleIdeas(client.id, projectId, {
      includeSavedContent: true
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        niche: project.niche,
      },
      ideas,
      hasData: ideas.length > 0,
    });

  } catch (error: any) {
    console.error('[content-plan] Get error:', error);
    const errorResponse = mapServiceError(error);
    return NextResponse.json(
      { 
        error: errorResponse.error,
        details: errorResponse.details
      },
      { status: errorResponse.status }
    );
  }
}
