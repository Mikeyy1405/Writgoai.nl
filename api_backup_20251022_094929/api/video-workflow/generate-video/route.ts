
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/video-workflow/generate-video
 * Generate video using Vadoo (without voiceover)
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
    const { 
      ideaId,
      prompt,
      title,
      style = 'realistic',
      aspectRatio = '9:16',
      theme = 'Hormozi_1',
      duration = '30-60',
    } = data;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[Video] Generating video with Vadoo...');
    console.log('[Video] Prompt:', prompt);

    // Generate video using Vadoo WITHOUT voiceover
    const vadooResponse = await fetch('https://viralapi.vadoo.tv/api/generate_video', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.VADOO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style,
        aspect_ratio: aspectRatio,
        theme,
        duration,
        include_voiceover: '0', // IMPORTANT: No voiceover
        use_ai: '1',
      }),
    });

    if (!vadooResponse.ok) {
      const errorText = await vadooResponse.text();
      throw new Error(`Vadoo API error: ${vadooResponse.statusText} - ${errorText}`);
    }

    const vadooData = await vadooResponse.json();
    const vadooVideoId = vadooData.vid;

    console.log('[Video] Video generation started. Video ID:', vadooVideoId);

    // Update video idea if ideaId is provided
    if (ideaId) {
      await prisma.videoIdea.update({
        where: { id: ideaId },
        data: {
          vadooVideoId,
          videoGeneratedAt: new Date(),
          status: 'VIDEO_GENERATING',
        },
      });
    }

    return NextResponse.json({
      success: true,
      vadooVideoId,
      message: 'Video generatie gestart! De video is klaar in 2-3 minuten.',
    });

  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}
