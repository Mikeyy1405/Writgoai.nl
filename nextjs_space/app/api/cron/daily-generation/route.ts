
import { NextRequest, NextResponse } from 'next/server';
import { runDailyContentGeneration } from '@/lib/professional-content-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'writgo-cron-secret-2025';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🤖 CRON job triggered: Daily content generation');
    
    // Run content generation for all active clients
    const results = await runDailyContentGeneration();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error('❌ CRON job error:', error);
    return NextResponse.json(
      { 
        error: 'CRON job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
