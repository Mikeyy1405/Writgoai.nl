import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/content-hub/articles/[id]
 * Update article title and keywords (only for pending articles)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json();
    const { title, keywords } = body;

    // Validate inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid title is required' },
        { status: 400 }
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    // Get article to verify ownership and status
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: params.id },
      include: {
        site: true,
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Only allow editing pending articles
    if (article.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending articles can be edited' },
        { status: 400 }
      );
    }

    // Update article
    const updatedArticle = await prisma.contentHubArticle.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        keywords: keywords.filter((k: string) => k && k.trim().length > 0),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        keywords: updatedArticle.keywords,
        status: updatedArticle.status,
      },
    });
  } catch (error: any) {
    console.error('[Update Article] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-hub/articles/[id]
 * Delete an article from the topical map
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get article to verify ownership
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: params.id },
      include: {
        site: true,
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Delete the article
    await prisma.contentHubArticle.delete({
      where: { id: params.id },
    });

    // Update the site's total articles count
    await prisma.contentHubSite.update({
      where: { id: article.siteId },
      data: {
        totalArticles: {
          decrement: 1,
        },
        // Also decrement completed articles if it was completed
        ...(article.status === 'published' && {
          completedArticles: {
            decrement: 1,
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error: any) {
    console.error('[Delete Article] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}
