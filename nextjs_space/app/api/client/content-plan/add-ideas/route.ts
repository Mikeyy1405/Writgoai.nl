/**
 * Content Plan Add Ideas API Route
 * 
 * POST: Add new content ideas based on keywords
 * 
 * Refactored to use shared service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  validateClientAndProject,
  generateContentIdeas,
  saveArticleIdeas,
  mapServiceError
} from '@/lib/services/content-plan-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * POST /api/client/content-plan/add-ideas
 * Body: { keywords: string[], projectId: string, language: string }
 * Add content ideas based on keywords
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { keywords, projectId, language = 'NL' } = body;

    // Validate inputs
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ 
        error: 'Keywords array is required' 
      }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ 
        error: 'projectId is required' 
      }, { status: 400 });
    }

    // Validate client and project (consolidated validation)
    const { client, project } = await validateClientAndProject(session, projectId);

    console.log(`💡 Generating ideas for keywords:`, keywords);

    // Generate ideas using shared service
    const topics = await generateContentIdeas({
      keywords,
      count: 10,
      language,
      temperature: 0.8,
    });

    // Save ideas to database using shared service
    const savedIdeas = await saveArticleIdeas(
      topics,
      client.id,
      projectId,
      { useUpsert: true }
    );

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      message: `${savedIdeas.length} nieuwe ideeën toegevoegd!`,
    });

  } catch (error: any) {
    console.error('[content-plan/add-ideas] Error:', error);
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
