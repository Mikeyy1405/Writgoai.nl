
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          include: {
            socialMediaPosts: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Collect all posts from all projects
    const allPosts = client.projects.flatMap((project) =>
      project.socialMediaPosts.map((post) => ({
        ...post,
        project: {
          id: project.id,
          name: project.name,
          websiteUrl: project.websiteUrl,
        },
      }))
    );

    return NextResponse.json({
      success: true,
      posts: allPosts,
    });
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media posts' },
      { status: 500 }
    );
  }
}
