
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/vadoo/webhook
 * Webhook endpoint for Vadoo video completion
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { vid, video_url, thumbnail_url, duration, status, error } = data;

    console.log('[Vadoo Webhook] Received:', data);

    if (!vid) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    // Update VideoIdea if it exists
    const videoIdea = await prisma.videoIdea.findFirst({
      where: { vadooVideoId: vid },
    });

    if (videoIdea) {
      await prisma.videoIdea.update({
        where: { id: videoIdea.id },
        data: {
          vadooVideoUrl: status === 'completed' ? video_url : null,
          status: status === 'completed' ? 'VIDEO_READY' : 'FAILED',
          errorMessage: error || null,
        },
      });

      console.log('[Vadoo Webhook] Updated VideoIdea:', videoIdea.id);

      // If both voiceover and video are ready, trigger merge
      if (status === 'completed' && videoIdea.voiceoverUrl && video_url) {
        console.log('[Vadoo Webhook] Triggering auto-merge...');
        
        // Trigger merge in the background
        fetch(`${process.env.NEXTAUTH_URL}/api/video-workflow/auto-merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaId: videoIdea.id }),
        }).catch(err => console.error('[Vadoo Webhook] Auto-merge error:', err));
      }
    }

    // Also update GeneratedVideo if it exists (for backward compatibility)
    const generatedVideo = await prisma.generatedVideo.findFirst({
      where: { vadooVideoId: vid },
    });

    if (generatedVideo) {
      await prisma.generatedVideo.update({
        where: { id: generatedVideo.id },
        data: {
          status: status === 'completed' ? 'COMPLETED' : 'FAILED',
          videoUrl: status === 'completed' ? video_url : null,
          thumbnailUrl: thumbnail_url || null,
          duration: duration || null,
          errorMessage: error || null,
          completedAt: status === 'completed' ? new Date() : null,
        },
      });

      console.log('[Vadoo Webhook] Updated GeneratedVideo:', generatedVideo.id);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Vadoo Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
