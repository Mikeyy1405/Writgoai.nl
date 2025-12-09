

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getVideoUrl } from '@/lib/vadoo';


/**
 * Get Video Status
 * GET /api/vadoo/video-status?videoId=123
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if video belongs to this client
    if (video.clientId !== client.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If video is already completed or failed, return current status
    if (video.status === 'completed' || video.status === 'failed') {
      return NextResponse.json({
        video: {
          id: video.id,
          vid: video.vid,
          topic: video.topic,
          status: video.status,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
        },
      });
    }

    // If still processing, check with Vadoo API
    try {
      const vadooStatus = await getVideoUrl(video.vid);
      
      if (vadooStatus.status === 'complete' && vadooStatus.url) {
        // Update database with completed video
        await prisma.video.update({
          where: { id: video.id },
          data: {
            status: 'completed',
            videoUrl: vadooStatus.url,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          video: {
            id: video.id,
            vid: video.vid,
            topic: video.topic,
            status: 'completed',
            videoUrl: vadooStatus.url,
            thumbnailUrl: video.thumbnailUrl,
          },
        });
      }
    } catch (error) {
      console.error('Error checking Vadoo status:', error);
      // Don't fail, just return current status
    }

    // Still processing
    return NextResponse.json({
      video: {
        id: video.id,
        vid: video.vid,
        topic: video.topic,
        status: 'processing',
        videoUrl: null,
        thumbnailUrl: null,
      },
    });

  } catch (error: any) {
    console.error('❌ Error checking video status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check video status' },
      { status: 500 }
    );
  }
}
