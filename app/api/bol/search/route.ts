import { NextResponse } from 'next/server';
import { BolClient, generateBolAffiliateLink, generateProductCardHTML } from '@/lib/bol-client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '5');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Get Bol.com credentials from project affiliates
    const { data: affiliate, error: affiliateError } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('*')
      .eq('project_id', projectId)
      .eq('platform', 'bol.com')
      .eq('is_active', true)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ 
        error: 'Bol.com affiliate not configured for this project',
        details: 'Please configure Bol.com API credentials in project settings'
      }, { status: 400 });
    }

    if (!affiliate.client_id || !affiliate.client_secret) {
      return NextResponse.json({ 
        error: 'Bol.com API credentials missing',
        details: 'Please add client_id and client_secret in project settings'
      }, { status: 400 });
    }

    // Create Bol.com client
    const bolClient = new BolClient({
      clientId: affiliate.client_id,
      clientSecret: affiliate.client_secret,
    });

    // Search for products
    const searchResult = await bolClient.searchProducts(query, {
      page,
      pageSize,
      includeImage: true,
      includeOffer: true,
      includeRating: true,
    });

    // Cache products in database
    for (const product of searchResult.products) {
      await getSupabaseAdmin()
        .from('product_cache')
        .upsert({
          ean: product.ean,
          platform: 'bol.com',
          title: product.title,
          description: product.description,
          image_url: product.image?.url,
          price: product.offer?.price,
          original_price: product.offer?.strikethroughPrice,
          rating: product.rating,
          url: product.url,
          delivery_info: product.offer?.deliveryDescription,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'ean',
        });
    }

    // Add affiliate links to products
    const productsWithLinks = searchResult.products.map(product => ({
      ...product,
      affiliateLink: generateBolAffiliateLink(
        product.url, 
        affiliate.site_code || '', 
        product.title
      ),
    }));

    return NextResponse.json({
      success: true,
      totalResults: searchResult.totalResults,
      page: searchResult.page,
      pageSize: searchResult.pageSize,
      products: productsWithLinks,
    });

  } catch (error: any) {
    console.error('Bol.com search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
