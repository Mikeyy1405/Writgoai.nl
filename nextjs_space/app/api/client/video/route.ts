/**
 * Video List API
 * Get list of generated videos for a project or client
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

    // Get optional projectId from query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // Build where clause
    const where: any = {
      clientId: client.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Get videos
    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    return NextResponse.json({
      success: true,
      videos: videos.map(video => ({
        id: video.id,
        vid: video.vid,
        topic: video.topic,
        status: video.status,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        language: video.language,
        style: video.style,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      })),
      count: videos.length,
    });

  } catch (error: any) {
    console.error('Video list error:', error);
    return NextResponse.json(
      { error: 'Video lijst ophalen mislukt', message: error.message },
      { status: 500 }
    );
  }
}
