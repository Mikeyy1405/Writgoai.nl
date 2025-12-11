'use client';

import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Share2, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface MarketingStatus {
  isSetup: boolean;
  hasContentPlan: boolean;
  hasSocialAccounts: boolean;
  automationActive: boolean;
  lastPlanGenerated?: string;
  stats: {
    blogsThisMonth: number;
    socialPostsThisMonth: number;
    totalBlogs: number;
    totalSocialPosts: number;
  };
  recentContent?: {
    blogs: Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
      publishedAt?: string;
    }>;
    social: Array<{
      id: string;
      title: string;
      platform?: string;
      status: string;
      createdAt: string;
    }>;
  };
  client?: {
    id: string;
    email: string;
    name: string;
    website?: string;
    automationActive: boolean;
    automationStartDate?: string;
  };
}

export default function WritgoMarketingDashboard() {
  const [status, setStatus] = useState<MarketingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/writgo-marketing/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to load marketing status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setSetupLoading(true);
      const response = await fetch('/api/admin/writgo-marketing/setup', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to setup');
      await fetchStatus();
    } catch (err) {
      setError('Failed to setup Writgo.nl client');
      console.error(err);
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status?.isSetup) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <Sparkles className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-100 mb-4">
              Writgo.nl Marketing Setup
            </h1>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Start met het opzetten van Writgo.nl als interne klant om je eigen marketing 
              te automatiseren met dezelfde flow die je aan klanten verkoopt.
            </p>
            <button
              onClick={handleSetup}
              disabled={setupLoading}
              className="px-8 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setupLoading ? 'Bezig met setup...' : 'Setup Writgo.nl Client'}
            </button>
            {error && (
              <p className="mt-4 text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-[#FF6B35]" />
            <h1 className="text-3xl font-bold text-gray-100">Writgo Marketing Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Beheer je eigen marketing content en automatisering
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Setup Status</span>
              {status.isSetup ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {status.isSetup ? 'Actief' : 'Niet actief'}
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Content Plan</span>
              {status.hasContentPlan ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {status.hasContentPlan ? 'Gegenereerd' : 'Nog niet'}
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Social Accounts</span>
              {status.hasSocialAccounts ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {status.hasSocialAccounts ? 'Verbonden' : 'Nog niet'}
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Automation</span>
              {status.automationActive ? (
                <Activity className="w-5 h-5 text-green-500 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {status.automationActive ? 'Actief' : 'Uit'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-gray-400 text-sm">Blogs deze maand</span>
            </div>
            <p className="text-3xl font-bold text-gray-100">{status.stats.blogsThisMonth}</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-gray-400 text-sm">Social posts deze maand</span>
            </div>
            <p className="text-3xl font-bold text-gray-100">{status.stats.socialPostsThisMonth}</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-gray-400 text-sm">Totaal blogs</span>
            </div>
            <p className="text-3xl font-bold text-gray-100">{status.stats.totalBlogs}</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-gray-400 text-sm">Totaal social posts</span>
            </div>
            <p className="text-3xl font-bold text-gray-100">{status.stats.totalSocialPosts}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/writgo-marketing/content-plan"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-[#FF6B35] transition-colors group"
          >
            <Calendar className="w-8 h-8 text-[#FF6B35] mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Content Plan</h3>
            <p className="text-gray-400 text-sm">
              Genereer of bekijk je content planning
            </p>
          </Link>

          <Link
            href="/admin/writgo-marketing/social"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-[#FF6B35] transition-colors group"
          >
            <Share2 className="w-8 h-8 text-[#FF6B35] mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Social Accounts</h3>
            <p className="text-gray-400 text-sm">
              Beheer je social media koppelingen
            </p>
          </Link>

          <Link
            href="/admin/blog"
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-[#FF6B35] transition-colors group"
          >
            <FileText className="w-8 h-8 text-[#FF6B35] mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Blog CMS</h3>
            <p className="text-gray-400 text-sm">
              Bekijk en beheer gepubliceerde blogs
            </p>
          </Link>
        </div>

        {/* Recent Content */}
        {status.recentContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Blogs */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF6B35]" />
                Recente Blogs
              </h3>
              <div className="space-y-3">
                {status.recentContent.blogs.length > 0 ? (
                  status.recentContent.blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <h4 className="font-medium text-gray-100 mb-1">{blog.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="capitalize">{blog.status}</span>
                        <span>•</span>
                        <span>{new Date(blog.createdAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nog geen blogs gegenereerd
                  </p>
                )}
              </div>
            </div>

            {/* Recent Social Posts */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#FF6B35]" />
                Recente Social Posts
              </h3>
              <div className="space-y-3">
                {status.recentContent.social.length > 0 ? (
                  status.recentContent.social.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <h4 className="font-medium text-gray-100 mb-1">{post.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="capitalize">{post.platform || 'Social'}</span>
                        <span>•</span>
                        <span className="capitalize">{post.status}</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nog geen social posts gegenereerd
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
