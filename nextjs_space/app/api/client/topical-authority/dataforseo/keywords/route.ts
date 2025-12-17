/**
 * POST /api/client/topical-authority/dataforseo/keywords
 * 
 * Get keyword data from DataForSEO
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
    const { keywords, location = 'Netherlands', language = 'nl' } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid keywords array' },
        { status: 400 }
      );
    }

    console.log(`[DataForSEO API] Fetching data for ${keywords.length} keywords`);

    // Get keyword data (uses default metrics if API not configured or fails)
    const keywordData = await DataForSEO.getBatchKeywordData({
      keywords,
      location,
      language,
    });

    return NextResponse.json({
      success: true,
      data: keywordData,
      usingDefaults: !DataForSEO.isConfigured(),
    });

  } catch (error: any) {
    console.error('[DataForSEO API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch keyword data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
