import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * POST /api/content-hub/rewrite-article
 * Rewrite an existing article with fresh content
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { articleId, maintainUrl = true } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Artikel ID is verplicht' },
        { status: 400 }
      );
    }

    // Get article with site info
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: articleId },
      include: {
        site: {
          select: {
            id: true,
            clientId: true,
            wordpressUrl: true,
          },
        },
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    // Store the old WordPress URL if we need to maintain it
    const oldWordpressUrl = article.wordpressUrl;

    // Reset article to be regenerated, but keep the WordPress URL if maintainUrl is true
    // The article will need to be regenerated using the article generator component
    await prisma.contentHubArticle.update({
      where: { id: articleId },
      data: {
        status: 'pending',
        content: null,
        metaTitle: null,
        metaDescription: null,
        researchData: null,
        featuredImage: null,
        images: [],
        internalLinks: null,
        faqSection: null,
        schemaMarkup: null,
        // Maintain WordPress URL if requested so it can be updated in place
        wordpressUrl: maintainUrl ? oldWordpressUrl : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Artikel klaar voor herschrijven',
      article: {
        id: article.id,
        title: article.title,
        status: 'pending',
        maintainedUrl: maintainUrl ? oldWordpressUrl : null,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Rewrite article error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon artikel niet herschrijven' },
      { status: 500 }
    );
  }
}
