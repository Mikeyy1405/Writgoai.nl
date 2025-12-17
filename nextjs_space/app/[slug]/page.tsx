
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PublicNav from '@/components/public-nav';
import { Calendar, Clock, Eye, ArrowLeft } from 'lucide-react';
import BlogTableOfContents from '@/components/blog-table-of-contents';
import BlogShareButton from '@/components/blog-share-button';
import BlogFeaturedImage from '@/components/blog-featured-image';
import { supabaseAdmin } from '@/lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  views: number;
  authorName: string;
}

// ✅ Generate metadata for SEO (Server Side)
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const { data: post } = await supabaseAdmin
    .from('BlogPost')
    .select('title, slug, excerpt, metaTitle, metaDescription, focusKeyword, featuredImage, publishedAt, authorName, category, tags')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return {
      title: 'Post niet gevonden | WritgoAI',
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const url = `https://WritgoAI.nl/${post.slug}`;

  return {
    title: `${title} | WritgoAI Blog`,
    description,
    keywords: post.focusKeyword ? [post.focusKeyword, ...post.tags] : post.tags,
    authors: [{ name: post.authorName }],
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
      authors: [post.authorName],
      section: post.category,
      tags: post.tags || [],
      images: post.featuredImage ? [{
        url: post.featuredImage,
        width: 1200,
        height: 630,
        alt: post.title,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

// ✅ Fetch post on server side
async function getPost(slug: string): Promise<BlogPost | null> {
  const { data: post } = await supabaseAdmin
    .from('BlogPost')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return null;
  }

  // Increment views asynchronously
  supabaseAdmin
    .from('BlogPost')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', post.id)
    .then(({ error }) => {
      if (error) console.error('Error incrementing views:', error);
    });

  // Convert Date fields to ISO strings for client component compatibility
  return {
    ...post,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    tags: post.tags || [],
  } as BlogPost;
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || 'https://WritgoAI.nl/icon-512.png',
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName,
      url: 'https://WritgoAI.nl',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WritgoAI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://WritgoAI.nl/icon-512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://WritgoAI.nl/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags.join(', '),
    wordCount: post.content.split(/\s+/).length,
    timeRequired: `PT${post.readingTimeMinutes}M`,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Navigation */}
        <PublicNav />

        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/20 py-4 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-orange-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar blog
              </Button>
            </Link>
          </div>
        </div>

        <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Badge */}
          <Badge className="mb-4 bg-orange-900/50 text-orange-300 border-orange-700">
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-8 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readingTimeMinutes} min leestijd</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>{post.views} views</span>
            </div>
            <BlogShareButton title={post.title} excerpt={post.excerpt} />
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <BlogFeaturedImage
              src={post.featuredImage}
              alt={post.title}
              title={post.title}
            />
          )}

          {/* Content Grid: Main Content + TOC */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
            {/* Main Content */}
            <div
              className="blog-content min-w-0"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Table of Contents - Right Side */}
            <div className="hidden lg:block">
              <BlogTableOfContents content={post.content} />
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-white">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-gray-700 hover:border-orange-500 hover:text-orange-400 text-gray-400"
                    >
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="mt-12 p-8 bg-gradient-to-br from-orange-600 to-orange-700 text-white text-center border-0 shadow-2xl shadow-orange-500/30">
            <h2 className="text-2xl font-bold mb-3">
              Probeer WritgoAI nu gratis
            </h2>
            <p className="text-orange-100 mb-6">
              Genereer automatisch SEO-geoptimaliseerde blog posts zoals deze
            </p>
            <Link href="/inloggen">
              <Button
                size="lg"
                className="bg-slate-900 text-orange-600 hover:bg-orange-50 shadow-lg"
              >
                Start Gratis Trial
              </Button>
            </Link>
          </Card>

          {/* Author Info */}
          <div className="mt-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                W
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  {post.authorName}
                </h4>
                <p className="text-gray-400 text-sm">
                  Expert in AI-gedreven content marketing
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
