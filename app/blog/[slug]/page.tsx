import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import TableOfContents from '@/components/TableOfContents';
import SocialShare from '@/components/SocialShare';
import AuthorBox from '@/components/AuthorBox';
import { MIKE_SCHONEWILLE, getAuthorSchema } from '@/lib/author-profile';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  published_at: string;
  views: number;
}

// Helper function to clean content from HTML artifacts
function cleanArticleContent(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks that might have been left in
  cleaned = cleaned.replace(/```html\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove "```html" text that appears as visible text
  cleaned = cleaned.replace(/`{3}html/gi, '');
  cleaned = cleaned.replace(/`{3}/g, '');
  
  // Clean up any double spaces or excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const supabase = createClient();

  const { data: article } = await supabase
    .from('articles')
    .select('title, meta_title, meta_description, excerpt, featured_image')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return {
      title: 'Artikel niet gevonden - WritGo',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl';
  const articleUrl = `${siteUrl}/blog/${params.slug}`;

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      url: articleUrl,
      siteName: 'WritGo',
      images: article.featured_image ? [{
        url: article.featured_image,
        width: 1200,
        height: 630,
        alt: article.title,
      }] : [],
      locale: 'nl_NL',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      images: article.featured_image ? [article.featured_image] : [],
      creator: '@WritGoNL',
      site: '@WritGoNL',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createClient();

  // Fetch article
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  // Clean the article content
  const cleanedContent = cleanArticleContent(article.content);

  // Increment view count (fire and forget)
  supabase
    .from('articles')
    .update({ views: (article.views || 0) + 1 })
    .eq('id', article.id)
    .then(() => {});

  // Fetch related articles (same focus keyword or recent)
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, featured_image, published_at')
    .eq('status', 'published')
    .neq('id', article.id)
    .or(article.focus_keyword ? `focus_keyword.eq.${article.focus_keyword}` : '')
    .order('published_at', { ascending: false })
    .limit(3);

  // Generate schema markup
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://writgo.nl';
  const articleUrl = `${siteUrl}/blog/${params.slug}`;
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featured_image || `${siteUrl}/og-image.png`,
    "datePublished": article.published_at,
    "dateModified": article.published_at,
    "author": {
      "@type": "Organization",
      "name": "WritGo",
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "WritGo",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    }
  };

  const authorSchema = getAuthorSchema(MIKE_SCHONEWILLE, articleUrl);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${siteUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />

      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/blog" className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug naar blog
          </Link>
        </div>
      </header>

      {/* Article with TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
          {/* Main Article */}
          <article className="min-w-0">
            {/* Featured Image */}
            {article.featured_image && (
              <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-8 shadow-2xl">
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Keyword Badge */}
            {article.focus_keyword && (
              <span className="inline-block px-4 py-1.5 text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full mb-6">
                {article.focus_keyword}
              </span>
            )}

            {/* Title - WHITE */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Meta - WHITE/LIGHT */}
            <div className="flex items-center text-white mb-8 pb-8 border-b border-gray-800">
              <time dateTime={article.published_at} className="mr-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(article.published_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {article.views || 0} weergaven
              </span>
            </div>

            {/* Content - ALL WHITE TEXT using Tailwind prose */}
            <div 
              className="prose prose-lg prose-invert max-w-none
                [&_*]:text-white
                [&_h1]:text-white [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
                [&_h2]:text-white [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4
                [&_h3]:text-white [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3
                [&_h4]:text-white [&_h4]:text-xl [&_h4]:font-bold [&_h4]:mt-6 [&_h4]:mb-2
                [&_p]:text-white [&_p]:text-lg [&_p]:leading-relaxed [&_p]:mb-5
                [&_ul]:text-white [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6
                [&_ol]:text-white [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_li]:text-white [&_li]:text-lg [&_li]:leading-relaxed [&_li]:mb-2
                [&_strong]:text-white [&_strong]:font-bold
                [&_em]:text-white
                [&_a]:text-orange-400 [&_a]:no-underline hover:[&_a]:text-orange-300 hover:[&_a]:underline
                [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:bg-gray-800/50 [&_blockquote]:rounded-r-lg [&_blockquote]:py-4 [&_blockquote]:px-6 [&_blockquote]:my-8 [&_blockquote]:text-white
                [&_code]:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-orange-400
                [&_pre]:bg-gray-800 [&_pre]:rounded-xl [&_pre]:p-6
                [&_img]:rounded-xl [&_img]:shadow-2xl [&_img]:my-10
                [&_table]:w-full [&_th]:text-white [&_th]:bg-gray-800/50 [&_th]:p-3 [&_td]:text-white [&_td]:p-3 [&_td]:border-gray-700"
              dangerouslySetInnerHTML={{ __html: cleanedContent }}
            />

            {/* Author Box */}
            <div className="mt-12">
              <AuthorBox author={MIKE_SCHONEWILLE} />
            </div>

            {/* CTA Box */}
            <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 text-center shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-3">
                Wil jij ook automatisch SEO-content genereren?
              </h3>
              <p className="text-orange-100 mb-6 text-lg">
                WritGo AI helpt je om automatisch hoogwaardige, SEO-geoptimaliseerde content te creëren en publiceren
              </p>
              <Link
                href="/register"
                className="inline-block bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-lg"
              >
                Start Gratis →
              </Link>
            </div>

            {/* Social Share */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <SocialShare 
                url={articleUrl} 
                title={article.title}
              />
            </div>
          </article>

          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents content={cleanedContent} />
          </aside>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-8">Gerelateerde artikelen</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-xl hover:border-orange-500/50 transition-all overflow-hidden group hover:shadow-xl hover:shadow-orange-500/10"
              >
                {related.featured_image ? (
                  <div className="aspect-video bg-gray-800 overflow-hidden">
                    <img
                      src={related.featured_image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-orange-600/20" />
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  {related.excerpt && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {related.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
