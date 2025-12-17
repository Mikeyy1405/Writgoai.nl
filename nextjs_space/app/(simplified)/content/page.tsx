'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Filter, Calendar, Globe, ExternalLink, Loader2 } from 'lucide-react';

/**
 * CONTENT OVERZICHT PAGINA
 * 
 * Uitgebreid overzicht van alle gegenereerde content met:
 * - Zoekfunctie
 * - Filters (status, project, datum)
 * - Sorteer opties
 * - Content details
 */

interface Content {
  id: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  wordCount?: number;
  project?: {
    id: string;
    name: string;
    websiteUrl?: string | null;
  };
}

export default function ContentOverviewPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/simplified/content');
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter === 'published' && !item.publishedAt) {
      return false;
    }
    if (statusFilter === 'draft' && item.publishedAt) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (publishedAt: string | null) => {
    if (publishedAt) {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
          ✓ Gepubliceerd
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
        ⏳ Concept
        </span>
    );
  };

  const publishedCount = content.filter(c => c.publishedAt).length;
  const draftCount = content.length - publishedCount;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
            📄 Content Overzicht
          </h1>
          <p className="text-gray-400">Al je gegenereerde artikelen op één plek</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Totaal Artikelen</p>
                <p className="text-3xl font-bold text-white">{content.length}</p>
              </div>
              <FileText className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Gepubliceerd</p>
                <p className="text-3xl font-bold text-green-400">{publishedCount}</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Concepten</p>
                <p className="text-3xl font-bold text-orange-400">{draftCount}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek artikelen..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
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
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Geen resultaten' : 'Nog geen content'}
            </h3>
            <p className="text-gray-500">
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
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {item.project && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Globe className="w-4 h-4" />
                            <span>{item.project.name}</span>
                            {item.project.websiteUrl && (
                              <a
                                href={item.project.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                        {item.wordCount && (
                          <span className="text-gray-400">
                            📝 {item.wordCount} woorden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Gemaakt: {formatDate(item.createdAt)}</span>
                      </div>
                      {item.publishedAt && (
                        <div className="flex items-center gap-2">
                          <span>Gepubliceerd: {formatDate(item.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getStatusBadge(item.publishedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
