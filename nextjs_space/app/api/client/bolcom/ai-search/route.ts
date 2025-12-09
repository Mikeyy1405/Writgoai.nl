
/**
 * AI-Powered Bol.com Product Search
 * Gebruikt web research + AI om automatisch relevante producten te vinden
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { findBestProducts } from '@/lib/bolcom-product-finder';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [AI-Search] Starting AI product search...');
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ [AI-Search] Not authenticated');
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      projectId,
      query, // e.g., "beste wasmachines 2025"
      keywords = [], // optional keywords voor research
      maxProducts = 5,
    } = body;

    console.log('📝 [AI-Search] Request:', { projectId, query, keywords, maxProducts });

    // Validation
    if (!query || typeof query !== 'string') {
      console.log('❌ [AI-Search] No query provided');
      return NextResponse.json(
        { error: 'Query is verplicht' },
        { status: 400 }
      );
    }

    if (!projectId) {
      console.log('❌ [AI-Search] No project ID provided');
      return NextResponse.json(
        { error: 'Selecteer eerst een project met Bol.com instellingen' },
        { status: 400 }
      );
    }

    // Get client
    console.log('👤 [AI-Search] Finding client:', session.user.email);
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.log('❌ [AI-Search] Client not found');
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    console.log('✅ [AI-Search] Client found:', client.id);

    // Get project with Bol.com credentials
    console.log('📂 [AI-Search] Finding project:', projectId);
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      console.log('❌ [AI-Search] Project not found');
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    console.log('✅ [AI-Search] Project found:', project.name);

    // Get Bol.com credentials from secrets file
    console.log('🔑 [AI-Search] Loading Bol.com credentials...');
    let bolcomCredentials;
    try {
      const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config', 'abacusai_auth_secrets.json');
      
      if (!fs.existsSync(secretsPath)) {
        throw new Error('Bol.com credentials niet gevonden. Configureer eerst de Bol.com API in je project instellingen.');
      }

      const secretsData = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
      const bolcomData = secretsData['bol.com'];
      
      if (!bolcomData?.secrets) {
        throw new Error('Bol.com credentials niet gevonden in secrets file');
      }

      bolcomCredentials = {
        clientId: bolcomData.secrets.client_id?.value,
        clientSecret: bolcomData.secrets.client_secret?.value,
        // Affiliate ID ophalen uit project settings (als aanwezig)
        affiliateId: project.bolcomAffiliateId || undefined,
      };

      if (!bolcomCredentials.clientId || !bolcomCredentials.clientSecret) {
        throw new Error('Bol.com client ID of secret ontbreekt');
      }
      
      console.log('✅ [AI-Search] Credentials loaded successfully');
    } catch (error) {
      console.error('❌ [AI-Search] Error loading Bol.com credentials:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error 
            ? error.message 
            : 'Bol.com credentials niet gevonden. Configureer eerst de Bol.com API.' 
        },
        { status: 400 }
      );
    }

    console.log('🤖 [AI-Search] Starting AI-powered product search for:', query);
    console.log('📊 [AI-Search] Max products:', maxProducts);
    console.log('🔎 [AI-Search] Keywords:', keywords);

    // Use AI-powered product finder
    const result = await findBestProducts(
      {
        query,
        keywords: keywords.length > 0 ? keywords : [query],
        maxProducts: Math.min(maxProducts, 10), // Max 10 products
      },
      bolcomCredentials,
      (step) => {
        console.log('  📍 [AI-Search]', step);
      }
    );

    console.log('✅ [AI-Search] Found', result.products.length, 'products');

    // Transform to format expected by frontend (SelectedProduct)
    const products = result.products.map((p) => ({
      id: p.ean,
      title: p.title,
      url: p.url,
      affiliateUrl: p.affiliateUrl,
      price: p.price,
      image: p.image.url,
      rating: p.rating,
      notes: p.summary, // Summary als notities
      // Extra data voor eventuele toekomstige features
      pros: p.pros,
      cons: p.cons,
      overallScore: p.overallScore,
    }));

    console.log('🎉 [AI-Search] Returning', products.length, 'products to client');
    
    return NextResponse.json({
      success: true,
      products,
      summary: result.researchSummary,
      buyingGuide: result.buyingGuide,
      totalFound: products.length,
    });
  } catch (error) {
    console.error('❌ [AI-Search] Fatal error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Er ging iets mis bij het zoeken naar producten' 
      },
      { status: 500 }
    );
  }
}
