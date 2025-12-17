/**
 * POST /api/client/topical-authority/analyze-website
 * 
 * Analyze a WordPress website and detect niche automatically
 * This provides a preview before generating the full topical authority map
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient, validateProject } from '@/lib/services/content-plan-service';
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const body = await request.json();
    
    const { projectId } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'projectId is required' },
        { status: 400 }
      );
    }

    // Validate project ownership
    await validateProject(projectId, client.id);

    console.log(`[Website Analysis API] Analyzing website for project ${projectId}`);

    // Analyze the website
    const analysis = await TopicalAuthorityService.analyzeWebsite(projectId);

    console.log(`[Website Analysis API] ✅ Analysis complete`);
    console.log(`[Website Analysis API]    - Niche: ${analysis.niche}`);
    console.log(`[Website Analysis API]    - Existing articles: ${analysis.existingArticleCount}`);
    console.log(`[Website Analysis API]    - Content gaps: ${analysis.contentGaps.length}`);

    return NextResponse.json({
      success: true,
      message: 'Website analysis complete',
      data: analysis,
    });

  } catch (error: any) {
    console.error('[Website Analysis API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze website',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
