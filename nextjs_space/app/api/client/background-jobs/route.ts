

export const dynamic = "force-dynamic";
/**
 * Background Jobs API - Voor achtergrond verwerking bij netwerk errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

// GET - Check job status
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (jobId) {
      // Get specific job
      const job = await prisma.backgroundJob.findFirst({
        where: {
          id: jobId,
          clientId,
        },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ job });
    } else {
      // Get all pending/processing jobs for this client
      const jobs = await prisma.backgroundJob.findMany({
        where: {
          clientId,
          status: {
            in: ['pending', 'processing'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return NextResponse.json({ jobs });
    }
  } catch (error) {
    console.error('❌ Background jobs GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get jobs' },
      { status: 500 }
    );
  }
}

// POST - Create a new background job
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const body = await req.json();
    const { type, input, conversationId } = body;

    if (!type || !input) {
      return NextResponse.json(
        { error: 'Type and input are required' },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.backgroundJob.create({
      data: {
        clientId,
        conversationId,
        type,
        input,
      },
    });

    // Start processing the job immediately (fire and forget)
    processJob(job.id).catch((error) => {
      console.error('❌ Background job processing error:', error);
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('❌ Background jobs POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

/**
 * Process a background job
 */
async function processJob(jobId: string) {
  try {
    // Update job status to processing
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    // Get the job
    const job = await prisma.backgroundJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Process based on type
    let output: any = {};

    switch (job.type) {
      case 'blog_generation':
        output = await processBlogGeneration(job);
        break;
      case 'video_generation':
        output = await processVideoGeneration(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Update job as completed
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        output,
        progress: 100,
        completedAt: new Date(),
      },
    });

    console.log('✅ Background job completed:', jobId);
  } catch (error: any) {
    console.error('❌ Background job failed:', jobId, error);

    // Update job as failed
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: error.message || 'Unknown error',
      },
    });
  }
}

/**
 * Process blog generation job
 */
async function processBlogGeneration(job: any) {
  const input = job.input;
  const message = input.message;
  const history = input.history || [];

  // Call the chat API internally (non-streaming mode)
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ai-agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        clientId: job.clientId,
        conversationHistory: history,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat API call failed');
    }

    const result = await response.json();

    return {
      content: result.message || result.content,
      toolsUsed: result.toolsUsed || [],
      model: result.model,
    };
  } catch (error: any) {
    throw new Error(`Blog generation failed: ${error.message}`);
  }
}

/**
 * Process video generation job
 */
async function processVideoGeneration(job: any) {
  // Similar to blog generation
  return await processBlogGeneration(job);
}
