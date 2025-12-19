export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * AutoPilot Cron Runner
 * Runs every hour to process scheduled ArticleIdeas
 * 
 * Steps:
 * 1. Find all ArticleIdea with autopilotNextRun <= now
 * 2. Check client credits
 * 3. Run autopilot job
 * 4. Update next run timestamp
 * 5. Log results
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runAutoPilotJob } from '@/lib/autopilot/autopilot-orchestrator';

const CRON_SECRET = process.env.CRON_SECRET || 'writgo-content-automation-secret-2025';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 AutoPilot Cron Runner starting...');

    // Find all scheduled article ideas that are due
    const now = new Date();
    const scheduledIdeas = await prisma.articleIdea.findMany({
      where: {
        isScheduledForAutopilot: true,
        autopilotNextRun: {
          lte: now,
        },
        status: {
          in: ['idea', 'queued'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            isUnlimited: true,
            subscriptionCredits: true,
            topUpCredits: true,
          },
        },
      },
      orderBy: {
        autopilotNextRun: 'asc',
      },
      take: 10, // Process max 10 at a time
    });

    console.log(`📋 Found ${scheduledIdeas.length} scheduled article ideas`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ articleId: string; error: string }>,
    };

    for (const idea of scheduledIdeas) {
      try {
        console.log(`📝 Processing article: ${idea.title}`);

        // Check if client has sufficient credits (simplified check)
        const totalCredits = idea.client.subscriptionCredits + idea.client.topUpCredits;
        const isUnlimited = idea.client.isUnlimited;

        if (!isUnlimited && totalCredits < 200) {
          console.warn(`⚠️ Client ${idea.client.email} has insufficient credits`);
          results.skipped++;
          continue;
        }

        // Run the autopilot job
        await runAutoPilotJob(idea.id, idea.client.id);

        results.succeeded++;
        console.log(`✅ Successfully processed article: ${idea.title}`);
      } catch (error: any) {
        console.error(`❌ Failed to process article ${idea.title}:`, error);
        results.failed++;
        results.errors.push({
          articleId: idea.id,
          error: error.message,
        });
      }

      results.processed++;
    }

    console.log('🤖 AutoPilot Cron Runner completed');
    console.log(`📊 Results: ${results.succeeded} succeeded, ${results.failed} failed, ${results.skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: 'AutoPilot cron completed',
      results,
    });
  } catch (error: any) {
    console.error('❌ AutoPilot Cron Runner error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Cron job failed',
      },
      { status: 500 }
    );
  }
}
