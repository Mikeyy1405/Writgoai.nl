/**
 * Individual Blog Post Page - Simplified Interface
 * 
 * Dark theme blog post viewer that matches the simplified dashboard design
 * Uses API routes instead of direct database queries
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft, BookOpen } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/simplified/blog/${slug}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      console.error('[Blog Post] API error:', res.status);
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('[Blog Post] Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Niet Gevonden',
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || 'Lees dit artikel op WritGo.nl',
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Terug naar Blog</span>
      </Link>

      {/* Article */}
      <article className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="aspect-video bg-gray-800 overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Container */}
        <div className="p-8 md:p-12">
          {/* Category */}
          {post.category && (
            <div className="inline-block bg-orange-500/20 text-orange-400 px-4 py-1 rounded-full text-sm font-semibold mb-6 border border-orange-500/30">
              {post.category}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-800">
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author || 'WritGo Team'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Datum onbekend'}
              </span>
            </div>
          </div>

          {/* Content - Dark Theme Prose Styling */}
          <div
            className="prose prose-invert prose-lg max-w-none 
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:text-orange-300
              prose-strong:text-white prose-strong:font-bold
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:text-gray-300
              prose-blockquote:border-l-orange-500 prose-blockquote:text-gray-400
              prose-code:text-orange-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag className="w-4 h-4 text-gray-500" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700 hover:border-orange-500/50 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-orange-500/20 to-blue-500/20 border-2 border-orange-500 rounded-2xl p-8 text-center shadow-xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Wil je ook zo'n artikel laten genereren?
          </h2>
        </div>
        <p className="text-gray-300 mb-6 text-lg">
          Probeer WritGo.nl en genereer automatisch SEO-geoptimaliseerde content voor je WordPress website.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
        >
          Naar Dashboard →
        </Link>
      </div>
    </div>
  );
}
