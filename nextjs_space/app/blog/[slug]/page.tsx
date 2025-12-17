/**
 * Individual Blog Post Page
 * Toont een enkele blog post met volledige content
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import PublicNav from '@/components/public-nav';

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
    const post = await prisma.blogPost.findUnique({
      where: {
        slug,
        status: 'published',
      },
    });
    return post as any;
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
    description: post.metaDescription || post.excerpt || 'Lees dit artikel op Writgo.nl',
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar Blog</span>
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-xl shadow-md p-8 md:p-12">
          {/* Category */}
          {post.category && (
            <div className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-semibold mb-6">
              {post.category}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author || 'Writgo Team'}</span>
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

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag className="w-4 h-4 text-gray-500" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-blue-50 border-2 border-orange-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Wil je ook zo'n artikel laten genereren?
          </h2>
          <p className="text-gray-700 mb-6">
            Probeer Writgo.nl gratis en genereer automatisch SEO-geoptimaliseerde content voor je WordPress website.
          </p>
          <Link
            href="/login"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Start Gratis
          </Link>
        </div>
      </main>
    </div>
  );
}
