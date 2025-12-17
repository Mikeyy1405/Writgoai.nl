/**
 * POST /api/client/topical-authority/generate-map
 * 
 * Generate a complete topical authority map with 400-500 articles
 * 
 * NEW: Can automatically detect niche from WordPress website
 * - If `niche` is provided: Use that niche (backwards compatible)
 * - If `niche` is NOT provided or `autoAnalyze=true`: Automatically analyze website and detect niche
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
      niche, // Optional: will auto-detect if not provided
      description,
      targetArticles = 450,
      location = 'Netherlands',
      language = 'nl',
      useDataForSEO = true,
      analyzeExistingContent = true,
      autoAnalyze = false, // Set to true to force website analysis
    } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'projectId is required' },
        { status: 400 }
      );
    }

    // Validate project ownership
    await validateProject(projectId, client.id);

    console.log(`[Topical Authority API] Generating map for project ${projectId}`);
    
    if (niche && !autoAnalyze) {
      console.log(`[Topical Authority API] Using provided niche: ${niche}`);
    } else {
      console.log(`[Topical Authority API] Will auto-detect niche from website`);
    }
    
    console.log(`[Topical Authority API] Target: ${targetArticles} articles`);

    // Generate the map (this will take some time)
    // The service will automatically analyze the website if niche is not provided
    const result = await TopicalAuthorityService.generateMap({
      projectId,
      clientId: client.id,
      niche, // Can be undefined
      description,
      targetArticles,
      location,
      language,
      useDataForSEO,
      analyzeExistingContent,
      autoAnalyze, // Enable automatic website analysis
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
