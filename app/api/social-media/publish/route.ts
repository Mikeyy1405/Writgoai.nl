

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPost } from '@/lib/getlate';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = (session.user as any).id;
    const { itemId, publishNow } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Get calendar item
    const item = await prisma.contentCalendarItem.findFirst({
      where: { id: itemId, clientId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Prepare media items
    const mediaItems = item.mediaUrl
      ? [
          {
            url: item.mediaUrl,
            type: (item.mediaType || 'image') as 'image' | 'video',
          },
        ]
      : undefined;

    // Schedule post via GetLate.dev
    const postData = {
      content: item.content,
      platforms: item.platforms,
      scheduledAt: publishNow ? undefined : item.scheduledFor.toISOString(),
      mediaItems,
    };

    const result = await createPost(postData);

    // Update calendar item
    await prisma.contentCalendarItem.update({
      where: { id: itemId },
      data: {
        status: publishNow ? 'published' : 'scheduled',
        publishedAt: publishNow ? new Date() : undefined,
        lateDevPostId: result.id || result.postId,
        lateDevResponse: result,
      },
    });

    return NextResponse.json({
      success: true,
      result,
      status: publishNow ? 'published' : 'scheduled',
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    
    // Update item with error
    const { itemId } = await req.json();
    if (itemId) {
      await prisma.contentCalendarItem.update({
        where: { id: itemId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to publish post',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
