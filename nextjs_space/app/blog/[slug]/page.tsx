
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PublicNav from '@/components/public-nav';
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import BlogTableOfContents from '@/components/blog-table-of-contents';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  category: string;
  tags: string[];
  published_at: string;
  author_id?: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.slug) {
      fetchPost(params.slug as string);
    }
  }, [params?.slug]);

  const fetchPost = async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) {
        throw new Error('Post niet gevonden');
      }
      const data = await res.json();
      setPost(data.post);
      
      // Update meta tags dynamically
      if (data.post) {
        updateMetaTags(data.post);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Blog post niet gevonden');
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const updateMetaTags = (post: BlogPost) => {
    // Update document title
    document.title = post.meta_title || post.title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.querySelector(`meta[property="${name}"]`);
      }
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // SEO Meta Tags
    updateMeta('description', post.meta_description || post.excerpt);

    // Open Graph
    updateMeta('og:title', post.meta_title || post.title);
    updateMeta('og:description', post.meta_description || post.excerpt);
    updateMeta('og:type', 'article');
    updateMeta('og:url', `https://WritgoAI.nl/blog/${post.slug}`);
    if (post.featured_image) {
      updateMeta('og:image', post.featured_image);
    }

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', post.meta_title || post.title);
    updateMeta('twitter:description', post.meta_description || post.excerpt);
    if (post.featured_image) {
      updateMeta('twitter:image', post.featured_image);
    }

    // Article specific
    updateMeta('article:published_time', post.published_at);
    updateMeta('article:author', 'WritgoAI');
    updateMeta('article:section', post.category);
    post.tags.forEach((tag) => {
      const tagMeta = document.createElement('meta');
      tagMeta.setAttribute('property', 'article:tag');
      tagMeta.setAttribute('content', tag);
      document.head.appendChild(tagMeta);
    });
  };

  const getStructuredData = () => {
    if (!post) return null;

    const wordCount = post.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Assume 200 words per minute

    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.featured_image || 'https://WritgoAI.nl/icon-512.png',
      datePublished: post.published_at,
      dateModified: post.published_at,
      author: {
        '@type': 'Organization',
        name: 'WritgoAI',
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
        '@id': `https://WritgoAI.nl/blog/${post.slug}`,
      },
      articleSection: post.category,
      keywords: post.tags.join(', '),
      wordCount: wordCount,
      timeRequired: `PT${readingTime}M`,
    };
  };

  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link gekopieerd naar klembord!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getStructuredData()),
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
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{Math.ceil(post.content.split(/\s+/).length / 200)} min leestijd</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="ml-auto border-gray-700 hover:border-orange-500 hover:text-orange-400 text-gray-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Delen
            </Button>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-12 shadow-lg ring-1 ring-gray-800">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
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
                className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
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
                  WritgoAI Team
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
