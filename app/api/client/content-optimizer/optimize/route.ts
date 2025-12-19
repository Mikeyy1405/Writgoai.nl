export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Optimize WordPress Post API
 * Optimizes a WordPress post with AI improvements
 * Streams progress updates using Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { optimizeWordPressPost, ContentOptimizationJob } from '@/lib/autopilot/content-optimizer';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, postId, improvements, includeFAQ = true } = body;

    if (!projectId || !postId) {
      return NextResponse.json(
        { error: 'projectId and postId are required' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get the WordPress post content
    // This is a simplified version - in reality, you'd fetch from WordPress
    const originalContent = '<p>Original content here</p>'; // TODO: Fetch from WordPress
    const seoScore = 50; // TODO: Calculate actual SEO score
    const issues = ['Content too short', 'Missing headings', 'No images'];

    const job: ContentOptimizationJob = {
      wordpressPostId: postId,
      projectId,
      originalContent,
      seoScore,
      issues,
      improvements,
    };

    // Run optimization
    const result = await optimizeWordPressPost(job);

    return NextResponse.json({
      success: true,
      result: {
        newContent: result.newContent,
        newTitle: result.newTitle,
        newMetaDescription: result.newMetaDescription,
        improvements: result.improvements,
        seoScoreIncrease: result.seoScoreIncrease,
        wordpressUpdated: result.wordpressUpdated,
      },
    });
  } catch (error: any) {
    console.error('Error optimizing post:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to optimize post',
      },
      { status: 500 }
    );
  }
}

/**
 * Stream optimization progress using Server-Sent Events
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Poll for job status and stream updates
        const interval = setInterval(async () => {
          try {
            const job = await prisma.autoPilotJob.findUnique({
              where: { id: jobId },
            });

            if (job) {
              const data = {
                progress: job.progress,
                currentStep: job.currentStep,
                status: job.status,
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
              );

              if (job.status === 'completed' || job.status === 'failed') {
                clearInterval(interval);
                controller.close();
              }
            }
          } catch (error) {
            console.error('Error in SSE stream:', error);
            clearInterval(interval);
            controller.close();
          }
        }, 1000); // Poll every second

        // Cleanup on client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      } catch (error) {
        console.error('Error starting SSE stream:', error);
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
