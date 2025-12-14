import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes

/**
 * Daily Content Generation Cron Job
 * Generates content for all projects with autopilot enabled
 * 
 * This endpoint should be called by Render.com cron or external cron service
 * Security: Protected by CRON_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Daily Content] ❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Daily Content] 🚀 Starting daily content generation at ${now.toISOString()}`);

    // Trigger the main autopilot-projects cron
    // This is a wrapper that calls the more comprehensive autopilot-projects endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/cron/autopilot-projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Autopilot projects failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`[Daily Content] ✅ Daily content generation completed`);
    console.log(`[Daily Content] Projects processed: ${result.processed}`);

    return NextResponse.json({
      success: true,
      message: 'Daily content generation completed',
      timestamp: now.toISOString(),
      ...result,
    });

  } catch (error: any) {
    console.error('[Daily Content] ❌ Fatal error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support GET for simple health checks
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get stats on autopilot projects
  const autopilotProjects = await prisma.project.count({
    where: {
      autopilotEnabled: true,
    },
  });

  return NextResponse.json({
    status: 'operational',
    autopilotProjects,
    message: 'Use POST to trigger content generation',
  });
}
