'use client';

/**
 * Client Dashboard Page
 * 
 * Shows subscription info, connected platforms, and content stats
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Package,
  TrendingUp,
  Eye,
  Heart,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  AlertCircle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';

interface DashboardData {
  subscription: any;
  stats: any;
  platforms: any[];
}

export default function ClientDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [subscriptionRes, statsRes, platformsRes] = await Promise.all([
        fetch('/api/client/subscription').catch(() => null),
        fetch('/api/client/stats'),
        fetch('/api/client/platforms'),
      ]);

      const stats = await statsRes.json();
      const platforms = await platformsRes.json();
      
      let subscription = null;
      if (subscriptionRes && subscriptionRes.ok) {
        subscription = await subscriptionRes.json();
      }

      setDashboardData({
        subscription: subscription?.subscription || null,
        stats: stats.stats || {},
        platforms: platforms.platforms || [],
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Error</h3>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { subscription, stats, platforms } = dashboardData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">
          Welkom terug! Hier is een overzicht van je content en statistieken.
        </p>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF9933]" />
                {subscription.package_info?.name || subscription.package_type} Pakket
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {subscription.package_info?.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#FF9933]">
                €{subscription.price}
              </p>
              <p className="text-xs text-zinc-500">per maand</p>
            </div>
          </div>

          {stats.package_info && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Pillar Articles</p>
                <p className="text-lg font-semibold text-white">
                  {stats.package_info.remaining.pillar_articles}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Cluster Articles</p>
                <p className="text-lg font-semibold text-white">
                  {stats.package_info.remaining.cluster_articles}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Social Posts</p>
                <p className="text-lg font-semibold text-white">
                  {stats.package_info.remaining.social_posts}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Videos</p>
                <p className="text-lg font-semibold text-white">
                  {stats.package_info.remaining.videos}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Content Deze Maand"
            value={stats.content_this_month || 0}
            icon={TrendingUp}
            trend={stats.content_this_month > 0 ? 'up' : undefined}
          />
          <StatsCard
            title="Totaal Impressies"
            value={stats.total_impressions || 0}
            icon={Eye}
          />
          <StatsCard
            title="Totaal Engagements"
            value={stats.total_engagements || 0}
            icon={Heart}
          />
          <StatsCard
            title="Verbonden Platforms"
            value={stats.connected_platforms || 0}
            icon={Linkedin}
          />
        </div>
      )}

      {/* Connected Platforms */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Verbonden Platforms
        </h2>
        {platforms && platforms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform: any) => (
              <div
                key={platform.id}
                className="bg-zinc-800 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="text-2xl">
                  {platform.platform_info?.icon || '📱'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {platform.platform_info?.name || platform.platform_type}
                  </p>
                  {platform.platform_username && (
                    <p className="text-sm text-zinc-400 truncate">
                      @{platform.platform_username}
                    </p>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-400 mb-4">
              Nog geen platforms verbonden
            </p>
            <button className="px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#FF9933]/90 transition-colors">
              Verbind Platform
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/client-portal/content-library')}
          className="bg-zinc-900 border border-zinc-800 hover:border-[#FF9933] rounded-lg p-6 text-left transition-all"
        >
          <h3 className="font-semibold text-white mb-2">Content Bibliotheek</h3>
          <p className="text-sm text-zinc-400">
            Bekijk al je gegenereerde content
          </p>
        </button>
        <button
          onClick={() => router.push('/client-portal/nieuw-verzoek')}
          className="bg-zinc-900 border border-zinc-800 hover:border-[#FF9933] rounded-lg p-6 text-left transition-all"
        >
          <h3 className="font-semibold text-white mb-2">Nieuw Verzoek</h3>
          <p className="text-sm text-zinc-400">
            Vraag nieuwe content aan
          </p>
        </button>
        <button
          onClick={() => router.push('/client-portal/settings')}
          className="bg-zinc-900 border border-zinc-800 hover:border-[#FF9933] rounded-lg p-6 text-left transition-all"
        >
          <h3 className="font-semibold text-white mb-2">Instellingen</h3>
          <p className="text-sm text-zinc-400">
            Beheer je account en voorkeuren
          </p>
        </button>
      </div>
    </div>
  );
}
