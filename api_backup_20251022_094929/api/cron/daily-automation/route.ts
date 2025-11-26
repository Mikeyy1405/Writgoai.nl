
// CRON job die 1x per dag draait en content genereert voor alle actieve klanten

import { NextResponse } from 'next/server';
import { runDailyAutomationForAllClients } from '@/lib/daily-content-generator';

export const maxDuration = 300; // 5 minuten timeout
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Beveilig de CRON endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🤖 Daily automation CRON triggered');
    
    // Run automation voor alle actieve klanten
    await runDailyAutomationForAllClients();
    
    return NextResponse.json({ 
      success: true,
      message: 'Daily automation completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Daily automation failed:', error);
    return NextResponse.json({ 
      error: 'Failed to run daily automation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint voor manuele trigger (alleen voor admins)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId } = body;
    
    if (clientId) {
      const { generateDailyContent } = await import('@/lib/daily-content-generator');
      await generateDailyContent(clientId);
      return NextResponse.json({ 
        success: true,
        message: `Content generated for client ${clientId}`
      });
    } else {
      await runDailyAutomationForAllClients();
      return NextResponse.json({ 
        success: true,
        message: 'Daily automation completed for all clients'
      });
    }
  } catch (error) {
    console.error('❌ Manual automation trigger failed:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger automation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
