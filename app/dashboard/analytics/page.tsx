'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PerformanceData {
  page: string;
  articleId?: string;
  articleTitle?: string;
  publishedAt?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  views: number;
  users: number;
  avgEngagementTime: number;
  bounceRate: number;
  keywords: {
    query: string;
    clicks: number;
    position: number;
  }[];
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(28);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/performance?days=${days}`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { performance, topKeywords, needsImprovement, topPerforming, declining, trafficSources, siteMetrics } = data || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Content Analytics</h1>
              <p className="text-gray-400 mt-1">Track performance, rankings, and opportunities</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={28}>Last 28 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={fetchData}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Site Metrics */}
        {siteMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <MetricCard title="Total Users" value={siteMetrics.totalUsers.toLocaleString()} />
            <MetricCard title="New Users" value={siteMetrics.newUsers.toLocaleString()} />
            <MetricCard title="Sessions" value={siteMetrics.sessions.toLocaleString()} />
            <MetricCard title="Page Views" value={siteMetrics.pageViews.toLocaleString()} />
            <MetricCard title="Avg Session" value={`${Math.round(siteMetrics.avgSessionDuration)}s`} />
            <MetricCard title="Bounce Rate" value={`${(siteMetrics.bounceRate * 100).toFixed(1)}%`} />
          </div>
        )}

        {/* Top Performing Articles */}
        {topPerforming && topPerforming.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Top Performing Articles</h2>
            <div className="space-y-3">
              {topPerforming.map((article: PerformanceData, index: number) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{article.articleTitle || article.page}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Pos: {article.position.toFixed(1)}</span>
                      <span>CTR: {(article.ctr * 100).toFixed(1)}%</span>
                      <span>Clicks: {article.clicks}</span>
                      <span>Impr: {article.impressions.toLocaleString()}</span>
                    </div>
                  </div>
                  {article.articleId && (
                    <Link
                      href={`/dashboard/articles/${article.articleId}`}
                      className="text-orange-500 hover:text-orange-400 font-medium"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Improvement */}
        {needsImprovement && needsImprovement.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">⚠️ Articles Needing Improvement</h2>
            <p className="text-gray-400 mb-4">These articles have opportunity to rank higher with optimization</p>
            <div className="space-y-3">
              {needsImprovement.map((article: PerformanceData, index: number) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{article.articleTitle || article.page}</h3>
                    {article.articleId && (
                      <Link
                        href={`/dashboard/articles/${article.articleId}/edit`}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Optimize
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span>Pos: {article.position.toFixed(1)}</span>
                    <span>CTR: {(article.ctr * 100).toFixed(1)}%</span>
                    <span>Clicks: {article.clicks}</span>
                    <span>Impr: {article.impressions.toLocaleString()}</span>
                  </div>
                  {article.keywords && article.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {article.keywords.slice(0, 5).map((kw, i) => (
                        <span key={i} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          {kw.query} (#{kw.position.toFixed(0)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Declining Articles */}
        {declining && declining.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📉 Declining Articles</h2>
            <p className="text-gray-400 mb-4">These articles need refresh to recover rankings</p>
            <div className="space-y-3">
              {declining.map((article: PerformanceData, index: number) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{article.articleTitle || article.page}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Pos: {article.position.toFixed(1)}</span>
                      <span>Clicks: {article.clicks}</span>
                      <span>Impr: {article.impressions.toLocaleString()}</span>
                    </div>
                  </div>
                  {article.articleId && (
                    <Link
                      href={`/api/content/refresh/${article.articleId}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Refresh
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Keywords */}
        {topKeywords && topKeywords.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔑 Top Keywords</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topKeywords.slice(0, 20).map((kw: any, index: number) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{kw.keys[0]}</p>
                    <p className="text-sm text-gray-400">Position: {kw.position.toFixed(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-500 font-bold">{kw.clicks}</p>
                    <p className="text-xs text-gray-400">{kw.impressions.toLocaleString()} impr</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic Sources */}
        {trafficSources && trafficSources.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Traffic Sources</h2>
            <div className="space-y-2">
              {trafficSources.slice(0, 10).map((source: any, index: number) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{source.source} / {source.medium}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-400">Sessions: {source.sessions.toLocaleString()}</span>
                    <span className="text-gray-400">Users: {source.users.toLocaleString()}</span>
                    <span className="text-green-400">New: {source.newUsers.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
