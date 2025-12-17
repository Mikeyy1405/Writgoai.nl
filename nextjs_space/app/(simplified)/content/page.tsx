'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Filter, Calendar, Globe, ExternalLink, Loader2, RefreshCw, Edit, Eye } from 'lucide-react';

/**
 * CONTENT OVERZICHT PAGINA
 * 
 * Uitgebreid overzicht van ALLE content:
 * - Gegenereerde content (SavedContent)
 * - Gepubliceerde WordPress posts
 * - Herschrijf functie voor WordPress posts
 * 
 * Features:
 * - Zoekfunctie
 * - Filters (status, source, project, datum)
 * - Sorteer opties
 * - Content details
 * - Herschrijf modal
 */

interface ContentStats {
  total: number;
  generated: number;
  wordpress: number;
  draft: number;
  published: number;
  scheduled: number;
}

interface Content {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled';
  source: 'wordpress' | 'generated';
  url?: string;
  publishedDate?: string;
  createdAt?: string;
  wordCount?: number;
  projectId: string;
  projectName: string;
}

interface Project {
  id: string;
  name: string;
  websiteUrl?: string;
}

export default function ContentOverviewPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'generated' | 'wordpress'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [rewriteOptions, setRewriteOptions] = useState({
    improveSeo: true,
    addInternalLinks: true,
    makeLonger: false,
    improveStructure: true,
  });
  const [rewriteLoading, setRewriteLoading] = useState(false);
  
  // GSC Performance Data
  const [gscData, setGscData] = useState<Record<string, any>>({});
  const [gscLoading, setGscLoading] = useState(false);
  const [gscStats, setGscStats] = useState({
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Content Page] ========== MOUNT ==========');
    console.log('[Content Page] Timestamp:', new Date().toISOString());
    
    fetchContent();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectFilter && projectFilter !== 'all') {
      fetchGSCData(projectFilter);
    }
  }, [projectFilter]);

  const fetchContent = async () => {
    try {
      console.log('[Content Page] Loading content...');
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log('[Content Page] Fetching from /api/simplified/content...');
      
      const res = await fetch('/api/simplified/content');
      const duration = Date.now() - startTime;
      
      console.log(`[Content Page] API response in ${duration}ms`);
      console.log('[Content Page] Response status:', res.status);
      console.log('[Content Page] Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Content Page] ❌ API error response:', errorText);
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('[Content Page] API data received:', {
        success: data.success,
        contentLength: data.content?.length,
        stats: data.stats
      });
      console.log('[Content Page] Full API response:', data);
      
      if (!data.success) {
        console.error('[Content Page] ❌ API returned error:', data.error);
        throw new Error(data.error || 'Unknown error');
      }
      
      console.log(`[Content Page] ✅ Loaded ${data.content?.length || 0} items`);
      
      setContent(data.content || []);
      setStats(data.stats || null);
      setLoading(false);
      
    } catch (err) {
      console.error('[Content Page] ❌ Error loading content:', err);
      console.error('[Content Page] Error type:', err?.constructor?.name);
      console.error('[Content Page] Error message:', err instanceof Error ? err.message : 'Unknown');
      console.error('[Content Page] Error stack:', err instanceof Error ? err.stack : 'No stack');
      
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchGSCData = async (projectId: string) => {
    setGscLoading(true);
    try {
      const res = await fetch(`/api/client/gsc/performance?projectId=${projectId}&days=30&limit=100`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.success && data.topUrls) {
          // Map GSC data by URL
          const mapped: Record<string, any> = {};
          let totalClicks = 0;
          let totalImpressions = 0;
          let totalCtr = 0;
          let totalPosition = 0;
          let count = 0;
          
          data.topUrls.forEach((item: any) => {
            mapped[item.url] = item;
            totalClicks += item.clicks || 0;
            totalImpressions += item.impressions || 0;
            totalCtr += item.ctr || 0;
            totalPosition += item.position || 0;
            count++;
          });
          
          setGscData(mapped);
          setGscStats({
            totalClicks,
            totalImpressions,
            avgCtr: count > 0 ? totalCtr / count : 0,
            avgPosition: count > 0 ? totalPosition / count : 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching GSC data:', error);
    } finally {
      setGscLoading(false);
    }
  };

  const handleRewriteClick = (item: Content) => {
    setSelectedContent(item);
    setRewriteModalOpen(true);
  };

  const handleRewrite = async () => {
    if (!selectedContent) return;

    setRewriteLoading(true);
    try {
      const res = await fetch('/api/simplified/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl: selectedContent.url,
          projectId: selectedContent.projectId,
          improvements: Object.entries(rewriteOptions)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('✅ Content herschreven! Je kunt het nu bewerken en publiceren.');
        setRewriteModalOpen(false);
        fetchContent(); // Refresh list
      } else {
        const error = await res.json();
        alert(`❌ Fout bij herschrijven: ${error.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error rewriting:', error);
      alert('❌ Er is een fout opgetreden');
    } finally {
      setRewriteLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== 'all' && item.source !== sourceFilter) {
      return false;
    }

    // Project/Website filter
    if (projectFilter !== 'all' && item.projectId !== projectFilter) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.publishedDate || a.createdAt || 0);
      const dateB = new Date(b.publishedDate || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      
      // Gebruik een consistent formaat dat server en client hetzelfde weergeven
      // Format: "17 december 2025, 12:09"
      const day = date.getDate();
      const months = [
        'januari', 'februari', 'maart', 'april', 'mei', 'juni',
        'juli', 'augustus', 'september', 'oktober', 'november', 'december'
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (error) {
      return '-';
    }
  };

  const getStatusBadge = (status: 'draft' | 'published' | 'scheduled') => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
          ✓ Gepubliceerd
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
          🕐 Gepland
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
        ⏳ Concept
      </span>
    );
  };

  const getSourceBadge = (source: 'wordpress' | 'generated') => {
    if (source === 'wordpress') {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
          WordPress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
        Gegenereerd
      </span>
    );
  };

  const getActionButton = (item: Content) => {
    if (item.source === 'wordpress' && item.status === 'published') {
      return (
        <button
          onClick={() => handleRewriteClick(item)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Herschrijven
        </button>
      );
    }
    if (item.source === 'generated' && item.status === 'draft') {
      return (
        <button
          onClick={() => window.location.href = `/schrijven?edit=${item.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Edit className="w-4 h-4" />
          Bewerken
        </button>
      );
    }
    if (item.url) {
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          Bekijken
        </a>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto" />
          <div>
            <p className="text-white text-xl font-semibold">Content laden...</p>
            <p className="text-slate-400 text-sm mt-2">Een moment geduld</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-8 max-w-md">
          <h2 className="text-red-500 text-2xl font-bold mb-4">❌ Fout</h2>
          <p className="text-white mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchContent}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Probeer Opnieuw
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Terug naar Dashboard
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-black/50 rounded-lg">
              <p className="text-xs text-slate-400">Development Mode - Check console for details</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-500 mb-2">
            📄 Content Overzicht
          </h1>
          <p className="text-slate-200">Al je gegenereerde artikelen op één plek</p>
        </div>

        {/* Google Search Console Performance (only show if project selected) */}
        {projectFilter && projectFilter !== 'all' && (
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 border border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">📊 Google Search Console Performance</h3>
                <p className="text-blue-200 text-sm">Laatste 30 dagen - Selecteer een website om metrics te zien</p>
              </div>
              {gscLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              )}
            </div>
            
            {Object.keys(gscData).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-1">Totaal Clicks</div>
                  <div className="text-white text-2xl font-bold">{gscStats.totalClicks.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-1">Impressions</div>
                  <div className="text-white text-2xl font-bold">{gscStats.totalImpressions.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-1">Gem. CTR</div>
                  <div className="text-white text-2xl font-bold">{(gscStats.avgCtr * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-1">Gem. Positie</div>
                  <div className="text-white text-2xl font-bold">{gscStats.avgPosition.toFixed(1)}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <p className="text-blue-200">
                  {gscLoading ? 'Laden...' : 'Geen GSC data beschikbaar. Verbind je Google Search Console om performance metrics te zien.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm mb-1">Totaal</p>
                <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm mb-1">Gegenereerd</p>
                <p className="text-3xl font-bold text-blue-400">{stats?.generated || 0}</p>
              </div>
              <div className="text-3xl">✨</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm mb-1">WordPress</p>
                <p className="text-3xl font-bold text-orange-400">{stats?.wordpress || 0}</p>
              </div>
              <Globe className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm mb-1">Gepubliceerd</p>
                <p className="text-3xl font-bold text-green-400">{stats?.published || 0}</p>
              </div>
              <div className="text-3xl">✓</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-200 text-sm mb-1">Concepten</p>
                <p className="text-3xl font-bold text-orange-400">{stats?.draft || 0}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek artikelen..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Website/Project Filter */}
            <div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Alle websites ({content.length})</option>
                {projects.map(project => {
                  const projectContentCount = content.filter(c => c.projectId === project.id).length;
                  return (
                    <option key={project.id} value={project.id}>
                      {project.name || project.websiteUrl} ({projectContentCount})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Alle bronnen</option>
                <option value="generated">Gegenereerd</option>
                <option value="wordpress">WordPress</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Alle status</option>
                <option value="published">Gepubliceerd</option>
                <option value="draft">Concepten</option>
                <option value="scheduled">Gepland</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="date">Sorteer op datum</option>
                <option value="title">Sorteer op titel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content List */}
        {filteredContent.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Geen resultaten' : 'Nog geen content'}
            </h3>
            <p className="text-slate-200">
              {searchQuery || statusFilter !== 'all' 
                ? 'Probeer een andere zoekopdracht of filter' 
                : 'Ga naar het dashboard om je eerste artikel te maken'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-orange-500 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {item.title}
                        </h3>
                        {getSourceBadge(item.source)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Globe className="w-4 h-4" />
                          <span>{item.projectName}</span>
                        </div>
                        {item.wordCount && (
                          <span className="text-slate-200">
                            📝 {item.wordCount} woorden
                          </span>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Bekijk live
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-200">
                      {item.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Gemaakt: {formatDate(item.createdAt)}</span>
                        </div>
                      )}
                      {item.publishedDate && (
                        <div className="flex items-center gap-2">
                          <span>Gepubliceerd: {formatDate(item.publishedDate)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* GSC Performance Metrics (if available for this URL) */}
                    {item.url && gscData[item.url] && (
                      <div className="flex items-center gap-4 text-sm pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-blue-300">
                          <span className="font-semibold">Clicks:</span>
                          <span>{gscData[item.url].clicks?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-300">
                          <span className="font-semibold">Impressions:</span>
                          <span>{gscData[item.url].impressions?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-300">
                          <span className="font-semibold">CTR:</span>
                          <span>{((gscData[item.url].ctr || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Positie:</span>
                          <span className={`font-bold ${
                            gscData[item.url].position <= 3 ? 'text-green-400' : 
                            gscData[item.url].position <= 10 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            #{gscData[item.url].position?.toFixed(1) || '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(item.status)}
                    {getActionButton(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Herschrijf Modal */}
        {rewriteModalOpen && selectedContent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                🔄 Artikel Herschrijven
              </h2>
              <p className="text-slate-200 mb-6">
                Herschrijf "{selectedContent.title}" met AI-verbeteringen
              </p>

              <div className="space-y-4 mb-8">
                <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={rewriteOptions.improveSeo}
                    onChange={(e) => setRewriteOptions({ ...rewriteOptions, improveSeo: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-white font-medium">Verbeter SEO</div>
                    <div className="text-sm text-slate-200">Optimaliseer voor betere rankings</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={rewriteOptions.addInternalLinks}
                    onChange={(e) => setRewriteOptions({ ...rewriteOptions, addInternalLinks: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-white font-medium">Voeg Interne Links Toe</div>
                    <div className="text-sm text-slate-200">Link naar gerelateerde content</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={rewriteOptions.makeLonger}
                    onChange={(e) => setRewriteOptions({ ...rewriteOptions, makeLonger: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-white font-medium">Maak Langer</div>
                    <div className="text-sm text-slate-200">Voeg 500-1000 woorden toe</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={rewriteOptions.improveStructure}
                    onChange={(e) => setRewriteOptions({ ...rewriteOptions, improveStructure: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-white font-medium">Verbeter Structuur</div>
                    <div className="text-sm text-slate-200">Betere kopjes en paragrafen</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setRewriteModalOpen(false)}
                  disabled={rewriteLoading}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleRewrite}
                  disabled={rewriteLoading}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {rewriteLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Herschrijven...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Herschrijven
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              🐛 Debug Info
              <span className="text-xs text-slate-400">(alleen zichtbaar in development)</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">Content Stats</div>
                <pre className="text-slate-300 text-xs overflow-auto">
                  {JSON.stringify({ 
                    totalContent: content.length,
                    filteredContent: filteredContent.length,
                    stats,
                    filters: {
                      search: searchQuery || 'none',
                      status: statusFilter,
                      source: sourceFilter,
                      project: projectFilter
                    }
                  }, null, 2)}
                </pre>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">Sample Content Items (first 2)</div>
                <pre className="text-slate-300 text-xs overflow-auto max-h-60">
                  {JSON.stringify(content.slice(0, 2), null, 2)}
                </pre>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">Actions</div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchContent}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                  >
                    Refresh Content
                  </button>
                  <button
                    onClick={() => console.log('Current state:', { content, stats, filters: { searchQuery, statusFilter, sourceFilter, projectFilter } })}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    Log State to Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
