/**
 * WritGo Blog Page - Simplified Interface
 * 
 * Dark theme blog listing that matches the simplified dashboard design
 * Uses API routes instead of direct database queries
 */

import Link from 'next/link';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string | null;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/simplified/blog`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      console.error('[Blog] API error:', res.status);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('[Blog] Error fetching posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <BookOpen className="w-12 h-12 text-orange-500" />
          <h1 className="text-4xl font-bold text-white">
            WritGo Blog
          </h1>
        </div>
        <p className="text-lg text-gray-300">
          Tips, tutorials, en inzichten over AI content generatie, SEO, en WordPress
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <BookOpen className="w-16 h-16 text-gray-600" />
            <p className="text-xl text-gray-400">
              Nog geen blog posts. Kom binnenkort terug!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              {/* Cover Image */}
              {post.coverImage ? (
                <div className="aspect-video bg-gray-800 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-orange-500/50" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Category */}
                {post.category && (
                  <div className="inline-block bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-orange-500/30">
                    {post.category}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Datum onbekend'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 group-hover:gap-2 transition-all">
                    <span className="font-semibold">Lees meer</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
