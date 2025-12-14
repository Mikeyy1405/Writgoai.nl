import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes

/**
 * Auto Generate Content Cron Job
 * Alias voor daily-content-generation endpoint voor backward compatibility
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Auto Generate Content] Redirecting to autopilot-projects...');

    // Call the main autopilot endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/cron/autopilot-projects`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });

  } catch (error: any) {
    console.error('[Auto Generate Content] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'operational',
    message: 'This endpoint redirects to autopilot-projects. Use POST to trigger.',
  });
}
