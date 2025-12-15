import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simplified/social-media/history
 * Haal post history op voor ingelogde gebruiker
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      // We moeten via een join met project de clientId checken
    };

    // Als projectId is opgegeven, filter daarop
    if (projectId) {
      where.projectId = projectId;
    }

    if (platform) {
      where.platform = platform;
    }

    if (status) {
      where.status = status;
    }

    // Haal posts op
    // Workaround: we kunnen niet direct filteren op project.clientId in prisma-shim
    // Dus haal eerst alle projecten van de client op
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    // Nu haal posts op voor deze projecten
    if (projectId) {
      // Check of het opgegeven projectId bij de client hoort
      if (!projectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Geen toegang tot dit project' }, { status: 403 });
      }
    } else {
      // Filter op alle projecten van de client
      where.projectId = { in: projectIds };
    }

    const posts = await prisma.socialMediaPost.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    // Haal project info op voor elk post
    const postsWithProject = await Promise.all(
      posts.map(async (post: any) => {
        const project = await prisma.project.findUnique({
          where: { id: post.projectId || '' },
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        });

        return {
          id: post.id,
          projectId: post.projectId,
          projectName: project?.name || 'Onbekend',
          platform: post.platform,
          title: post.title,
          content: post.content,
          hashtags: post.hashtags || [],
          mediaUrls: post.mediaUrls || [],
          status: post.status,
          scheduledDate: post.scheduledDate,
          publishedAt: post.publishedAt,
          getlatePostId: post.getlatePostId,
          errorMessage: post.errorMessage,
          createdAt: post.createdAt,
        };
      })
    );

    return NextResponse.json({
      posts: postsWithProject,
      total: postsWithProject.length,
    });
  } catch (error) {
    console.error('Error fetching social media history:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen van post history' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simplified/social-media/history
 * Verwijder een post uit de geschiedenis
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is verplicht' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal post op
    const post = await prisma.socialMediaPost.findFirst({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
    }

    // Check eigenaar via project
    const project = await prisma.project.findFirst({
      where: {
        id: post.projectId || '',
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Geen toegang tot deze post' }, { status: 403 });
    }

    // Verwijder post
    await prisma.socialMediaPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: 'Post verwijderd',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen van post' },
      { status: 500 }
    );
  }
}
