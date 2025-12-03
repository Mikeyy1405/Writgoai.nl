
export const dynamic = "force-dynamic";

/**
 * Cleanup Stuck Autopilot Jobs
 * 
 * This endpoint checks for autopilot jobs that have been stuck
 * in generating/publishing state for more than 15 minutes
 * and automatically cancels them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const STUCK_JOB_THRESHOLD_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Calculate threshold time (15 minutes ago)
    const thresholdTime = new Date(Date.now() - STUCK_JOB_THRESHOLD_MINUTES * 60 * 1000);

    // Find stuck jobs - jobs that are in generating/publishing state
    // and haven't been updated in the last 15 minutes
    const stuckJobs = await prisma.autopilotJob.findMany({
      where: {
        clientId: client.id,
        status: {
          in: ['pending', 'generating', 'publishing']
        },
        updatedAt: {
          lt: thresholdTime
        }
      }
    });

    console.log(`🔍 Found ${stuckJobs.length} stuck jobs older than ${STUCK_JOB_THRESHOLD_MINUTES} minutes`);

    // Cancel stuck jobs
    const cancelledJobIds: string[] = [];
    for (const job of stuckJobs) {
      await prisma.autopilotJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: `Automatisch geannuleerd: Geen voortgang na ${STUCK_JOB_THRESHOLD_MINUTES} minuten`,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      cancelledJobIds.push(job.id);
      console.log(`❌ Auto-cancelled stuck job: ${job.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `${cancelledJobIds.length} stuck job(s) gecancelled`,
      cancelledJobs: cancelledJobIds.length,
      jobIds: cancelledJobIds,
    });
  } catch (error: any) {
    console.error('Error cleaning up stuck jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup stuck jobs' },
      { status: 500 }
    );
  }
}
