/**
 * Video Status API
 * Check the status of video generation jobs
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Klant niet gevonden' },
        { status: 404 }
      );
    }

    // Get jobId from query params
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is verplicht' },
        { status: 400 }
      );
    }

    // Find video by vid (job ID)
    const video = await prisma.video.findFirst({
      where: {
        vid: jobId,
        clientId: client.id, // Ensure client owns this video
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video niet gevonden' },
        { status: 404 }
      );
    }

    // Map status
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
    };

    const status = statusMap[video.status] || 'pending';

    // Calculate progress based on status
    let progress = 0;
    if (status === 'processing') {
      progress = 50; // Assume halfway through
    } else if (status === 'completed') {
      progress = 100;
    }

    return NextResponse.json({
      success: true,
      status,
      progress,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      topic: video.topic,
      script: video.script,
      duration: video.duration,
      language: video.language,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    });

  } catch (error: any) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { error: 'Status ophalen mislukt', message: error.message },
      { status: 500 }
    );
  }
}
