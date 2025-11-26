
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/video-automation/strategy
 * Get video automation strategy for current client
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
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const strategy = client.VideoSeries[0] || null;

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/video-automation/strategy
 * Create or update video automation strategy
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
      niche,
      targetAudience,
      videosPerWeek,
      preferredPostTime,
      language,
      voice,
      captionTheme,
      aspectRatio,
      autopilotEnabled,
      publishingDays
    } = data;

    // Check if strategy already exists
    const existingStrategy = await prisma.videoSeries.findFirst({
      where: {
        clientId: client.id,
        isActive: true
      }
    });

    let strategy;
    if (existingStrategy) {
      // Update existing strategy
      strategy = await prisma.videoSeries.update({
        where: { id: existingStrategy.id },
        data: {
          niche,
          description: targetAudience || existingStrategy.description,
          videosPerWeek: videosPerWeek || 3,
          publishingTime: preferredPostTime || '09:00',
          language: language || 'Dutch',
          voice: voice || 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Dutch voice
          captionTheme: captionTheme || 'Hormozi_1',
          aspectRatio: aspectRatio || '9:16',
          autopilotEnabled: autopilotEnabled || false,
          publishingDays: publishingDays || ['monday', 'wednesday', 'friday']
        }
      });
    } else {
      // Create new strategy
      strategy = await prisma.videoSeries.create({
        data: {
          clientId: client.id,
          name: `${niche} Video Series`,
          niche,
          description: targetAudience,
          videosPerWeek: videosPerWeek || 3,
          publishingTime: preferredPostTime || '09:00',
          language: language || 'Dutch',
          voice: voice || 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Dutch voice
          captionTheme: captionTheme || 'Hormozi_1',
          aspectRatio: aspectRatio || '9:16',
          autopilotEnabled: autopilotEnabled || false,
          publishingDays: publishingDays || ['monday', 'wednesday', 'friday']
        }
      });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('Error saving strategy:', error);
    return NextResponse.json(
      { error: 'Failed to save strategy' },
      { status: 500 }
    );
  }
}
