import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/projects/[id]/posts/count
 * Get the count of posts for a project
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count blog posts for this project
    const count = await prisma.blogPost.count({
      where: { 
        projectId: params.id,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting posts:', error);
    return NextResponse.json({ count: 0 });
  }
}
