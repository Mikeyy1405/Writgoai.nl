/**
 * Site Manager API - Main Route
 * Unified endpoint voor alle WordPress/WooCommerce content beheer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient, getWooCommerceConfig } from '@/lib/woocommerce-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
  modified: string;
  status: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  yoast_head_json?: {
    title?: string;
    description?: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

interface WordPressPage {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date: string;
  modified: string;
  status: string;
  featured_media: number;
  yoast_head_json?: {
    title?: string;
    description?: string;
  };
}

/**
 * GET /api/client/site-manager
 * Haal alle content op van WordPress (posts, products, pages, categories)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'posts'; // posts, products, pages, categories
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'any';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get project and WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email }
      },
      include: {
        client: {
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get WordPress credentials
    const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
    const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
    const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie ontbreekt. Stel eerst je WordPress credentials in.' 
      }, { status: 400 });
    }

    const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');

    // Handle different content types
    if (type === 'posts') {
      return await fetchPosts(wordpressUrl, auth, page, limit, search, status);
    } else if (type === 'products') {
      return await fetchProducts(project, page, limit, search, status);
    } else if (type === 'pages') {
      return await fetchPages(wordpressUrl, auth, page, limit, search, status);
    } else if (type === 'categories') {
      return await fetchCategories(wordpressUrl, auth, type);
    } else {
      return NextResponse.json({ error: 'Ongeldig content type' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in site-manager GET:', error);
    return NextResponse.json({ 
      error: 'Fout bij ophalen content',
      details: error.message 
    }, { status: 500 });
  }
}

async function fetchPosts(
  wordpressUrl: string,
  auth: string,
  page: number,
  limit: number,
  search: string,
  status: string
) {
  const params: any = {
    page: page.toString(),
    per_page: limit.toString(),
    status: status,
    _embed: '1',
    orderby: 'modified',
    order: 'desc'
  };

  if (search) {
    params.search = search;
  }

  const apiUrl = `${wordpressUrl}/wp-json/wp/v2/posts?` + new URLSearchParams(params);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API fout: ${response.status}`);
  }

  const posts: WordPressPost[] = await response.json();
  const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

  // Transform posts
  const transformedPosts = posts.map(post => {
    const wordCount = post.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const categories = post._embedded?.['wp:term']?.[0]?.map(cat => cat.name) || [];
    
    return {
      id: post.id,
      type: 'post' as const,
      title: post.title.rendered,
      content: post.content.rendered,
      excerpt: post.excerpt.rendered?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
      link: post.link,
      date: post.date,
      modified: post.modified,
      status: post.status,
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      categories: categories,
      wordCount: wordCount,
      seoTitle: post.yoast_head_json?.title || post.title.rendered,
      seoDescription: post.yoast_head_json?.description || '',
      seoScore: calculateSeoScore(post.yoast_head_json?.title, post.yoast_head_json?.description, wordCount)
    };
  });

  return NextResponse.json({
    items: transformedPosts,
    pagination: {
      page,
      limit,
      total: totalPosts,
      totalPages
    }
  });
}

async function fetchProducts(
  project: any,
  page: number,
  limit: number,
  search: string,
  status: string
) {
  const wooConfig = getWooCommerceConfig(project);
  if (!wooConfig) {
    throw new Error('WooCommerce niet geconfigureerd');
  }

  const wooClient = createWooCommerceClient(wooConfig);
  
  const products = await wooClient.getProducts({
    page,
    per_page: limit,
    search: search || undefined,
    status: status !== 'any' ? status : undefined,
    orderby: 'date',
    order: 'desc'
  });

  // Transform products
  const transformedProducts = (products as any[]).map((product: any) => {
    const wordCount = (product.description || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
    const seoTitle = product.meta_data?.find((m: any) => m.key === '_yoast_wpseo_title')?.value || product.name;
    const seoDescription = product.meta_data?.find((m: any) => m.key === '_yoast_wpseo_metadesc')?.value || '';
    
    return {
      id: product.id,
      type: 'product' as const,
      title: product.name,
      content: product.description || '',
      excerpt: product.short_description || '',
      link: product.permalink || '',
      date: product.date_created || '',
      modified: product.date_modified || '',
      status: product.status,
      featuredImage: product.images?.[0]?.src || null,
      categories: product.categories?.map((c: any) => c.name) || [],
      price: product.price || product.regular_price,
      salePrice: product.sale_price,
      stockStatus: product.stock_status,
      stockQuantity: product.stock_quantity,
      sku: product.sku,
      wordCount: wordCount,
      seoTitle: seoTitle,
      seoDescription: seoDescription,
      seoScore: calculateSeoScore(seoTitle, seoDescription, wordCount)
    };
  });

  const pagination = (products as any)._pagination;

  return NextResponse.json({
    items: transformedProducts,
    pagination: {
      page: pagination?.currentPage || page,
      limit,
      total: pagination?.total || transformedProducts.length,
      totalPages: pagination?.totalPages || 1
    }
  });
}

async function fetchPages(
  wordpressUrl: string,
  auth: string,
  page: number,
  limit: number,
  search: string,
  status: string
) {
  const params: any = {
    page: page.toString(),
    per_page: limit.toString(),
    status: status,
    orderby: 'modified',
    order: 'desc'
  };

  if (search) {
    params.search = search;
  }

  const apiUrl = `${wordpressUrl}/wp-json/wp/v2/pages?` + new URLSearchParams(params);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API fout: ${response.status}`);
  }

  const pages: WordPressPage[] = await response.json();
  const totalPages = parseInt(response.headers.get('X-WP-Total') || '0');
  const totalPagesCount = parseInt(response.headers.get('X-WP-TotalPages') || '1');

  // Transform pages
  const transformedPages = pages.map(p => {
    const wordCount = p.content.rendered.replace(/<[^>]*>/g, '').split(/\s+/).length;
    
    return {
      id: p.id,
      type: 'page' as const,
      title: p.title.rendered,
      content: p.content.rendered,
      excerpt: p.excerpt.rendered?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
      link: p.link,
      date: p.date,
      modified: p.modified,
      status: p.status,
      featuredImage: null,
      categories: [],
      wordCount: wordCount,
      seoTitle: p.yoast_head_json?.title || p.title.rendered,
      seoDescription: p.yoast_head_json?.description || '',
      seoScore: calculateSeoScore(p.yoast_head_json?.title, p.yoast_head_json?.description, wordCount)
    };
  });

  return NextResponse.json({
    items: transformedPages,
    pagination: {
      page,
      limit,
      total: totalPages,
      totalPages: totalPagesCount
    }
  });
}

async function fetchCategories(
  wordpressUrl: string,
  auth: string,
  type: string
) {
  const apiUrl = `${wordpressUrl}/wp-json/wp/v2/categories?per_page=100`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API fout: ${response.status}`);
  }

  const categories = await response.json();

  return NextResponse.json({
    items: categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count,
      description: cat.description,
      parent: cat.parent
    }))
  });
}

/**
 * Calculate SEO score based on meta title, description, and content length
 */
function calculateSeoScore(
  title?: string,
  description?: string,
  wordCount?: number
): number {
  let score = 0;
  
  // Title check (max 60 characters)
  if (title) {
    if (title.length >= 30 && title.length <= 60) {
      score += 40;
    } else if (title.length > 0) {
      score += 20;
    }
  }
  
  // Description check (max 160 characters)
  if (description) {
    if (description.length >= 120 && description.length <= 160) {
      score += 40;
    } else if (description.length > 0) {
      score += 20;
    }
  }
  
  // Word count check
  if (wordCount) {
    if (wordCount >= 300) {
      score += 20;
    } else if (wordCount >= 100) {
      score += 10;
    }
  }
  
  return Math.min(100, score);
}
