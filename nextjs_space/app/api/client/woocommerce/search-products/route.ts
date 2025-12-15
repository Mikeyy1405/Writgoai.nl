
/**
 * API endpoint voor het zoeken van Bol.com producten
 * voor WooCommerce import met AI beschrijvingen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 

  searchBolcomProducts, 
  getBolcomProductDetails,
  filterHighResolutionImages,
  type BolcomProduct 
} from '@/lib/bolcom-api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.log('❌ Client not found for email:', session.user.email);
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    console.log('🔍 Search request body:', body);
    
    const { projectId, searchTerm, page = 1, resultsPerPage = 50 } = body;

    if (!projectId || !searchTerm) {
      console.error('❌ Missing required fields:', { projectId, searchTerm });
      return NextResponse.json(
        { error: 'Project ID en zoekterm zijn verplicht' },
        { status: 400 }
      );
    }

    // Get project with Bol.com credentials
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    console.log('📋 Project found:', {
      name: project.name,
      bolcomEnabled: project.bolcomEnabled,
      hasClientId: !!project.bolcomClientId,
      hasClientSecret: !!project.bolcomClientSecret,
    });

    // Check if Bol.com credentials are configured (enabled status is not required)
    if (!project.bolcomClientId || !project.bolcomClientSecret) {
      console.error('❌ Bol.com not configured:', {
        enabled: project.bolcomEnabled,
        hasClientId: !!project.bolcomClientId,
        hasClientSecret: !!project.bolcomClientSecret,
      });
      return NextResponse.json(
        { error: 'Bol.com is niet geconfigureerd voor dit project. Ga naar Project Instellingen om Bol.com te configureren.' },
        { status: 400 }
      );
    }

    // Search Bol.com products
    const credentials = {
      clientId: project.bolcomClientId,
      clientSecret: project.bolcomClientSecret,
      affiliateId: project.bolcomAffiliateId || undefined,
    };

    const searchOptions: any = {
      page,
      resultsPerPage,
      countryCode: 'NL',
      sortBy: 'relevance' as const,
    };

    console.log('🔍 Calling Bol.com API with:', { searchTerm, searchOptions });
    
    let searchResults;
    try {
      searchResults = await searchBolcomProducts(searchTerm, credentials, searchOptions);
      console.log('✅ Bol.com API response:', {
        totalResults: searchResults.totalResults,
        resultsCount: searchResults.results?.length || 0,
        firstResult: searchResults.results?.[0]?.title || 'Geen resultaten',
      });
    } catch (apiError: any) {
      console.error('❌ Bol.com API error:', apiError);
      return NextResponse.json(
        { 
          error: `Bol.com API fout: ${apiError.message || 'Onbekende fout'}`,
          details: apiError.toString(),
        },
        { status: 500 }
      );
    }

    // Transform results with full product details (NO FILTERING)
    const productsWithDetails = await Promise.all(
      searchResults.results.map(async (product: BolcomProduct) => {
        // Validate EAN format (must be exactly 13 digits)
        const eanStr = product.ean.toString();
        if (eanStr.length !== 13 || !/^\d{13}$/.test(eanStr)) {
          console.warn(`⚠️ Ongeldige EAN format voor "${product.title}": ${eanStr}`);
          
          // Return basic product info without full details
          return {
            ean: product.ean,
            bolProductId: product.bolProductId,
            title: product.title,
            description: product.description || '',
            url: product.url,
            price: product.offer?.price,
            regularPrice: product.offer?.strikethroughPrice,
            rating: product.rating,
            image: product.image?.url || null,
            images: product.image ? [product.image] : [],
            categories: [],
            affiliateLink: product.url,
            specifications: [],
          };
        }
        
        try {
          // Fetch complete product details (price, categories, high-res images, specs)
          const details = await getBolcomProductDetails(eanStr, credentials, 'NL');
          
          console.log(`📦 Product ${details.title}:`, {
            hasOffer: !!details.offer,
            hasBestOffer: !!details.bestOffer,
            offerPrice: details.offer?.price,
            bestOfferPrice: details.bestOffer?.price,
            hasImages: details.images?.length || 0,
            hasProductImage: !!details.image,
          });
          
          // Voorraad bepalen: Als er een prijs is (via offer of bestOffer), is het product op voorraad
          const isInStock = !!(details.offer?.price || details.bestOffer?.price);
          
          // Afbeeldingen: gebruik de images array die uit getBolcomProductDetails komt
          const productImages = details.images || [];
          const primaryImage = productImages[0]?.url || details.image?.url || null;
          
          if (!primaryImage) {
            console.warn(`⚠️ Geen afbeelding beschikbaar voor product: ${details.title} (EAN: ${eanStr})`);
          }
          
          return {
            ean: details.ean,
            bolProductId: details.bolProductId,
            title: details.title,
            description: details.description || '',
            url: details.url,
            price: details.bestOffer?.price || details.offer?.price,
            regularPrice: details.bestOffer?.strikethroughPrice || details.offer?.strikethroughPrice,
            rating: details.rating,
            image: primaryImage,
            images: productImages,
            categories: details.categories || [],
            affiliateLink: details.affiliateLink || details.url,
            specifications: details.specificationGroups || [],
            deliveryDescription: details.bestOffer?.deliveryDescription || details.offer?.deliveryDescription,
            inStock: isInStock,
          };
        } catch (error: any) {
          console.error(`❌ Fout bij ophalen details voor EAN ${eanStr}:`, error.message);
          
          // Fallback to basic product info
          return {
            ean: product.ean,
            bolProductId: product.bolProductId,
            title: product.title,
            description: product.description || '',
            url: product.url,
            price: product.offer?.price,
            regularPrice: product.offer?.strikethroughPrice,
            rating: product.rating,
            image: product.image?.url || null,
            images: product.image ? [product.image] : [],
            categories: [],
            affiliateLink: product.url,
            specifications: [],
            inStock: product.offer ? true : false,
          };
        }
      })
    );

    console.log(`✅ ${productsWithDetails.length} producten gevonden`);

    return NextResponse.json({
      products: productsWithDetails,
      totalResults: productsWithDetails.length,
      totalPages: Math.ceil(productsWithDetails.length / resultsPerPage),
      currentPage: page,
    });
  } catch (error: any) {
    console.error('Fout bij zoeken Bol.com producten:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
