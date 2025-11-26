
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/video-series
 * Get all video series for the logged-in client
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const series = await prisma.videoSeries.findMany({
      where: { clientId: client.id },
      include: {
        GeneratedVideos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { GeneratedVideos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching video series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video series' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/video-series
 * Create a new video series
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();

    const series = await prisma.videoSeries.create({
      data: {
        clientId: client.id,
        name: data.name,
        description: data.description,
        niche: data.niche,
        voice: data.voice || 'Charlie',
        captionTheme: data.captionTheme || 'Hormozi_1',
        imageStyle: data.imageStyle,
        language: data.language || 'English',
        duration: data.duration || '30-60',
        aspectRatio: data.aspectRatio || '9:16',
        backgroundMusic: data.backgroundMusic,
        backgroundMusicVolume: data.backgroundMusicVolume || 50,
        includeVoiceover: data.includeVoiceover !== false,
        useAI: data.useAI !== false,
        customInstructions: data.customInstructions,
        autopilotEnabled: data.autopilotEnabled || false,
        publishingDays: data.publishingDays || [],
        publishingTime: data.publishingTime || '09:00',
        videosPerWeek: data.videosPerWeek || 3,
        postToYouTube: data.postToYouTube || false,
        postToInstagram: data.postToInstagram || false,
        postToTikTok: data.postToTikTok || false,
        postToFacebook: data.postToFacebook || false,
        postToLinkedIn: data.postToLinkedIn || false,
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('Error creating video series:', error);
    return NextResponse.json(
      { error: 'Failed to create video series' },
      { status: 500 }
    );
  }
}

