
/**
 * Cron Job: Dagelijkse GSC Data Sync
 * Synchroniseert Search Console data voor alle actieve projecten
 * Runs: Daily at 02:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncProjectGSCData } from '@/lib/google-search-console';

// Verifier cron secret voor beveiliging
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('⚠️ CRON_SECRET niet geconfigureerd');
    return true; // Allow in development
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting GSC data sync cron job...');

    // Haal alle projecten op met GSC enabled
    const projects = await prisma.project.findMany({
      where: {
        googleSearchConsoleEnabled: true,
        googleSearchConsoleSiteUrl: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`📊 Found ${projects.length} projects with GSC enabled`);

    const results = {
      total: projects.length,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Sync elk project
    for (const project of projects) {
      try {
        console.log(`🔄 Syncing GSC data for project: ${project.name}`);
        
        await syncProjectGSCData(project.id, project.client.id);
        
        results.synced++;
        console.log(`✅ Successfully synced: ${project.name}`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to sync ${project.name}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('🎉 GSC sync cron job completed');
    console.log(`📊 Results: ${results.synced} synced, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'GSC data sync completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ GSC sync cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
