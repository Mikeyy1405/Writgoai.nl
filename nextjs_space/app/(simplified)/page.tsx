'use client';

import { useEffect, useState } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { useSession } from 'next-auth/react';
import { Users, FileText, TrendingUp, Clock, Globe, Sparkles, CheckCircle, Calendar, Activity, ArrowUpRight, Search, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

/**
 * DASHBOARD - Uitgebreid Overzicht en Stats
 * 
 * Features:
 * - Real-time statistieken uit database
 * - Project overzicht met details
 * - Content performance metrics
 * - Recente activiteit feed
 * - Quick action shortcuts
 * - Success rate berekeningen
 */

interface Stats {
  totalProjects: number;
  contentThisMonth: number;
  publishedArticles: number;
  recentContent: RecentContent[];
}

interface RecentContent {
  id: string;
  title: string;
  type: string;
  publishedAt: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    savedContent: number;
  };
}

interface DashboardStats {
  totalArticles: number;
  publishedThisWeek: number;
  publishedThisMonth: number;
  successRate: number;
}

interface GSCStats {
  connected: boolean;
  siteUrl?: string;
  stats?: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  topQueries?: Array<{
    query: string;
    clicks: number;
    impressions: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    contentThisMonth: 0,
    publishedArticles: 0,
    recentContent: [],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedThisWeek: 0,
    publishedThisMonth: 0,
    successRate: 0,
  });
  const [gscStats, setGscStats] = useState<GSCStats>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data elke 30 seconden
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/simplified/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Calculate dashboard stats
        calculateDashboardStats(statsData);
      }

      // Fetch projects
      const projectsResponse = await fetch('/api/simplified/dashboard/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }

      // Fetch Google Search Console stats (non-blocking)
      try {
        const gscResponse = await fetch('/api/integrations/google-search-console/stats');
        if (gscResponse.ok) {
          const gscData = await gscResponse.json();
          setGscStats(gscData);
        } else {
          console.log('GSC not available, skipping...');
          setGscStats({ connected: false });
        }
      } catch (gscError) {
        console.log('GSC error (non-critical):', gscError);
        // Silently fail - GSC is optional
        setGscStats({ connected: false });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (data: Stats) => {
    // Calculate stats from the data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const publishedThisWeek = data.recentContent?.filter(
      c => c.publishedAt && new Date(c.publishedAt) >= weekAgo
    ).length || 0;

    const successRate = data.contentThisMonth > 0 
      ? Math.round((data.publishedArticles / data.contentThisMonth) * 100)
      : 0;

    setDashboardStats({
      totalArticles: data.contentThisMonth,
      publishedThisWeek,
      publishedThisMonth: data.publishedArticles,
      successRate,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(Math.round(num));
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(2) + '%';
  };

  const getContentTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'blog':
      case 'article':
        return '📝';
      case 'social':
        return '📱';
      case 'video':
        return '🎥';
      default:
        return '📄';
    }
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-2">👋 Welkom terug, {session?.user?.name || 'daar'}!</h1>
          <p className="text-lg opacity-90">Hier is je content overzicht</p>
          <div className="mt-4 flex items-center space-x-2 text-sm opacity-75">
            <Activity className="w-4 h-4" />
            <span>Laatst bijgewerkt: {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Actieve Projecten */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-orange-500 hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.totalProjects}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Actieve Projecten</h3>
            <p className="text-sm text-gray-400 mt-1">WordPress sites verbonden</p>
          </div>

          {/* Content deze maand */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-orange-500 hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.contentThisMonth}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Content deze maand</h3>
            <p className="text-sm text-gray-400 mt-1">Artikelen gegenereerd</p>
          </div>

          {/* Gepubliceerd */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-orange-500 hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.publishedArticles}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Gepubliceerd</h3>
            <p className="text-sm text-gray-400 mt-1">Totaal artikelen live</p>
          </div>

          {/* Success Rate */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 hover:border-orange-500 hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-white">{dashboardStats.successRate}%</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Success Rate</h3>
            <p className="text-sm text-gray-400 mt-1">Gepubliceerd / Gegenereerd</p>
          </div>
        </div>

        {/* Project Overzicht */}
        {projects.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">📁 Mijn Projecten</h2>
              <Link 
                href="/projects"
                className="text-sm text-orange-500 hover:text-orange-400 font-semibold flex items-center space-x-1"
              >
                <span>Alle projecten</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.id}
                  className="bg-black/50 border border-gray-800 rounded-lg p-4 hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-orange-500" />
                      <h3 className="font-semibold text-white truncate">{project.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      project.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {project.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate mb-2">{project.websiteUrl}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{project._count?.savedContent || 0} artikelen</span>
                    <span>{formatDate(project.createdAt).split(',')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Stats */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Content Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Deze week gepubliceerd</p>
                    <p className="text-lg font-bold text-white">{dashboardStats.publishedThisWeek}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Deze maand gepubliceerd</p>
                    <p className="text-lg font-bold text-white">{dashboardStats.publishedThisMonth}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Totaal gegenereerd</p>
                    <p className="text-lg font-bold text-white">{stats.contentThisMonth}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recente Activiteit */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">📋 Recente Activiteit</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentContent && stats.recentContent.length > 0 ? (
                stats.recentContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-start space-x-3 p-3 bg-black/50 rounded-lg border border-gray-800 hover:border-orange-500/50 transition-colors"
                  >
                    <span className="text-2xl">{getContentTypeIcon(content.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {content.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {content.publishedAt ? (
                          <span className="text-xs text-green-400 font-semibold">✓ Gepubliceerd</span>
                        ) : (
                          <span className="text-xs text-orange-400 font-semibold">⏳ Concept</span>
                        )}
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-400">{formatDate(content.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nog geen activiteit</p>
                  <p className="text-xs mt-1 text-gray-500">Genereer je eerste artikel om te beginnen!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Google Search Console Stats */}
        {gscStats.connected && gscStats.stats && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Search className="w-6 h-6 text-orange-500" />
                <span>Google Search Console</span>
              </h2>
              <Link 
                href="/settings"
                className="text-sm text-orange-500 hover:text-orange-400 font-semibold flex items-center space-x-1"
              >
                <span>Meer details</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {gscStats.siteUrl && (
              <div className="mb-4 flex items-center space-x-2 text-sm text-gray-400">
                <Globe className="w-4 h-4" />
                <span>{gscStats.siteUrl}</span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Totaal Clicks</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatNumber(gscStats.stats.totalClicks)}
                </p>
              </div>
              <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Impressies</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatNumber(gscStats.stats.totalImpressions)}
                </p>
              </div>
              <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Gemiddelde CTR</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatPercentage(gscStats.stats.averageCTR)}
                </p>
              </div>
              <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Gem. Positie</p>
                <p className="text-2xl font-bold text-orange-400">
                  {gscStats.stats.averagePosition.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Top Queries */}
            {gscStats.topQueries && gscStats.topQueries.length > 0 && (
              <div>
                <h3 className="font-bold text-white mb-3">🔍 Top Zoekwoorden (laatste 30 dagen)</h3>
                <div className="space-y-2">
                  {gscStats.topQueries.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{query.query}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-blue-400">
                          {formatNumber(query.clicks)} clicks
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatNumber(query.impressions)} impressions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GSC Not Connected Banner */}
        {!gscStats.connected && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Google Search Console niet verbonden</h3>
                <p className="text-gray-300 mb-4">
                  Verbind je website met Google Search Console om SEO performance te tracken, top keywords te zien en content gaps te identificeren.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Nu Verbinden</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-4">🚀 Snel aan de slag</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/projects"
              className="flex items-center space-x-4 p-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-orange-500 hover:bg-orange-500/10 transition-all"
            >
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Nieuw Project</h3>
                <p className="text-sm text-gray-400">WordPress koppelen</p>
              </div>
            </Link>

            <Link
              href="/content-plan"
              className="flex items-center space-x-4 p-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-orange-500 hover:bg-orange-500/10 transition-all"
            >
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Content Plannen</h3>
                <p className="text-sm text-gray-400">Nieuwe topics maken</p>
              </div>
            </Link>

            <Link
              href="/generate"
              className="flex items-center space-x-4 p-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-orange-500 hover:bg-orange-500/10 transition-all"
            >
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Content Genereren</h3>
                <p className="text-sm text-gray-400">AI artikelen schrijven</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </SimplifiedLayout>
  );
}
