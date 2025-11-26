
/**
 * CRON JOB: Daily Content Generation
 * Wordt elke dag uitgevoerd om content te genereren en publiceren
 * Call: GET /api/cron/daily-content-generation
 * Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTodaysContent } from '@/lib/master-automation';

export async function GET(request: NextRequest) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'writgo-cron-secret-2025'}`;
    
    if (authHeader !== expectedAuth) {
      console.error('[CRON] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Daily content generation triggered');

    // Genereer content voor vandaag
    const results = await generateTodaysContent();

    console.log('[CRON] Daily content generation completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        articlesGenerated: results.articles,
        reelsGenerated: results.reels,
        videosGenerated: results.videos,
        errors: results.errors,
      },
    });

  } catch (error) {
    console.error('[CRON] Fatal error in daily content generation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also allow POST for easier testing
export async function POST(request: NextRequest) {
  return GET(request);
}
