import { NextResponse } from 'next/server';
import { BolClient, generateBolAffiliateLink, generateProductCardHTML } from '@/lib/bol-client';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const ean = searchParams.get('ean');
    const includeMedia = searchParams.get('include_media') === 'true';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!ean) {
      return NextResponse.json({ error: 'EAN is required' }, { status: 400 });
    }

    // Check cache first
    const { data: cached } = await getSupabaseAdmin()
      .from('product_cache')
      .select('*')
      .eq('ean', ean)
      .single();

    // If cached and recent (less than 24 hours old), return cached data
    if (cached && new Date(cached.last_updated) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      // Get affiliate config for link generation
      const { data: affiliate } = await getSupabaseAdmin()
        .from('project_affiliates')
        .select('site_code')
        .eq('project_id', projectId)
        .eq('platform', 'bol.com')
        .single();

      return NextResponse.json({
        success: true,
        product: {
          ...cached,
          affiliateLink: affiliate?.site_code 
            ? generateBolAffiliateLink(cached.url, affiliate.site_code, cached.title)
            : cached.url,
        },
        fromCache: true,
      });
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
        error: 'Bol.com affiliate not configured for this project'
      }, { status: 400 });
    }

    if (!affiliate.client_id || !affiliate.client_secret) {
      return NextResponse.json({ 
        error: 'Bol.com API credentials missing'
      }, { status: 400 });
    }

    // Create Bol.com client
    const bolClient = new BolClient({
      clientId: affiliate.client_id,
      clientSecret: affiliate.client_secret,
    });

    // Get product details
    const product = await bolClient.getProduct(ean, {
      includeSpecifications: true,
      includeImage: true,
      includeOffer: true,
      includeRating: true,
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get media if requested
    let media = null;
    if (includeMedia) {
      media = await bolClient.getProductMedia(ean);
    }

    // Cache product
    await getSupabaseAdmin()
      .from('product_cache')
      .upsert({
        ean: product.ean,
        platform: 'bol.com',
        title: product.title,
        description: product.description,
        image_url: product.image?.url,
        images: media?.images || [],
        price: product.offer?.price,
        original_price: product.offer?.strikethroughPrice,
        rating: product.rating,
        url: product.url,
        specifications: product.specifications || {},
        delivery_info: product.offer?.deliveryDescription,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'ean',
      });

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        media,
        affiliateLink: generateBolAffiliateLink(
          product.url, 
          affiliate.site_code || '', 
          product.title
        ),
      },
      fromCache: false,
    });

  } catch (error: any) {
    console.error('Bol.com product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Generate product card HTML for embedding in articles
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      project_id, 
      ean, 
      pros = [], 
      cons = [], 
      verdict = '', 
      rank 
    } = body;

    if (!project_id || !ean) {
      return NextResponse.json({ 
        error: 'project_id and ean are required' 
      }, { status: 400 });
    }

    // Get product from cache or API
    const { data: cached } = await getSupabaseAdmin()
      .from('product_cache')
      .select('*')
      .eq('ean', ean)
      .single();

    if (!cached) {
      return NextResponse.json({ 
        error: 'Product not found. Please search for it first.' 
      }, { status: 404 });
    }

    // Get affiliate config
    const { data: affiliate } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('site_code')
      .eq('project_id', project_id)
      .eq('platform', 'bol.com')
      .single();

    const siteCode = affiliate?.site_code || '';

    // Generate HTML card
    const html = generateProductCardHTML(
      {
        ean: cached.ean,
        bolProductId: cached.ean,
        title: cached.title,
        description: cached.description,
        url: cached.url,
        image: cached.image_url ? {
          url: cached.image_url,
          width: 500,
          height: 500,
        } : undefined,
        rating: cached.rating,
        offer: cached.price ? {
          price: cached.price,
          strikethroughPrice: cached.original_price,
          deliveryDescription: cached.delivery_info,
        } : undefined,
      },
      siteCode,
      { pros, cons, verdict, rank }
    );

    return NextResponse.json({
      success: true,
      html,
      product: cached,
    });

  } catch (error: any) {
    console.error('Generate product card error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
