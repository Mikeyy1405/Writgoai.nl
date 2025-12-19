export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Start AutoPilot Job API
 * Starts autonomous content generation for an ArticleIdea
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { runAutoPilotJob } from '@/lib/autopilot/autopilot-orchestrator';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { articleIdeaId, frequency = 'once' } = body;

    if (!articleIdeaId) {
      return NextResponse.json({ error: 'articleIdeaId is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        isUnlimited: true,
        subscriptionCredits: true,
        topUpCredits: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get article idea and verify ownership
    const articleIdea = await prisma.articleIdea.findFirst({
      where: {
        id: articleIdeaId,
        clientId: client.id,
      },
    });

    if (!articleIdea) {
      return NextResponse.json({ error: 'ArticleIdea not found or access denied' }, { status: 404 });
    }

    // Update article idea with autopilot scheduling
    if (frequency !== 'once') {
      const nextRun = calculateNextRun(frequency);
      await prisma.articleIdea.update({
        where: { id: articleIdeaId },
        data: {
          isScheduledForAutopilot: true,
          autopilotFrequency: frequency,
          autopilotNextRun: nextRun,
        },
      });
    }

    // Start the autopilot job (async)
    const jobPromise = runAutoPilotJob(articleIdeaId, client.id);

    // Wait briefly to get the job ID
    const job = await jobPromise.catch((error) => {
      console.error('AutoPilot job error:', error);
      return null;
    });

    if (!job) {
      return NextResponse.json(
        {
          error: 'Failed to start autopilot job',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'AutoPilot job started successfully',
    });
  } catch (error: any) {
    console.error('Error starting autopilot:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to start autopilot',
      },
      { status: 500 }
    );
  }
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
