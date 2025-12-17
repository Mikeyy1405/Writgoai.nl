/**
 * Simpele Artikel Lijst View
 * 
 * Toont ALLE artikelen met:
 * - DataForSEO metrics
 * - Intent
 * - Woord count
 * - Status
 * - Filters en sorting
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Search, Filter } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  focusKeyword: string;
  keywords: string[];
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  articleType: string;
  targetWordCount: number;
  priority: number;
  pillar: string | null;
  subtopic: string | null;
  status: string;
  publishedUrl: string | null;
}

export default function TopicalAuthorityListPage() {
  const router = useRouter();
  const params = useParams();
  const mapId = params.mapId as string;

  const [articles, setArticles] = useState<Article[]>([]);
  const [map, setMap] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filter, setFilter] = useState('all'); // all, planned, generated, published
  const [sortBy, setSortBy] = useState('volume'); // volume, difficulty, title, priority
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, with-pillar, without-pillar
  
  // Bulk actions
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, [mapId]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/topical-authority/${mapId}/articles`);
      const data = await response.json();
      
      if (data.success) {
        setMap(data.map);
        setArticles(data.articles);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateArticle = async (articleId: string) => {
    // Redirect to auto-generate page for cleaner UX and better error handling
    console.log('[Topical Authority List] Redirecting to generate page for article:', articleId);
    router.push(`/topical-authority/generate/${articleId}`);
  };

  const generateAllArticles = async () => {
    const plannedArticles = filteredAndSortedArticles.filter(a => a.status === 'planned');
    
    if (plannedArticles.length === 0) {
      alert('Geen geplande artikelen om te genereren');
      return;
    }
    
    if (!confirm(`Weet je zeker dat je ${plannedArticles.length} artikelen wilt genereren? Dit opent ze één voor één.`)) {
      return;
    }
    
    // Open the first article
    if (plannedArticles.length > 0) {
      generateArticle(plannedArticles[0].id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!map || articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2 text-red-900">
            ⚠️ Geen Artikelen Gevonden
          </h2>
          <p className="text-red-700 mb-4">
            Er zijn geen geplande artikelen gevonden voor deze map.
          </p>
          <button
            onClick={() => router.push('/topical-authority')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            ← Terug naar Overzicht
          </button>
        </div>
      </div>
    );
  }

  // Filter articles
  let filteredArticles = articles;
  
  // Status filter
  if (filter !== 'all') {
    filteredArticles = filteredArticles.filter(article => article.status === filter);
  }
  
  // Category filter
  if (categoryFilter === 'with-pillar') {
    filteredArticles = filteredArticles.filter(article => article.pillar !== null);
  } else if (categoryFilter === 'without-pillar') {
    filteredArticles = filteredArticles.filter(article => article.pillar === null);
  }
  
  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredArticles = filteredArticles.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.focusKeyword.toLowerCase().includes(query) ||
      article.keywords.some(k => k.toLowerCase().includes(query))
    );
  }

  // Sort articles
  const filteredAndSortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'volume') return b.searchVolume - a.searchVolume;
    if (sortBy === 'difficulty') return a.difficulty - b.difficulty;
    if (sortBy === 'priority') return b.priority - a.priority;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{map.niche}</h1>
            <p className="text-gray-600">
              {map.projectName} • Simpele Artikel Lijst
            </p>
          </div>
          <button
            onClick={generateAllArticles}
            disabled={stats.planned === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              stats.planned > 0
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚀 Start met Genereren
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
            <div className="text-orange-600 text-2xl font-bold">
              {stats.total}
            </div>
            <div className="text-gray-600 text-sm">Totaal</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="text-blue-600 text-2xl font-bold">
              {stats.planned}
            </div>
            <div className="text-gray-600 text-sm">Gepland</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <div className="text-purple-600 text-2xl font-bold">
              {stats.generated}
            </div>
            <div className="text-gray-600 text-sm">Gegenereerd</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <div className="text-green-600 text-2xl font-bold">
              {stats.published}
            </div>
            <div className="text-gray-600 text-sm">Gepubliceerd</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <div className="text-gray-600 text-2xl font-bold">
              {stats.withPillar}/{stats.total}
            </div>
            <div className="text-gray-600 text-sm">Met Categorie</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op titel, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 self-center">Status:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alle ({stats.total})
              </button>
              <button
                onClick={() => setFilter('planned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'planned' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gepland ({stats.planned})
              </button>
              <button
                onClick={() => setFilter('generated')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'generated' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gegenereerd ({stats.generated})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'published' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gepubliceerd ({stats.published})
              </button>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-600 self-center">Sorteer:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="volume">Search Volume (hoog → laag)</option>
                <option value="difficulty">Difficulty (laag → hoog)</option>
                <option value="priority">Priority (hoog → laag)</option>
                <option value="title">Titel (A → Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Articles List */}
      <div className="space-y-3">
        {filteredAndSortedArticles.length === 0 && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600">Geen artikelen gevonden met de huidige filters.</p>
          </div>
        )}
        
        {filteredAndSortedArticles.map((article, index) => (
          <div
            key={article.id}
            className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-400 text-sm font-mono">
                    #{index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">
                    {article.title}
                  </h3>
                  <span className={`
                    px-2 py-1 rounded-lg text-xs font-medium
                    ${article.intent === 'informational' ? 'bg-blue-100 text-blue-700' : ''}
                    ${article.intent === 'commercial' ? 'bg-green-100 text-green-700' : ''}
                    ${article.intent === 'transactional' ? 'bg-purple-100 text-purple-700' : ''}
                    ${article.intent === 'navigational' ? 'bg-yellow-100 text-yellow-700' : ''}
                  `}>
                    {article.intent}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
                  <div className="text-gray-600">
                    🔑 <span className="text-primary font-medium">{article.focusKeyword}</span>
                  </div>
                  <div className="text-gray-600">
                    📊 <span className="font-medium">{article.searchVolume.toLocaleString()}</span> searches/maand
                  </div>
                  <div className="text-gray-600">
                    💪 Difficulty: <span className="font-medium">{article.difficulty}/100</span>
                  </div>
                  <div className="text-gray-600">
                    📝 <span className="font-medium">{article.targetWordCount}</span> woorden
                  </div>
                  <div className="text-gray-600">
                    ⭐ Priority: <span className="font-medium">{article.priority}/10</span>
                  </div>
                </div>
                
                {article.pillar && (
                  <div className="text-gray-500 text-xs">
                    📁 {article.pillar} {article.subtopic && `→ ${article.subtopic}`}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => generateArticle(article.id)}
                disabled={article.status !== 'planned' || generatingId === article.id}
                className={`
                  px-6 py-3 rounded-lg font-medium whitespace-nowrap flex items-center gap-2
                  ${article.status === 'planned' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {generatingId === article.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {article.status === 'planned' && '🚀 Genereer'}
                {article.status === 'generating' && '⏳ Bezig...'}
                {article.status === 'generated' && '✅ Gegenereerd'}
                {article.status === 'published' && '📤 Gepubliceerd'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}