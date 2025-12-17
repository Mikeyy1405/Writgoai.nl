/**
 * PATCH /api/client/topical-authority/articles/[articleId]
 * 
 * Update article status and metadata
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateClient } from '@/lib/services/content-plan-service';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await validateClient(session);
    const { articleId } = params;
    const body = await request.json();

    // Get article with ownership check
    const article = await prisma.plannedArticle.findUnique({
      where: { id: articleId },
      include: {
        map: true,
      },
    });

    if (!article || !article.map) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (article.map.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update article
    const updatedArticle = await prisma.plannedArticle.update({
      where: { id: articleId },
      data: {
        status: body.status || article.status,
        contentId: body.contentId || article.contentId,
        publishedUrl: body.publishedUrl || article.publishedUrl,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : article.publishedAt,
      },
    });

    console.log('[Update Article] Article updated:', updatedArticle.id, 'status:', updatedArticle.status);

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle,
    });

  } catch (error: any) {
    console.error('[Update Article API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update article',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
