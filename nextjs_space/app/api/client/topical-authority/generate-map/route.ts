/**
 * POST /api/client/topical-authority/generate-map
 * 
 * Generate a complete topical authority map with 400-500 articles
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
    
    const {
      projectId,
      niche,
      description,
      targetArticles = 450,
      location = 'Netherlands',
      language = 'nl',
      useDataForSEO = true,
      analyzeExistingContent = true,
    } = body;

    // Validate required fields
    if (!projectId || !niche) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'projectId and niche are required' },
        { status: 400 }
      );
    }

    // Validate project ownership
    await validateProject(projectId, client.id);

    console.log(`[Topical Authority API] Generating map for project ${projectId}`);
    console.log(`[Topical Authority API] Niche: ${niche}, Target: ${targetArticles} articles`);

    // Generate the map (this will take some time)
    const result = await TopicalAuthorityService.generateMap({
      projectId,
      clientId: client.id,
      niche,
      description,
      targetArticles,
      location,
      language,
      useDataForSEO,
      analyzeExistingContent,
    });

    return NextResponse.json({
      success: true,
      message: 'Topical authority map generated successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('[Topical Authority API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate topical authority map',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
