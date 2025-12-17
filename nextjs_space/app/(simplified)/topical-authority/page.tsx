/**
 * Topical Authority Dashboard - FIXED VERSION
 * - Shows article list directly when maps exist
 * - Black/Orange/White theme
 * - Automatic year replacement (2024 -> current year)
 * - Sentence case titles (not Title Case)
 * - Fixed JSON parse errors
 * - Fixed clientId handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Map, Globe, Search, ArrowLeft, Zap } from 'lucide-react';

export default function TopicalAuthorityDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [maps, setMaps] = useState<any[]>([]);
  const [selectedMap, setSelectedMap] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  
  // Filters
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('volume');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMaps();
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedMap) {
      loadArticles();
    }
  }, [selectedMap]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/simplified/projects');
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('API returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setProjects(data.data);
        setSelectedProjectId(data.data[0].id);
      }
    } catch (error: any) {
      console.error('[Projects] Error:', error);
      setError(`Kon projecten niet laden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMaps = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/client/topical-authority/maps?projectId=${selectedProjectId}`);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Maps] Got HTML instead of JSON:', text.substring(0, 200));
        throw new Error('API returned HTML instead of JSON');
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setMaps(data.data);
        // Auto-select first/newest map
        setSelectedMap(data.data[0]);
      } else {
        setMaps([]);
        setSelectedMap(null);
        setArticles([]);
        setStats(null);
      }
    } catch (error: any) {
      console.error('[Maps] Error:', error);
      setError(`Kon maps niet laden: ${error.message}`);
    }
  };

  const loadArticles = async () => {
    if (!selectedMap) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/client/topical-authority/${selectedMap.id}/articles`);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Articles] Got HTML instead of JSON:', text.substring(0, 200));
        throw new Error('API returned HTML instead of JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Fix titles: replace years and convert to sentence case
        const fixedArticles = data.articles.map((article: any) => ({
          ...article,
          title: fixArticleTitle(article.title)
        }));
        
        setArticles(fixedArticles);
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error('[Articles] Error:', error);
      setError(`Kon artikelen niet laden: ${error.message}`);
    }
  };

  /**
   * Fix article titles:
   * 1. Replace old years (2024, 2025) with current year
   * 2. Convert from Title Case to sentence case
   */
  function fixArticleTitle(title: string): string {
    const currentYear = new Date().getFullYear();
    
    // Replace years 2024 and 2025 with current year
    let fixed = title.replace(/\b202[45]\b/g, currentYear.toString());
    
    // Convert to sentence case
    fixed = toSentenceCase(fixed);
    
    return fixed;
  }

  /**
   * Convert Title Case to sentence case
   * "Beste Puppy Brokken 2024" -> "Beste puppy brokken 2026"
   */
  function toSentenceCase(text: string): string {
    // Split by colon for titles like "Title: Subtitle"
    const parts = text.split(':');
    
    return parts.map((part, index) => {
      // Trim whitespace
      part = part.trim();
      
      // First character uppercase, rest lowercase
      let result = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      
      // Preserve uppercase for specific words/acronyms
      const preserveWords = ['seo', 'ai', 'wordpress', 'vs', 'diy', 'faq', 'ceo', 'api', 'html', 'css', 'js'];
      preserveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, word.toUpperCase());
      });
      
      return result;
    }).join(': ');
  }

  const generateArticle = async (articleId: string) => {
    try {
      setGeneratingId(articleId);
      setError(null);
      
      const response = await fetch('/api/client/topical-authority/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Generate] Got HTML instead of JSON:', text.substring(0, 200));
        throw new Error('API returned HTML instead of JSON. Check if route exists.');
      }

      const data = await response.json();

      if (data.success) {
        const articleData = data.data;
        // Redirect to schrijven page with pre-filled data
        router.push(`/client-portal/schrijven?fromTopicalAuthority=true&articleId=${articleId}&title=${encodeURIComponent(articleData.title)}`);
      } else {
        throw new Error(data.details || data.error || 'Genereren mislukt');
      }
    } catch (error: any) {
      console.error('[Generate] Error:', error);
      setError(error.message);
      alert(`❌ Fout: ${error.message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCancelMap = async (mapId: string) => {
    if (!confirm('Weet je zeker dat je deze generatie wilt annuleren?')) {
      return;
    }
    
    try {
      setCancellingId(mapId);
      setError(null);
      
      const response = await fetch('/api/client/topical-authority/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Generatie geannuleerd');
        // Refresh maps
        await loadMaps();
      } else {
        throw new Error(data.error || 'Annuleren mislukt');
      }
    } catch (error: any) {
      console.error('[Cancel] Error:', error);
      setError(error.message);
      alert(`❌ Fout: ${error.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Weet je zeker dat je deze map wilt verwijderen? Dit kan niet ongedaan worden gemaakt.\n\nAlle artikelen in deze map worden ook verwijderd.')) {
      return;
    }
    
    try {
      setDeletingId(mapId);
      setError(null);
      
      const response = await fetch(`/api/client/topical-authority/delete?mapId=${mapId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Map verwijderd (${data.data.deletedArticles} artikelen)`);
        // Clear selected map if it was deleted
        if (selectedMap?.id === mapId) {
          setSelectedMap(null);
          setArticles([]);
          setStats(null);
        }
        // Refresh maps
        await loadMaps();
      } else {
        throw new Error(data.error || 'Verwijderen mislukt');
      }
    } catch (error: any) {
      console.error('[Delete] Error:', error);
      setError(error.message);
      alert(`❌ Fout: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      if (filter !== 'all' && article.status !== filter) return false;
      if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return (b.searchVolume || 0) - (a.searchVolume || 0);
      if (sortBy === 'difficulty') return (a.difficulty || 0) - (b.difficulty || 0);
      if (sortBy === 'priority') return (b.priority || 0) - (a.priority || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen">
        <div className="max-w-2xl mx-auto text-center">
          <Globe className="w-16 h-16 mx-auto text-slate-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-white">Geen WordPress sites</h1>
          <p className="text-slate-400 mb-6">Voeg eerst een WordPress site toe op het dashboard om te beginnen met content planning.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Naar dashboard
          </button>
        </div>
      </div>
    );
  }

  // If we have a selected map with articles, show the article list DIRECTLY
  if (selectedMap && articles.length > 0 && stats) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header - BLACK/ORANGE/WHITE Theme */}
          <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {selectedMap.niche}
                </h1>
                <p className="text-slate-400">
                  {projects.find(p => p.id === selectedProjectId)?.name || selectedMap.projectName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedMap(null);
                    setArticles([]);
                    setStats(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
                >
                  ← Terug
                </button>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {/* Stats - BLACK/ORANGE/WHITE */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-orange-500 text-3xl font-bold mb-1">
                  {stats.total}
                </div>
                <div className="text-slate-400 text-sm">Totaal</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-blue-400 text-3xl font-bold mb-1">
                  {stats.planned}
                </div>
                <div className="text-slate-400 text-sm">Gepland</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-yellow-400 text-3xl font-bold mb-1">
                  {stats.generating}
                </div>
                <div className="text-slate-400 text-sm">Bezig</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-green-400 text-3xl font-bold mb-1">
                  {stats.generated}
                </div>
                <div className="text-slate-400 text-sm">Gegenereerd</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-purple-400 text-3xl font-bold mb-1">
                  {stats.published}
                </div>
                <div className="text-slate-400 text-sm">Gepubliceerd</div>
              </div>
            </div>
          </div>
          
          {/* Filters - BLACK/ORANGE/WHITE */}
          <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-800">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Zoek op titel, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Alle ({stats.total})</option>
                  <option value="planned">Gepland ({stats.planned})</option>
                  <option value="generating">Bezig ({stats.generating})</option>
                  <option value="generated">Gegenereerd ({stats.generated})</option>
                  <option value="published">Gepubliceerd ({stats.published})</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="volume">Search volume (hoog → laag)</option>
                  <option value="priority">Priority (hoog → laag)</option>
                  <option value="difficulty">Difficulty (laag → hoog)</option>
                  <option value="title">Titel (A → Z)</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              {filteredArticles.length} van {articles.length} artikelen
            </div>
          </div>
          
          {/* Articles List - BLACK/ORANGE/WHITE */}
          <div className="space-y-3">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-slate-400">Geen artikelen gevonden met deze filters</p>
              </div>
            ) : (
              filteredArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-slate-500 text-sm font-mono flex-shrink-0">
                          #{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-2 break-words">
                            {article.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">🔑</span>
                              <span className="text-orange-400 font-medium">{article.focusKeyword}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">📊</span>
                              <span className="text-white font-medium">{(article.searchVolume || 0).toLocaleString()}</span>
                              <span className="text-slate-500">searches/mo</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">💪</span>
                              <span className="text-white">Difficulty: {article.difficulty || 0}/100</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">📝</span>
                              <span className="text-white">{article.targetWordCount || 1500} woorden</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">⭐</span>
                              <span className="text-white">Priority: {article.priority || 5}/10</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`
                              px-2 py-1 rounded text-xs font-medium
                              ${article.intent === 'informational' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                              ${article.intent === 'commercial' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                              ${article.intent === 'transactional' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                              ${article.intent === 'navigational' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                            `}>
                              {article.intent || 'informational'}
                            </span>
                            {article.pillar && (
                              <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                {article.pillar}
                              </span>
                            )}
                            {article.subtopic && (
                              <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">
                                {article.subtopic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => generateArticle(article.id)}
                      disabled={article.status !== 'planned' || generatingId !== null}
                      className={`
                        flex-shrink-0 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all
                        ${article.status === 'planned' && generatingId === null
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }
                      `}
                    >
                      {generatingId === article.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Bezig...
                        </>
                      ) : article.status === 'planned' ? (
                        <>
                          <Zap className="w-4 h-4" />
                          Genereer
                        </>
                      ) : article.status === 'generating' ? (
                        '🔄 Bezig'
                      ) : article.status === 'generated' ? (
                        '✅ Gegenereerd'
                      ) : article.status === 'published' ? (
                        '📤 Gepubliceerd'
                      ) : (
                        article.status
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show map overview or create wizard
  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">Topical Authority</h1>
              <p className="text-slate-400">Bouw complete topical authority met 400-500 gestructureerde artikelen</p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-5 h-5" />
              Nieuwe map
            </button>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-4 border border-slate-800">
            <label className="text-sm font-medium text-white">WordPress site:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Wizard Modal */}
        {showCreateWizard && (
          <CreateMapWizard
            projectId={selectedProjectId}
            onClose={() => setShowCreateWizard(false)}
            onSuccess={() => {
              setShowCreateWizard(false);
              loadMaps();
            }}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Maps Grid */}
        {maps.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
            <Map className="w-16 h-16 mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Geen topical authority maps</h2>
            <p className="text-slate-400 mb-6">Creëer je eerste topical authority map om te beginnen met professionele content planning.</p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-lg shadow-orange-500/20"
            >
              Creëer eerste map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map: any) => (
              <MapCard
                key={map.id}
                map={map}
                onClick={() => setSelectedMap(map)}
                onCancel={handleCancelMap}
                onDelete={handleDeleteMap}
                isCancelling={cancellingId === map.id}
                isDeleting={deletingId === map.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Map Card Component - BLACK/ORANGE/WHITE Theme
function MapCard({ 
  map, 
  onClick, 
  onCancel, 
  onDelete,
  isCancelling,
  isDeleting 
}: { 
  map: any; 
  onClick: () => void;
  onCancel: (mapId: string) => void;
  onDelete: (mapId: string) => void;
  isCancelling: boolean;
  isDeleting: boolean;
}) {
  const progress = Math.round((map.totalArticlesPublished / map.totalArticlesTarget) * 100) || 0;
  
  return (
    <div
      className="bg-slate-900 rounded-xl border-2 border-slate-800 p-6 transition-all shadow-lg hover:shadow-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div onClick={onClick} className="cursor-pointer flex-1">
          <h3 className="font-bold text-lg mb-1 text-white hover:text-orange-500 transition-colors">{map.niche}</h3>
          <p className="text-sm text-slate-400">{map.description}</p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            map.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            map.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            map.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            map.status === 'cancelled' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {map.status === 'active' ? 'Actief' : 
             map.status === 'completed' ? 'Voltooid' : 
             map.status === 'generating' ? '🔄 Bezig' :
             map.status === 'cancelled' ? 'Geannuleerd' : 
             'Concept'}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1">
            {map.status === 'generating' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(map.id);
                }}
                disabled={isCancelling}
                className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-500/30"
                title="Annuleer generatie"
              >
                {isCancelling ? '...' : '⏸️'}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(map.id);
              }}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
              title="Verwijder map"
            >
              {isDeleting ? '...' : '🗑️'}
            </button>
          </div>
        </div>
      </div>

      <div onClick={onClick} className="cursor-pointer space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Voortgang</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 border border-slate-700">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all shadow-lg shadow-orange-500/20"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{map.totalArticlesTarget || 0}</div>
            <div className="text-xs text-slate-400">Target</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{map.totalArticlesGenerated || 0}</div>
            <div className="text-xs text-slate-400">Gegenereerd</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{map.totalArticlesPublished || 0}</div>
            <div className="text-xs text-slate-400">Gepubliceerd</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Map Wizard Component - AUTOMATIC VERSION
function CreateMapWizard({ projectId, onClose, onSuccess }: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      console.log('[Create Wizard] Starting generation...');
      setLoading(true);
      setProgress(10);
      setStatus('🔍 Website analyseren...');
      setError('');
      
      // Simulate progress during analysis
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 500);
      
      console.log('[Create Wizard] Sending request to API...');
      const requestBody = {
        projectId,
        autoAnalyze: true,
        targetArticles: 450,
        useDataForSEO: true,
        analyzeExistingContent: true,
        location: 'Netherlands',
        language: 'nl',
      };
      console.log('[Create Wizard] Request body:', requestBody);
      
      const response = await fetch('/api/client/topical-authority/generate-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[Create Wizard] Response status:', response.status);
      console.log('[Create Wizard] Response headers:', Object.fromEntries(response.headers.entries()));

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      setProgress(95);
      setStatus('✅ Map genereren...');

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('[Create Wizard] Content-Type:', contentType);
      
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Create Wizard] ❌ Got HTML instead of JSON:', text.substring(0, 500));
        throw new Error('API returned HTML instead of JSON. De server heeft een fout geretourneerd.');
      }

      const data = await response.json();
      console.log('[Create Wizard] Response data:', data);

      if (data.success) {
        console.log('[Create Wizard] ✅ Success!');
        setProgress(100);
        setStatus(`✅ Klaar! ${data.data.totalArticles} artikelen gegenereerd`);
        setSuccess(true);
        
        // Auto-close after 2 seconds and redirect to the map
        setTimeout(() => {
          console.log('[Create Wizard] Redirecting...');
          onSuccess();
          onClose();
          // Navigate to the new map's article list (refresh the page to show the new map)
          if (data.data.mapId) {
            window.location.href = `/topical-authority`;
          }
        }, 2000);
      } else {
        console.error('[Create Wizard] ❌ API returned error:', data);
        setProgress(0);
        setStatus('');
        
        // Show detailed error with technical details if available
        const errorMessage = data.details || data.error || 'Onbekende fout';
        const technicalDetails = data.technicalDetails ? `\n\nTechnische details: ${data.technicalDetails}` : '';
        
        setError(errorMessage + technicalDetails);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[Create Wizard] ❌ Exception:', error);
      console.error('[Create Wizard] Error stack:', error.stack);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setProgress(0);
      setStatus('');
      
      // Provide more detailed error messages
      let errorMessage = error.message || 'Fout bij genereren map';
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Netwerk fout. Controleer je internetverbinding en probeer het opnieuw.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. De generatie duurt te lang. Probeer het opnieuw.';
      } else if (error.message.includes('HTML')) {
        errorMessage = 'Server fout. De API heeft een HTML pagina geretourneerd in plaats van JSON. Dit kan een routing probleem zijn.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Automatische topical authority map</h2>
          <p className="text-slate-400 mt-1">Genereer automatisch 400-500 gestructureerde artikelen voor je WordPress site</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              Automatische analyse & generatie
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Website wordt automatisch geanalyseerd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Niche wordt automatisch gedetecteerd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>400-500 artikelen worden gepland op basis van content gaps</span>
              </li>
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>DataForSEO keyword metrics worden toegevoegd</span>
              </li>
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Bestaande content wordt geanalyseerd voor internal links</span>
              </li>
            </ul>
          </div>

          {/* Expected Results */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-orange-400 font-medium mb-2 text-sm">Wat je krijgt:</h3>
            <ul className="space-y-1 text-slate-300 text-sm">
              <li>• 5-10 Pillar Topics (hoofdonderwerpen)</li>
              <li>• 40-50 Subtopics per pillar</li>
              <li>• 8-10 Artikelen per subtopic</li>
              <li>• Totaal: ~450 gestructureerde artikelen</li>
              <li>• Geschatte tijd: 12-15 maanden (1 artikel/dag)</li>
            </ul>
          </div>

          {/* Progress Display */}
          {loading && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{status}</p>
                <p className="text-slate-400 text-sm">{progress}%</p>
              </div>
              <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${success ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {success && (
                <p className="text-green-400 text-sm text-center">Je wordt doorgestuurd naar de artikellijst...</p>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm font-medium mb-1">❌ Fout bij genereren:</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Bezig met analyseren en genereren...
                </>
              ) : (
                <>
                  <span className="text-lg">🚀</span>
                  Analyseer & genereer map
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
