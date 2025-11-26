

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { parseProductFeed, generateAffiliateLinksFromFeed, FeedFormat } from '@/lib/product-feed-parser';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { feedContent, feedUrl, format, defaultCategory } = body;

    console.log('[Affiliate Feed] Import started:', { projectId, format, hasContent: !!feedContent, hasUrl: !!feedUrl });

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get feed content
    let content = feedContent;
    if (!content && feedUrl) {
      console.log('[Affiliate Feed] Fetching feed from URL:', feedUrl);
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.statusText}`);
      }
      content = await response.text();
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Feed content of URL is vereist' },
        { status: 400 }
      );
    }

    // Parse feed
    console.log('[Affiliate Feed] Parsing feed...');
    const products = await parseProductFeed(content, format as FeedFormat || 'auto');
    
    console.log('[Affiliate Feed] Parsed products:', products.length);

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Geen producten gevonden in feed' },
        { status: 400 }
      );
    }

    // Generate affiliate links
    console.log('[Affiliate Feed] Generating affiliate links...');
    const affiliateLinks = await generateAffiliateLinksFromFeed(products, defaultCategory);
    
    // Save to database
    console.log('[Affiliate Feed] Saving to database...');
    const created = await prisma.affiliateLink.createMany({
      data: affiliateLinks.map(link => ({
        projectId,
        url: link.url,
        anchorText: link.anchorText,
        category: link.category,
        keywords: link.keywords,
        description: link.description,
        isActive: true,
        usageCount: 0,
      })),
      skipDuplicates: true,
    });

    console.log('[Affiliate Feed] Created links:', created.count);

    return NextResponse.json({
      success: true,
      imported: created.count,
      total: products.length,
      message: `${created.count} producten succesvol geïmporteerd!`,
    });
  } catch (error: any) {
    console.error('[Affiliate Feed] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Feed import mislukt' },
      { status: 500 }
    );
  }
}

