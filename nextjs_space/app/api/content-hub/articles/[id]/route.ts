import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getValidKeywords, validateArticleTitle, validateKeywords, COMPLETED_STATUSES } from '@/lib/content-hub/article-utils';

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
    const titleError = validateArticleTitle(title);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const keywordsError = validateKeywords(keywords);
    if (keywordsError) {
      return NextResponse.json({ error: keywordsError }, { status: 400 });
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
        keywords: getValidKeywords(keywords),
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

    // Delete the article and update site counts in a transaction to ensure atomicity
    const isCompleted = COMPLETED_STATUSES.includes(article.status as any);
    
    await prisma.$transaction([
      prisma.contentHubArticle.delete({
        where: { id: params.id },
      }),
      prisma.contentHubSite.update({
        where: { id: article.siteId },
        data: {
          totalArticles: {
            decrement: 1,
          },
          // Also decrement completed articles if it was completed
          ...(isCompleted && {
            completedArticles: {
              decrement: 1,
            },
          }),
        },
      }),
    ]);

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
