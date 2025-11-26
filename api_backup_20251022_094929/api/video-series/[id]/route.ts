
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/video-series/[id]
 * Get a specific video series
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const series = await prisma.videoSeries.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        GeneratedVideos: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { GeneratedVideos: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }

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
 * DELETE /api/video-series/[id]
 * Delete a specific video series and all its videos
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if the series belongs to this client
    const series = await prisma.videoSeries.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete all videos in this series first
    await prisma.generatedVideo.deleteMany({
      where: { seriesId: params.id },
    });

    // Delete the series
    await prisma.videoSeries.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Series and all its videos deleted successfully' });
  } catch (error) {
    console.error('Error deleting video series:', error);
    return NextResponse.json(
      { error: 'Failed to delete video series' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/video-series/[id]
 * Update a specific video series
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if the series belongs to this client
    const series = await prisma.videoSeries.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found or unauthorized' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update the series
    const updatedSeries = await prisma.videoSeries.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        niche: data.niche,
        voice: data.voice,
        captionTheme: data.captionTheme,
        imageStyle: data.imageStyle,
        language: data.language,
        duration: data.duration,
        aspectRatio: data.aspectRatio,
        backgroundMusic: data.backgroundMusic,
        backgroundMusicVolume: data.backgroundMusicVolume,
        includeVoiceover: data.includeVoiceover,
        useAI: data.useAI,
        customInstructions: data.customInstructions,
        autopilotEnabled: data.autopilotEnabled,
        publishingDays: data.publishingDays,
        publishingTime: data.publishingTime,
        videosPerWeek: data.videosPerWeek,
        postToYouTube: data.postToYouTube,
        postToInstagram: data.postToInstagram,
        postToTikTok: data.postToTikTok,
        postToFacebook: data.postToFacebook,
        postToLinkedIn: data.postToLinkedIn,
      },
    });

    return NextResponse.json(updatedSeries);
  } catch (error) {
    console.error('Error updating video series:', error);
    return NextResponse.json(
      { error: 'Failed to update video series' },
      { status: 500 }
    );
  }
}
