/**
 * Email Sync Cron Job
 * POST /api/cron/email-sync
 * Triggered every 5 minutes by external cron service or Render cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllMailboxes } from '@/lib/email-mailbox-sync';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (providedSecret !== cronSecret) {
      console.error('[Cron] Invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Email sync started');
    const startTime = Date.now();

    // Sync all active mailboxes
    await syncAllMailboxes();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Email sync completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Email sync completed',
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error in email sync:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Email sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: 'email-sync-cron',
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}
