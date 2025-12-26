import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization to prevent build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase as any; // Type assertion needed for tables not in generated types
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Strategy 1: Find articles with similar focus keyword
    let query = getSupabase()
      .from('articles')
      .select('id, title, slug, excerpt, published_at, focus_keyword')
      .eq('status', 'published')
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(limit * 2); // Get more to filter

    // If we have a keyword, prioritize articles with similar keywords
    if (keyword) {
      query = query.ilike('focus_keyword', `%${keyword.split(' ')[0]}%`);
    }

    const { data: keywordMatches, error: keywordError } = await query;

    if (keywordError) {
      throw keywordError;
    }

    // Strategy 2: If not enough keyword matches, get recent articles
    let articles = keywordMatches || [];
    
    if (articles.length < limit) {
      const { data: recentArticles, error: recentError } = await getSupabase()
        .from('articles')
        .select('id, title, slug, excerpt, published_at, focus_keyword')
        .eq('status', 'published')
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (!recentError && recentArticles) {
        // Combine and deduplicate
        const existingIds = new Set(articles.map((a: any) => a.id));
        const newArticles = recentArticles.filter((a: any) => !existingIds.has(a.id));
        articles = [...articles, ...newArticles];
      }
    }

    // Limit to requested amount
    articles = articles.slice(0, limit);

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length
    });

  } catch (error: any) {
    console.error('Related articles error:', error);
    return NextResponse.json(
      { error: error.message, articles: [] },
      { status: 500 }
    );
  }
}
