
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/autopilot/jobs
 * Get all active autopilot jobs for the current user
 * Used for persistent progress display after page refresh
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get projectId from query params (optional)
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    // Find active jobs (not completed/failed or completed/failed less than 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const jobs = await prisma.autopilotJob.findMany({
      where: {
        clientId: client.id,
        ...(projectId ? { projectId } : {}),
        OR: [
          {
            status: {
              in: ['pending', 'generating', 'publishing']
            }
          },
          {
            status: {
              in: ['completed', 'failed']
            },
            updatedAt: {
              gte: oneHourAgo
            }
          }
        ]
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 50, // Limit to 50 most recent jobs
    });

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        articleId: job.articleId,
        projectId: job.projectId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        contentId: job.contentId,
        publishedUrl: job.publishedUrl,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        updatedAt: job.updatedAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching autopilot jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
