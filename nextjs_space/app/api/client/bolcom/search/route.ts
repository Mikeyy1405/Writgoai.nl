
/**
 * 🔍 Bol.com Product Search API
 * Zoekt producten op Bol.com voor gebruik in content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { quickProductSearch } from '@/lib/bolcom-product-finder';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, searchQuery, maxResults = 10 } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is vereist' },
        { status: 400 }
      );
    }

    if (!searchQuery || !searchQuery.trim()) {
      return NextResponse.json(
        { error: 'Zoekterm is vereist' },
        { status: 400 }
      );
    }

    // Get project with Bol.com credentials
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        clientId: session.user.id, // Ensure user owns this project
      },
      select: {
        bolcomClientId: true,
        bolcomClientSecret: true,
        bolcomAffiliateId: true,
        bolcomEnabled: true,
      },
    });

    if (!project || !project.bolcomEnabled) {
      return NextResponse.json(
        { error: 'Bol.com integratie niet actief voor dit project' },
        { status: 400 }
      );
    }

    if (!project.bolcomClientId || !project.bolcomClientSecret) {
      return NextResponse.json(
        { error: 'Bol.com credentials niet ingesteld. Configureer eerst je Bol.com API instellingen.' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching Bol.com:', searchQuery);

    // Search products using the Bol.com API
    const products = await quickProductSearch(
      searchQuery,
      {
        clientId: project.bolcomClientId,
        clientSecret: project.bolcomClientSecret,
        affiliateId: project.bolcomAffiliateId || undefined,
      },
      maxResults
    );

    console.log(`✅ Found ${products.length} products`);

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        ean: p.ean,
        bolProductId: p.bolProductId,
        title: p.title,
        url: p.affiliateUrl, // Already has affiliate ID if configured
        image: p.image.url ? {
          url: p.image.url,
          width: p.image.width || 200,
          height: p.image.height || 200,
        } : undefined,
        offer: {
          price: p.price,
          strikethroughPrice: p.strikethroughPrice,
        },
        rating: p.rating,
      })),
    });

  } catch (error: any) {
    console.error('Bol.com search error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij zoeken naar producten' },
      { status: 500 }
    );
  }
}
