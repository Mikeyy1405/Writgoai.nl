
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Admin endpoint to manually trigger autopilot for all eligible projects
 * This is useful when the cron job fails or for testing purposes
 */
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log(`[Admin Autopilot Trigger] Triggered by admin: ${session.user.email}`);

    // Get the cron secret from environment
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    const apiUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';

    // Call the autopilot cron endpoint
    const response = await fetch(`${apiUrl}/api/cron/autopilot-projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger autopilot');
    }

    console.log(`[Admin Autopilot Trigger] Successfully triggered autopilot`);
    console.log(`[Admin Autopilot Trigger] Processed ${data.processed} projects`);

    return NextResponse.json({
      success: true,
      message: `Autopilot triggered successfully. Processed ${data.processed} projects.`,
      data,
    });

  } catch (error: any) {
    console.error('[Admin Autopilot Trigger] Error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes
