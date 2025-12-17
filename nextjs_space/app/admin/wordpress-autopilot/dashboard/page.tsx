'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
  siteUrl: string;
  status: 'active' | 'paused' | 'error';
  totalPosts: number;
  lastPostDate?: string;
  nextPostDate?: string;
  topicalAuthorityScore?: number;
  postingFrequency: string;
}

interface ContentItem {
  id: string;
  title: string;
  focusKeyword: string;
  status: 'scheduled' | 'generating' | 'generated' | 'published' | 'failed';
  scheduledDate: string;
  publishedUrl?: string;
  publishedAt?: string;
  wordCount?: number;
}

export default function WordPressAutopilotDashboard() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [view, setView] = useState<'overview' | 'content' | 'performance'>('overview');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadContent(selectedSite.id);
      loadMetrics(selectedSite.id);
    }
  }, [selectedSite]);

  const loadSites = async () => {
    try {
      const response = await fetch('/api/admin/wordpress-autopilot/sites');
      const data = await response.json();
      
      if (data.success) {
        setSites(data.sites);
        if (data.sites.length > 0) {
          setSelectedSite(data.sites[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (siteId: string) => {
    setContentLoading(true);
    try {
      const response = await fetch(`/api/admin/wordpress-autopilot/content?siteId=${siteId}`);
      const data = await response.json();
      
      if (data.success) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const loadMetrics = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/wordpress-autopilot/performance?siteId=${siteId}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const toggleAutopilot = async (siteId: string, currentStatus: string) => {
    const endpoint = currentStatus === 'active' ? 'stop' : 'start';
    
    try {
      const response = await fetch(`/api/admin/wordpress-autopilot/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      
      if (response.ok) {
        loadSites();
      }
    } catch (error) {
      console.error('Failed to toggle autopilot:', error);
    }
  };

  const generateContent = async (calendarItemId: string) => {
    try {
      const response = await fetch('/api/admin/wordpress-autopilot/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarItemId }),
      });
      
      if (response.ok) {
        loadContent(selectedSite!.id);
        loadMetrics(selectedSite!.id);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-3xl font-bold mb-4 text-white">Geen WordPress Sites</h1>
          <p className="text-gray-600 mb-6">
            Voeg je eerste WordPress site toe om te beginnen met automatische content generatie
          </p>
          <Link
            href="/admin/wordpress-autopilot/setup"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700"
          >
            ➕ Eerste Site Toevoegen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                ⚡ WordPress Autopilot Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Beheer al je WordPress sites met automatische content generatie
              </p>
            </div>
            <Link
              href="/admin/wordpress-autopilot/setup"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              ➕ Nieuwe Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sites Sidebar */}
          <div className="col-span-3">
            <div className="bg-slate-900 rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-white mb-4">Jouw Sites</h3>
              <div className="space-y-2">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSite?.id === site.id
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-slate-800 border border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-medium text-white">{site.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{site.siteUrl}</div>
                    <div className="flex items-center mt-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          site.status === 'active'
                            ? 'bg-green-500'
                            : site.status === 'paused'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        {site.status === 'active' ? 'Actief' : site.status === 'paused' ? 'Gepauzeerd' : 'Error'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {selectedSite && (
              <>
                {/* Site Header */}
                <div className="bg-slate-900 rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedSite.name}</h2>
                      <p className="text-gray-600">{selectedSite.siteUrl}</p>
                    </div>
                    <button
                      onClick={() => toggleAutopilot(selectedSite.id, selectedSite.status)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedSite.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedSite.status === 'active' ? '⏸️ Pauzeer' : '▶️ Start'}
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                {metrics && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900 rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Totaal Posts</div>
                      <div className="text-2xl font-bold text-white">{metrics.totalPosts}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Deze Maand</div>
                      <div className="text-2xl font-bold text-white">{metrics.postsThisMonth}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Gem. Woorden</div>
                      <div className="text-2xl font-bold text-white">{metrics.averageWordCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg shadow-sm p-4">
                      <div className="text-sm text-gray-600">Authority Score</div>
                      <div className="text-2xl font-bold text-white">
                        {metrics.topicalAuthorityScore}%
                      </div>
                    </div>
                  </div>
                )}

                {/* View Tabs */}
                <div className="bg-slate-900 rounded-lg shadow-sm mb-6">
                  <div className="border-b border-slate-700">
                    <div className="flex">
                      {[
                        { id: 'overview', label: '📊 Overzicht', icon: '📊' },
                        { id: 'content', label: '📝 Content', icon: '📝' },
                        { id: 'performance', label: '📈 Performance', icon: '📈' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setView(tab.id as any)}
                          className={`px-6 py-3 font-medium ${
                            view === tab.id
                              ? 'border-b-2 border-blue-600 text-blue-600'
                              : 'text-gray-600 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Overview Tab */}
                    {view === 'overview' && metrics && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold mb-4">Recente Content</h3>
                          <div className="space-y-2">
                            {metrics.recentPosts.slice(0, 5).map((post: any) => (
                              <div key={post.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-white">{post.title}</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(post.publishedAt).toLocaleDateString('nl-NL')}
                                  </div>
                                </div>
                                {post.url && (
                                  <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    Bekijken →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-4">Content Coverage</h3>
                          <div className="bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Topical Authority</span>
                              <span className="text-sm font-bold text-white">
                                {metrics.contentCoverage.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-3">
                              <div
                                className="bg-blue-600 rounded-full h-3 transition-all"
                                style={{ width: `${metrics.contentCoverage.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content Tab */}
                    {view === 'content' && (
                      <div>
                        {contentLoading ? (
                          <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {content.map((item) => (
                              <div key={item.id} className="border border-slate-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-white">{item.title}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      {item.focusKeyword} • {new Date(item.scheduledDate).toLocaleDateString('nl-NL')}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'published'
                                          ? 'bg-green-100 text-green-700'
                                          : item.status === 'scheduled'
                                          ? 'bg-blue-100 text-blue-700'
                                          : item.status === 'generating'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : item.status === 'failed'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-slate-800/50 text-slate-300'
                                      }`}
                                    >
                                      {item.status === 'published' && '✓ Gepubliceerd'}
                                      {item.status === 'scheduled' && '📅 Gepland'}
                                      {item.status === 'generating' && '⏳ Bezig...'}
                                      {item.status === 'generated' && '✓ Gegenereerd'}
                                      {item.status === 'failed' && '✗ Mislukt'}
                                    </span>
                                    {item.status === 'scheduled' && (
                                      <button
                                        onClick={() => generateContent(item.id)}
                                        className="text-blue-600 hover:underline text-sm font-medium"
                                      >
                                        Nu Genereren
                                      </button>
                                    )}
                                    {item.publishedUrl && (
                                      <a
                                        href={item.publishedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        Bekijken →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {content.length === 0 && (
                              <div className="text-center py-12 text-gray-500">
                                Geen content gevonden
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Performance Tab */}
                    {view === 'performance' && metrics && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-bold mb-4">Content Groei</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600">Deze Week</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {metrics.postsThisWeek}
                              </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600">Deze Maand</div>
                              <div className="text-2xl font-bold text-green-600">
                                {metrics.postsThisMonth}
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <div className="text-sm text-gray-600">Totaal</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {metrics.totalPosts}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-4">Content Quality</h3>
                          <div className="bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300">Gem. Woordenaantal</span>
                              <span className="text-xl font-bold text-white">
                                {metrics.averageWordCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
