import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron endpoint for WritGo AutoPilot
 * This should be called every 6 hours by a cron service (e.g., Render Cron Jobs, Vercel Cron, or external service)
 * 
 * Tasks:
 * 1. Check RSS feeds for new content opportunities
 * 2. Auto-publish scheduled articles
 */
export async function GET(request: NextRequest) {
  try {
    const results = {
      checkTriggers: null as any,
      autoPublish: null as any,
      errors: [] as string[]
    };

    // Task 1: Check RSS triggers
    try {
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl'}/api/writgo/check-triggers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (checkResponse.ok) {
        results.checkTriggers = await checkResponse.json();
      } else {
        results.errors.push(`Check triggers failed: ${checkResponse.statusText}`);
      }
    } catch (error: any) {
      results.errors.push(`Check triggers error: ${error.message}`);
    }

    // Task 2: Auto-publish scheduled content
    try {
      const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl'}/api/writgo/auto-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (publishResponse.ok) {
        results.autoPublish = await publishResponse.json();
      } else {
        results.errors.push(`Auto-publish failed: ${publishResponse.statusText}`);
      }
    } catch (error: any) {
      results.errors.push(`Auto-publish error: ${error.message}`);
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error: any) {
    console.error('Cron autopilot error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
