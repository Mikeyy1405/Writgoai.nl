/**
 * POST /api/client/topical-authority/dataforseo/serp
 * 
 * Get SERP analysis from DataForSEO
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient } from '@/lib/services/content-plan-service';
import { DataForSEO } from '@/lib/dataforseo-api';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await validateClient(session);
    
    const body = await request.json();
    const { keyword, location = 'Netherlands', language = 'nl' } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing keyword' },
        { status: 400 }
      );
    }

    console.log(`[DataForSEO API] Fetching SERP data for: ${keyword}`);

    // Get SERP data (returns null if API not configured or fails)
    const serpData = await DataForSEO.getSerpData(keyword, location, language);

    // Return empty data if SERP data not available
    if (!serpData) {
      console.log(`[DataForSEO API] No SERP data available - using defaults`);
      return NextResponse.json({
        success: true,
        data: {
          keyword,
          topResults: [],
          serpFeatures: [],
          peopleAlsoAsk: [],
          relatedSearches: [],
        },
        usingDefaults: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: serpData,
      usingDefaults: !DataForSEO.isConfigured(),
    });

  } catch (error: any) {
    console.error('[DataForSEO API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch SERP data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
