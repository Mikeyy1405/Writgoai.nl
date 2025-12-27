import { NextResponse } from 'next/server';
import { generateBolProductArticle } from '@/lib/bol-content-generator';
import { BolClient } from '@/lib/bol-client';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for comprehensive article generation

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
  return supabaseAdmin as any;
}

/**
 * POST - Generate a comprehensive Bol.com product article
 *
 * Body:
 * - project_id: string (required)
 * - search_query: string (required) - e.g., "Kérastase shampoo"
 * - product_category: string (required) - e.g., "Kérastase shampoos"
 * - product_count: number (optional, default: 5) - Number of products to review
 *
 * Example request:
 * {
 *   "project_id": "123",
 *   "search_query": "Kérastase shampoo",
 *   "product_category": "Kérastase shampoos",
 *   "product_count": 5
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      project_id,
      search_query,
      product_category,
      product_count = 5,
    } = body;

    // Validate required fields
    if (!project_id || !search_query || !product_category) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'project_id, search_query, and product_category are required',
      }, { status: 400 });
    }

    // Validate product count
    if (product_count < 3 || product_count > 10) {
      return NextResponse.json({
        error: 'Invalid product_count',
        details: 'product_count must be between 3 and 10',
      }, { status: 400 });
    }

    // Get Bol.com affiliate config from database
    const { data: affiliate, error: affiliateError } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('*')
      .eq('project_id', project_id)
      .eq('platform', 'bol.com')
      .eq('is_active', true)
      .single();

    if (affiliateError || !affiliate?.client_id || !affiliate?.client_secret) {
      return NextResponse.json({
        error: 'Bol.com affiliate not configured',
        details: 'Please configure Bol.com API credentials in project settings. Go to Project Settings > Affiliates > Add Bol.com credentials.',
      }, { status: 400 });
    }

    if (!affiliate?.site_code) {
      return NextResponse.json({
        error: 'Bol.com site code missing',
        details: 'Please add your Bol.com site code in project affiliate settings.',
      }, { status: 400 });
    }

    // Create Bol.com client
    const bolClient = new BolClient({
      clientId: affiliate.client_id,
      clientSecret: affiliate.client_secret,
    });

    console.log(`Generating Bol.com article for: ${search_query}`);
    console.log(`Product category: ${product_category}`);
    console.log(`Number of products: ${product_count}`);

    // Generate the article
    const article = await generateBolProductArticle(
      search_query,
      product_category,
      product_count,
      bolClient,
      affiliate.site_code
    );

    console.log(`Article generated successfully!`);
    console.log(`Title: ${article.title}`);
    console.log(`Word count: ${article.wordCount}`);

    // Return the generated article
    return NextResponse.json({
      success: true,
      article: {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        meta_title: article.metaTitle,
        meta_description: article.metaDescription,
        word_count: article.wordCount,
      },
      metadata: {
        search_query,
        product_category,
        product_count,
        generated_at: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Bol.com article generation error:', error);

    // Handle specific errors
    if (error.message?.includes('Geen producten gevonden')) {
      return NextResponse.json({
        error: 'No products found',
        details: error.message,
      }, { status: 404 });
    }

    if (error.message?.includes('Bol.com authentication failed')) {
      return NextResponse.json({
        error: 'Bol.com API authentication failed',
        details: 'Please check your Bol.com API credentials in project settings.',
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Article generation failed',
      details: error.message || 'An unexpected error occurred',
    }, { status: 500 });
  }
}
