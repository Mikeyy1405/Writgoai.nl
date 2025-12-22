import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Generate blog post URLs
    const blogPosts: MetadataRoute.Sitemap = (articles || []).map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updated_at || article.published_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Fetch all categories
    const { data: categories } = await supabase
      .from('article_categories')
      .select('slug');

    // Generate category URLs
    const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((category) => ({
      url: `${baseUrl}/blog/category/${category.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/over-ons`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      ...blogPosts,
      ...categoryUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return minimal sitemap if there's an error
    return [
      {
        url: baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
