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

  useEffect(() => {
    fetchContent();
    fetchProjects();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/simplified/content');
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
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

        {/* Performance Dashboard Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 border border-blue-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">📊 Bekijk je Performance Metrics</h3>
              <p className="text-blue-200 text-sm">
                Krijg inzicht in je Google Search Console prestaties, alerts en AI-powered tips
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/performance'}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              Open Performance Dashboard →
            </button>
          </div>
        </div>

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : filteredContent.length === 0 ? (
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
      </div>
    </div>
  );
}
