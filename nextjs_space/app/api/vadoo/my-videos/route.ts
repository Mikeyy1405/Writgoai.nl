

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


/**
 * Get My Videos
 * GET /api/vadoo/my-videos
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all videos for this client
    const videos = await prisma.video.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 videos
    });

    return NextResponse.json({
      videos: videos.map(v => ({
        id: v.id,
        vid: v.vid,
        topic: v.topic,
        script: v.script,
        status: v.status,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        language: v.language,
        createdAt: v.createdAt,
      })),
    });

  } catch (error: any) {
    console.error('❌ Error fetching videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
