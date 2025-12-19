export const dynamic = 'force-dynamic';

/**
 * Get AutoPilot Job Status API
 * Returns the current status and progress of an autopilot job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAutoPilotJobStatus } from '@/lib/autopilot/autopilot-orchestrator';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get job status
    const job = await getAutoPilotJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify job belongs to client
    if (job.clientId !== client.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate ETA based on progress
    let eta: number | undefined;
    if (job.status !== 'completed' && job.status !== 'failed') {
      const elapsed = Date.now() - new Date(job.startedAt).getTime();
      const progressRate = job.progress / (elapsed / 1000); // Progress per second
      if (progressRate > 0) {
        const remainingProgress = 100 - job.progress;
        eta = Math.ceil(remainingProgress / progressRate); // Seconds
      }
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        error: job.error,
        result: job.result,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
      progress: job.progress,
      currentStep: job.currentStep || 'Processing...',
      eta,
    });
  } catch (error: any) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to get job status',
      },
      { status: 500 }
    );
  }
}
