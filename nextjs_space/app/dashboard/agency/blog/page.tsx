'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Plus,
  TrendingUp,
  Eye,
  Clock,
  BarChart3,
  Calendar,
  Lightbulb,
  Search,
  Settings,
  Edit,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    totalViews: number;
  };
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    publishedAt: string;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    createdAt: string;
  }>;
  postsByCategory: Array<{
    category: string;
    _count: number;
  }>;
}

export default function BlogDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/blog/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      toast.error('Fout bij ophalen statistieken');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Beheer je blog content, SEO en analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard/agency/blog/posts/new')}
            className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Totaal Posts</p>
              <p className="text-3xl font-bold mt-1">{stats?.overview.totalPosts || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-[#FF9933]" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gepubliceerd</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {stats?.overview.publishedPosts || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Concept</p>
              <p className="text-3xl font-bold mt-1 text-yellow-600">
                {stats?.overview.draftPosts || 0}
              </p>
            </div>
            <Edit className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Totaal Views</p>
              <p className="text-3xl font-bold mt-1">{stats?.overview.totalViews || 0}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/agency/blog/posts">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <FileText className="w-8 h-8 text-[#FF9933] mb-3" />
            <h3 className="font-semibold mb-1">Alle Posts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bekijk en beheer posts
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/agency/blog/calendar">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Calendar className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Kalender</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Content planning
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/agency/blog/ideas">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Lightbulb className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold mb-1">Ideeën</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Content ideeën database
            </p>
          </Card>
        </Link>

        <Link href="/dashboard/agency/blog/analytics">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Performance tracking
            </p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Performers
          </h2>
          <div className="space-y-3">
            {stats?.topPosts.map((post) => (
              <div
                key={post.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="flex-1">
                  <Link
                    href={`/dashboard/agency/blog/posts/${post.id}`}
                    className="font-medium hover:text-[#FF9933] transition-colors"
                  >
                    {post.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  {post.views}
                </div>
              </div>
            ))}
            {(!stats?.topPosts || stats.topPosts.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nog geen gepubliceerde posts
              </p>
            )}
          </div>
        </Card>

        {/* Recent Posts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recente Posts
          </h2>
          <div className="space-y-3">
            {stats?.recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="flex-1">
                  <Link
                    href={`/dashboard/agency/blog/posts/${post.id}`}
                    className="font-medium hover:text-[#FF9933] transition-colors"
                  >
                    {post.title}
                  </Link>
                </div>
                <Badge
                  variant={post.status === 'published' ? 'default' : 'secondary'}
                >
                  {post.status}
                </Badge>
              </div>
            ))}
            {(!stats?.recentPosts || stats.recentPosts.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nog geen posts aangemaakt
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Posts by Category */}
      {stats?.postsByCategory && stats.postsByCategory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Posts per Categorie</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.postsByCategory.map((item) => (
              <div
                key={item.category}
                className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-[#FF9933]">{item._count}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {item.category}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
