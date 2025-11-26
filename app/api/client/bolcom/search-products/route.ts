
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { findBestProducts, quickProductSearch, type ProductResearchRequest } from '@/lib/bolcom-product-finder';
import type { BolcomCredentials } from '@/lib/bolcom-api';

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/client/bolcom/search-products
 * Zoek en analyseer producten met AI
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, query, maxProducts, mode = 'full' } = body;

    if (!projectId || !query) {
      return NextResponse.json(
        { error: 'Project ID en zoekopdracht zijn verplicht' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get project with Bol.com credentials
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        bolcomClientId: true,
        bolcomClientSecret: true,
        bolcomAffiliateId: true,
        bolcomEnabled: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    if (!project.bolcomEnabled || !project.bolcomClientId || !project.bolcomClientSecret) {
      return NextResponse.json(
        { error: 'Bol.com integratie is niet ingeschakeld voor dit project. Configureer Bol.com in de project instellingen.' },
        { status: 400 }
      );
    }

    const credentials: BolcomCredentials = {
      clientId: project.bolcomClientId,
      clientSecret: project.bolcomClientSecret,
      affiliateId: project.bolcomAffiliateId || undefined,
    };

    // Choose search mode
    if (mode === 'quick') {
      // Quick search without deep research
      const products = await quickProductSearch(query, credentials, maxProducts || 5);
      return NextResponse.json({
        success: true,
        query,
        products,
        mode: 'quick',
      });
    } else {
      // Full AI-powered research
      const request: ProductResearchRequest = {
        query,
        maxProducts: maxProducts || 5,
      };

      const result = await findBestProducts(request, credentials, (step) => {
        console.log(`[Bol.com Search] ${step}`);
      });

      return NextResponse.json({
        success: true,
        ...result,
        mode: 'full',
      });
    }
  } catch (error: any) {
    console.error('Bol.com search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Fout bij zoeken producten',
      },
      { status: 500 }
    );
  }
}
