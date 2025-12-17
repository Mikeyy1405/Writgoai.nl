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
    
    if (!DataForSEO.isConfigured()) {
      return NextResponse.json(
        { error: 'DataForSEO is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { keyword, location = 'Netherlands', language = 'nl' } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing keyword' },
        { status: 400 }
      );
    }

    console.log(`[DataForSEO API] Fetching SERP data for: ${keyword}`);

    // Get SERP data
    const serpData = await DataForSEO.getSerpData(keyword, location, language);

    if (!serpData) {
      return NextResponse.json(
        { error: 'No SERP data found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serpData,
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
