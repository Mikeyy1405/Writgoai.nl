import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncGSCData } from '@/lib/services/google-search-console-service';
import { trackGoogleUpdates } from '@/lib/services/google-updates-tracker';

/**
 * Daily GSC Sync Cron Job
 * 
 * Runs daily at 06:00 AM
 * - Syncs GSC data for all projects with connected GSC
 * - Generates performance alerts
 * - Generates improvement tips
 * - Tracks Google algorithm updates
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[GSC Cron] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GSC Cron] Starting daily sync...');

    // Get all projects with GSC connected
    const projects = await prisma.project.findMany({
      where: {
        google_search_console_token: { not: null }
      },
      select: {
        id: true,
        name: true,
        website: true
      }
    });

    console.log(`[GSC Cron] Found ${projects.length} projects with GSC connected`);

    const results = {
      totalProjects: projects.length,
      successCount: 0,
      errorCount: 0,
      totalUrlsProcessed: 0,
      errors: [] as Array<{ projectId: string; projectName: string; error: string }>
    };

    // Sync each project
    for (const project of projects) {
      try {
        console.log(`[GSC Cron] Syncing project: ${project.name} (${project.id})`);
        
        const syncResult = await syncGSCData(project.id);
        
        if (syncResult.success) {
          results.successCount++;
          results.totalUrlsProcessed += syncResult.urlsProcessed;
          console.log(`[GSC Cron] ✅ Synced ${project.name}: ${syncResult.urlsProcessed} URLs`);
        } else {
          results.errorCount++;
          results.errors.push({
            projectId: project.id,
            projectName: project.name,
            error: 'Sync failed'
          });
          console.log(`[GSC Cron] ❌ Failed to sync ${project.name}`);
        }
      } catch (error: any) {
        results.errorCount++;
        results.errors.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message || 'Unknown error'
        });
        console.error(`[GSC Cron] Error syncing ${project.name}:`, error);
      }

      // Add delay between projects to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    // Track Google algorithm updates
    try {
      console.log('[GSC Cron] Tracking Google algorithm updates...');
      await trackGoogleUpdates();
      console.log('[GSC Cron] ✅ Google updates tracked');
    } catch (error) {
      console.error('[GSC Cron] Error tracking Google updates:', error);
    }

    console.log('[GSC Cron] Daily sync completed');
    console.log(`[GSC Cron] Results: ${results.successCount} success, ${results.errorCount} errors, ${results.totalUrlsProcessed} total URLs`);

    return NextResponse.json({
      success: true,
      message: 'Daily GSC sync completed',
      results
    });

  } catch (error: any) {
    console.error('[GSC Cron] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Fatal error occurred' },
      { status: 500 }
    );
  }
}
