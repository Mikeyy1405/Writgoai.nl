import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, postIds } = body;

    if (!action || !postIds || !Array.isArray(postIds)) {
      return NextResponse.json(
        { error: 'Action and postIds array are required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'publish':
        result = await prisma.blogPost.updateMany({
          where: { id: { in: postIds } },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
        break;

      case 'draft':
        result = await prisma.blogPost.updateMany({
          where: { id: { in: postIds } },
          data: { status: 'draft' },
        });
        break;

      case 'delete':
        result = await prisma.blogPost.deleteMany({
          where: { id: { in: postIds } },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} posts ${action}ed successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
