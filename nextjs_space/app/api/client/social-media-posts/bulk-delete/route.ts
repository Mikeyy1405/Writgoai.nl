

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { postIds } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'Post IDs zijn vereist' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Verify all posts belong to client's projects
    const posts = await prisma.socialMediaPost.findMany({
      where: {
        id: { in: postIds },
        project: { clientId: client.id },
      },
      include: { project: true },
    });

    if (posts.length !== postIds.length) {
      return NextResponse.json(
        { error: 'Sommige posts zijn niet gevonden of behoren niet tot jouw projecten' },
        { status: 403 }
      );
    }

    // Delete all posts
    const result = await prisma.socialMediaPost.deleteMany({
      where: {
        id: { in: postIds },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error bulk deleting posts:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen van posts' },
      { status: 500 }
    );
  }
}
