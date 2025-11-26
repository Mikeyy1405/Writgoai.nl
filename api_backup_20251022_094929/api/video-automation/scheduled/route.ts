
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/video-automation/scheduled
 * Get all scheduled videos for current client
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        VideoSeries: {
          where: { isActive: true },
          include: {
            GeneratedVideos: {
              orderBy: [
                { status: 'asc' },
                { createdAt: 'desc' }
              ]
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Flatten all videos from all series
    const videos = client.VideoSeries.flatMap(series => series.GeneratedVideos);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error fetching scheduled videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
