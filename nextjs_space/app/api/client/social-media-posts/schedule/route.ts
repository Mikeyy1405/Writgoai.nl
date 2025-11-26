
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface ScheduleRequest {
  postId: string;
  scheduledFor: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ScheduleRequest = await req.json();
    const { postId, scheduledFor } = body;

    if (!postId || !scheduledFor) {
      return NextResponse.json({ error: 'Post ID en datum zijn vereist' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Find post and verify ownership
    const post = await prisma.socialMediaPost.findFirst({
      where: { id: postId },
      include: { project: true },
    });

    if (!post || post.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    // Update post with schedule
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        scheduledFor: new Date(scheduledFor),
        status: 'scheduled',
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error scheduling post:', error);
    return NextResponse.json(
      { error: 'Fout bij inplannen van post' },
      { status: 500 }
    );
  }
}
