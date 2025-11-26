
/**
 * API: START COMPLETE AUTOMATION
 * Voor klanten om met 1 klik volledige automation te activeren
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startCompleteAutomation } from '@/lib/master-automation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal klant op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        AIProfile: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.AIProfile) {
      return NextResponse.json(
        { error: 'AI Profile not configured. Please complete setup first.' },
        { status: 400 }
      );
    }

    // Parse request body voor custom settings
    const body = await request.json().catch(() => ({}));

    // Start automation
    const result = await startCompleteAutomation({
      client,
      profile: client.AIProfile,
      articlesPerWeek: body.articlesPerWeek || 2,
      socialsPerWeek: body.socialsPerWeek || 3,
      tiktoksPerWeek: body.tiktoksPerWeek || 3,
      youtubeShortsPerWeek: body.youtubeShortsPerWeek || 3,
    });

    if (!result.completed) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      automation: {
        enabled: true,
        stage: result.stage,
        progress: result.progress,
      },
    });

  } catch (error) {
    console.error('[API] Error starting automation:', error);
    return NextResponse.json(
      { error: 'Failed to start automation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET automation status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        AIProfile: true,
        MasterContentPlan: true,
        AutoContentStrategy: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const hasWebsiteUrl = !!client.AIProfile?.websiteUrl;
    const hasCompletedScan = !!client.AIProfile?.aiScanCompleted;
    const hasMasterPlan = !!client.MasterContentPlan;
    const autopilotEnabled = !!client.AIProfile?.autopilotEnabled;
    const strategyEnabled = !!client.AutoContentStrategy?.isEnabled;

    const status = {
      configured: hasWebsiteUrl && hasCompletedScan && hasMasterPlan,
      active: autopilotEnabled && strategyEnabled,
      websiteUrl: client.AIProfile?.websiteUrl,
      websiteScanned: hasCompletedScan,
      masterPlanGenerated: hasMasterPlan,
      autopilotEnabled,
      articlesScheduled: client.MasterContentPlan ? 
        JSON.parse(client.MasterContentPlan.seoStrategy || '{}').articles?.length || 0 : 0,
      reelsScheduled: client.MasterContentPlan ? (
        (JSON.parse(client.MasterContentPlan.seoStrategy || '{}').instagramReels?.length || 0) +
        (JSON.parse(client.MasterContentPlan.seoStrategy || '{}').tiktokReels?.length || 0)
      ) : 0,
      youtubeShortsScheduled: client.MasterContentPlan ?
        JSON.parse(client.MasterContentPlan.seoStrategy || '{}').youtubeShorts?.length || 0 : 0,
    };

    return NextResponse.json(status);

  } catch (error) {
    console.error('[API] Error getting automation status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
