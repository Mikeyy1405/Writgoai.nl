
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createAIVideo } from '@/lib/vadoo';

/**
 * POST /api/videos/generate
 * Generate a new video using Vadoo API
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
    const { seriesId, videoTopic } = data;

    if (!seriesId || !videoTopic) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the series settings
    const series = await prisma.videoSeries.findUnique({
      where: { id: seriesId, clientId: client.id },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Create video record in database first
    const video = await prisma.generatedVideo.create({
      data: {
        seriesId: series.id,
        videoTopic,
        voice: series.voice,
        captionTheme: series.captionTheme,
        imageStyle: series.imageStyle,
        language: series.language,
        aspectRatio: series.aspectRatio,
        status: 'GENERATING',
      },
    });

    // Call Vadoo API to generate the video
    try {
      const vadooResponse = await createAIVideo({
        topic: series.niche === 'Custom' ? undefined : series.niche,
        prompt: videoTopic,
        voice: series.voice,
        theme: series.captionTheme,
        style: series.imageStyle || undefined,
        language: series.language,
        duration: series.duration,
        aspect_ratio: series.aspectRatio,
        bg_music: series.backgroundMusic || undefined,
        bg_music_volume: series.backgroundMusicVolume?.toString(),
        include_voiceover: series.includeVoiceover ? '1' : '0',
        use_ai: series.useAI ? '1' : '0',
        custom_instruction: series.customInstructions || undefined,
      });

      // Update video with Vadoo video ID
      await prisma.generatedVideo.update({
        where: { id: video.id },
        data: {
          vadooVideoId: vadooResponse.vid,
        },
      });

      return NextResponse.json({
        success: true,
        video: {
          ...video,
          vadooVideoId: vadooResponse.vid,
        },
      });
    } catch (vadooError) {
      // Update video status to failed
      await prisma.generatedVideo.update({
        where: { id: video.id },
        data: {
          status: 'FAILED',
          errorMessage:
            vadooError instanceof Error
              ? vadooError.message
              : 'Failed to generate video',
        },
      });

      throw vadooError;
    }
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate video',
      },
      { status: 500 }
    );
  }
}

