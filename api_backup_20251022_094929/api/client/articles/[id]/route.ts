
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/articles/[id]
 * Get a specific published article
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

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get the article and verify it belongs to this client
    const article = await prisma.publishedArticle.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        MasterArticle: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/articles/[id]
 * Update a published article
 */
export async function PATCH(
  request: Request,
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

    // Verify article belongs to this client
    const existingArticle = await prisma.publishedArticle.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found or unauthorized' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update the article
    const updatedArticle = await prisma.publishedArticle.update({
      where: { id: params.id },
      data: {
        title: data.title,
        seoTitle: data.seoTitle,
        metaDescription: data.metaDescription,
        excerpt: data.excerpt,
        content: data.content,
        keywords: data.keywords,
      },
    });

    return NextResponse.json({
      success: true,
      article: updatedArticle,
      message: 'Artikel succesvol bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/articles/[id]
 * Delete a published article
 */
export async function DELETE(
  request: Request,
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

    // Verify article belongs to this client
    const existingArticle = await prisma.publishedArticle.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the article
    await prisma.publishedArticle.delete({
      where: { id: params.id },
    });

    // Update the master article status back to AVAILABLE
    if (existingArticle.masterArticleId) {
      await prisma.masterArticle.update({
        where: { id: existingArticle.masterArticleId },
        data: { status: 'AVAILABLE' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Artikel succesvol verwijderd',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
