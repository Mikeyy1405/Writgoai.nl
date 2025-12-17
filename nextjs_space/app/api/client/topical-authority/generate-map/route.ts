/**
 * POST /api/client/topical-authority/generate-map
 * 
 * Generate a complete topical authority map with 400-500 articles
 * 
 * AUTOMATIC MODE (NEW):
 * - Automatically analyzes WordPress website
 * - Auto-detects niche, sub-niches, and content gaps
 * - Generates 400-500 unique articles
 * - Filters out existing content
 * - No manual input required!
 * 
 * MANUAL MODE (Backwards Compatible):
 * - If `niche` is provided and `autoAnalyze=false`: Use provided niche
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient, validateProject } from '@/lib/services/content-plan-service';
import { TopicalAuthorityService } from '@/lib/services/topical-authority-service';

export async function POST(request: Request) {
  const startTime = Date.now();
  
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
      autoAnalyze = false, // Set to true to force automatic website analysis
    } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Ontbrekende velden', details: 'projectId is verplicht' },
        { status: 400 }
      );
    }

    // Validate project ownership
    const project = await validateProject(projectId, client.id);

    console.log(`[Topical Authority API] 🚀 Starting map generation`);
    console.log(`[Topical Authority API]    Project: ${project.name || projectId}`);
    console.log(`[Topical Authority API]    Mode: ${autoAnalyze || !niche ? 'AUTOMATIC' : 'MANUAL'}`);
    
    if (niche && !autoAnalyze) {
      console.log(`[Topical Authority API]    Niche: ${niche} (provided)`);
    } else {
      console.log(`[Topical Authority API]    Niche: Auto-detecting from website`);
      
      if (!project.websiteUrl) {
        return NextResponse.json(
          { 
            error: 'Geen website URL', 
            details: 'Er is geen website URL geconfigureerd voor dit project. Voeg een website URL toe of geef handmatig een niche op.' 
          },
          { status: 400 }
        );
      }
    }
    
    console.log(`[Topical Authority API]    Target: ${targetArticles} articles`);
    console.log(`[Topical Authority API]    DataForSEO: ${useDataForSEO ? 'Enabled' : 'Disabled'}`);

    // Generate the map (this will take some time)
    // The service will automatically analyze the website if niche is not provided or autoAnalyze=true
    const result = await TopicalAuthorityService.generateMap({
      projectId,
      clientId: client.id,
      niche, // Can be undefined for auto-detection
      description,
      targetArticles,
      location,
      language,
      useDataForSEO,
      analyzeExistingContent,
      autoAnalyze: autoAnalyze || !niche, // Force auto-analyze if no niche provided
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`[Topical Authority API] ✅ Map generated successfully in ${duration}s`);
    console.log(`[Topical Authority API]    Map ID: ${result.mapId}`);
    console.log(`[Topical Authority API]    Pillars: ${result.pillars.length}`);
    console.log(`[Topical Authority API]    Total Articles: ${result.totalArticles}`);

    return NextResponse.json({
      success: true,
      message: 'Topical authority map successfully generated',
      data: result,
      meta: {
        duration: `${duration}s`,
        mode: autoAnalyze || !niche ? 'automatic' : 'manual',
      },
    });

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.error(`[Topical Authority API] ❌ Error after ${duration}s:`, error.message);
    console.error('[Topical Authority API] Stack:', error.stack);
    
    // Provide user-friendly error messages
    let userMessage = error.message;
    
    if (error.message.includes('Could not auto-detect niche')) {
      userMessage = 'Kan niche niet automatisch detecteren. Zorg dat je website content bevat, of geef handmatig een niche op.';
    } else if (error.message.includes('No website URL')) {
      userMessage = 'Geen website URL geconfigureerd. Voeg een website URL toe aan je project.';
    } else if (error.message.includes('sitemap')) {
      userMessage = 'Kan sitemap niet ophalen. Controleer of je website een WordPress sitemap heeft.';
    }
    
    return NextResponse.json(
      { 
        error: 'Fout bij genereren topical authority map',
        details: userMessage,
        technicalDetails: error.message,
      },
      { status: 500 }
    );
  }
}
