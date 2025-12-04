import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateTopicalMap } from '@/lib/topical-map-generator';

/**
 * POST /api/content-hub/generate-map
 * Generate topical authority map for a website
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { 
      siteId, 
      niche, 
      targetArticles = 500,
      language = 'nl',
      depth = 3 
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site
    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Determine niche
    const topicForMap = niche || site.niche || 'general content';

    console.log(`[Content Hub] Generating topical map for: ${topicForMap}`);

    // Generate topical map using existing generator
    const topicalMap = await generateTopicalMap({
      mainTopic: topicForMap,
      language,
      depth,
      targetArticles,
      includeCommercial: true,
      commercialRatio: 0.4,
      websiteUrl: site.wordpressUrl,
    });

    console.log(`[Content Hub] Generated ${topicalMap.totalArticles} article ideas`);

    // Convert to ContentHubArticle format
    const articles = [];
    for (const category of topicalMap.categories) {
      for (const subcategory of category.subcategories) {
        for (const topic of subcategory.topics) {
          articles.push({
            siteId: site.id,
            title: topic.title,
            cluster: category.name,
            keywords: topic.keywords,
            searchVolume: topic.searchVolume || null,
            difficulty: topic.difficulty || null,
            searchIntent: topic.type || 'informational',
            priority: topic.priority,
            status: 'pending',
          });
        }
      }
    }

    // Save articles to database
    await prisma.$transaction(async (tx) => {
      // Delete old articles for this site
      await tx.contentHubArticle.deleteMany({
        where: { siteId: site.id },
      });

      // Create new articles
      if (articles.length > 0) {
        await tx.contentHubArticle.createMany({
          data: articles,
        });
      }

      // Update site with topical map
      await tx.contentHubSite.update({
        where: { id: site.id },
        data: {
          topicalMap: topicalMap as any,
          totalArticles: topicalMap.totalArticles,
          niche: topicForMap,
          completedArticles: 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${topicalMap.totalArticles} article ideas`,
      map: {
        totalArticles: topicalMap.totalArticles,
        categories: topicalMap.categories.map(cat => ({
          name: cat.name,
          articleCount: cat.articleCount,
          priority: cat.priority,
        })),
        estimatedMonths: topicalMap.estimatedMonths,
        seoOpportunityScore: topicalMap.seoOpportunityScore,
      },
    });
  } catch (error: any) {
    console.error('[Content Hub] Map generation error:', error);
    
    // Provide better error messages in Dutch
    let errorMessage = 'Kon topical map niet genereren';
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Generatie duurde te lang. Probeer het opnieuw met een kleiner aantal artikelen.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API limiet bereikt. Probeer het over een paar minuten opnieuw.';
    } else if (error.message.includes('API key')) {
      errorMessage = 'API configuratie probleem. Neem contact op met support.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-hub/generate-map?siteId=xxx
 * Get existing topical map for a site
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const site = await prisma.contentHubSite.findUnique({
      where: { id: siteId },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
            cluster: true,
            keywords: true,
            status: true,
            priority: true,
            searchVolume: true,
            difficulty: true,
            searchIntent: true,
            wordpressUrl: true,
            publishedAt: true,
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Group articles by cluster
    const clusterMap = new Map<string, any[]>();
    site.articles.forEach(article => {
      if (!clusterMap.has(article.cluster)) {
        clusterMap.set(article.cluster, []);
      }
      clusterMap.get(article.cluster)!.push(article);
    });

    const clusters = Array.from(clusterMap.entries()).map(([name, articles]) => ({
      name,
      articleCount: articles.length,
      articles,
    }));

    return NextResponse.json({
      site: {
        id: site.id,
        wordpressUrl: site.wordpressUrl,
        niche: site.niche,
        totalArticles: site.totalArticles,
        completedArticles: site.completedArticles,
        authorityScore: site.authorityScore,
      },
      clusters,
      topicalMap: site.topicalMap,
    });
  } catch (error: any) {
    console.error('[Content Hub] Failed to get map:', error);
    return NextResponse.json(
      { error: error.message || 'Kon topical map niet ophalen' },
      { status: 500 }
    );
  }
}
