'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  Clock,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  status: string;
  publishedAt?: string;
}

export default function BlogAnalyticsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog?status=published');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;
  const topPost = posts.length > 0 ? posts.reduce((prev, curr) => 
    prev.views > curr.views ? prev : curr
  ) : null;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9933]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Blog Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Performance overzicht van je blog content
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Totaal Views</p>
              <p className="text-3xl font-bold mt-1">{totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gemiddeld per Post</p>
              <p className="text-3xl font-bold mt-1">{avgViews}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gepubliceerde Posts</p>
              <p className="text-3xl font-bold mt-1">{posts.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Post Views</p>
              <p className="text-3xl font-bold mt-1">{topPost?.views || 0}</p>
            </div>
            <MousePointerClick className="w-8 h-8 text-[#FF9933]" />
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performing Posts</h2>
        <div className="space-y-3">
          {posts
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
            .map((post, index) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-slate-800 dark:bg-zinc-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF9933] text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/agency/blog/posts/${post.id}`}
                      className="font-medium hover:text-[#FF9933] transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      /{post.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span className="font-semibold">{post.views}</span>
                  <span className="text-sm">views</span>
                </div>
              </div>
            ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nog geen gepubliceerde posts om te analyseren
          </p>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">Uitgebreide Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Voor geavanceerde analytics zoals CTR, bounce rate, conversie tracking en 
              historische trends, integreer Google Analytics of Search Console.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
