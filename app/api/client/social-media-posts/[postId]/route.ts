
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;

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

    // Delete post
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen van post' },
      { status: 500 }
    );
  }
}
