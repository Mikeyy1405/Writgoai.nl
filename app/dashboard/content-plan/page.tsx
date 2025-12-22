'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  website_url: string;
}

interface ContentIdea {
  id?: string;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  project_id?: string;
  contentType?: string;
  searchIntent?: string;
  cluster?: string;
  priority?: string;
  searchVolume?: number | null;
  competition?: string | null;
  competitionIndex?: number | null;
  cpc?: number | null;
}

interface ContentCluster {
  pillarTopic: string;
  pillarTitle: string;
  articleCount: number;
}

interface PlanStats {
  totalArticles: number;
  pillarPages: number;
  clusters: number;
  byContentType: Record<string, number>;
  dataForSEOEnriched: boolean;
}

export default function ContentPlanPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentIdea[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [niche, setNiche] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState(500);
  const [filterCluster, setFilterCluster] = useState<string>('all');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  useEffect(() => {
    loadProjects();
    loadSavedPlan();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError('Kon projecten niet laden');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Fout bij laden projecten');
    } finally {
      setLoading(false);
    }
  }

  function loadSavedPlan() {
    try {
      const saved = localStorage.getItem('contentPlan');
      const savedProject = localStorage.getItem('selectedProject');
      const savedClusters = localStorage.getItem('contentClusters');
      const savedStats = localStorage.getItem('contentStats');
      const savedNiche = localStorage.getItem('contentNiche');
      
      if (saved) setContentPlan(JSON.parse(saved));
      if (savedProject) setSelectedProject(JSON.parse(savedProject));
      if (savedClusters) setClusters(JSON.parse(savedClusters));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedNiche) setNiche(savedNiche);
    } catch (err) {
      console.error('Error loading saved plan:', err);
    }
  }

  async function generatePlan() {
    if (!selectedProject) {
      setError('Selecteer eerst een project!');
      return;
    }

    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/simple/generate-content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          website_url: selectedProject.website_url,
          target_count: targetCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (!data.plan || data.plan.length === 0) {
        throw new Error('Geen content ideeën ontvangen');
      }

      const plan = data.plan.map((idea: ContentIdea) => ({
        ...idea,
        project_id: selectedProject.id
      }));
      
      setContentPlan(plan);
      setClusters(data.clusters || []);
      setStats(data.stats || null);
      setNiche(data.niche || '');
      
      // Save to localStorage
      localStorage.setItem('contentPlan', JSON.stringify(plan));
      localStorage.setItem('selectedProject', JSON.stringify(selectedProject));
      localStorage.setItem('contentClusters', JSON.stringify(data.clusters || []));
      localStorage.setItem('contentStats', JSON.stringify(data.stats || null));
      localStorage.setItem('contentNiche', data.niche || '');
      
    } catch (err: any) {
      console.error('Plan error:', err);
      setError(err.message || 'Fout bij genereren content plan');
    } finally {
      setGenerating(false);
    }
  }

  function selectIdea(idea: ContentIdea) {
    localStorage.setItem('selectedIdea', JSON.stringify(idea));
    router.push('/dashboard/writer');
  }

  function clearPlan() {
    setContentPlan([]);
    setClusters([]);
    setStats(null);
    setNiche('');
    localStorage.removeItem('contentPlan');
    localStorage.removeItem('contentClusters');
    localStorage.removeItem('contentStats');
    localStorage.removeItem('contentNiche');
  }

  function exportPlan() {
    const csv = [
      ['Titel', 'Categorie', 'Beschrijving', 'Keywords', 'Type', 'Cluster', 'Prioriteit', 'Zoekvolume', 'Concurrentie'].join(','),
      ...contentPlan.map(idea => [
        `"${idea.title.replace(/"/g, '""')}"`,
        `"${idea.category}"`,
        `"${idea.description.replace(/"/g, '""')}"`,
        `"${idea.keywords.join(', ')}"`,
        `"${idea.contentType || ''}"`,
        `"${idea.cluster || ''}"`,
        `"${idea.priority || ''}"`,
        idea.searchVolume || '',
        idea.competition || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `content-plan-${selectedProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // Filter and sort content plan
  const filteredPlan = contentPlan
    .filter(idea => {
      if (filterCluster !== 'all' && idea.cluster !== filterCluster) return false;
      if (filterContentType !== 'all' && idea.contentType !== filterContentType) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'searchVolume':
          return (b.searchVolume || 0) - (a.searchVolume || 0);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
        case 'cluster':
          return (a.cluster || '').localeCompare(b.cluster || '');
        default:
          return 0;
      }
    });

  const contentTypeColors: Record<string, string> = {
    'pillar': 'from-purple-500 to-purple-600',
    'how-to': 'from-blue-500 to-blue-600',
    'guide': 'from-green-500 to-green-600',
    'comparison': 'from-orange-500 to-orange-600',
    'list': 'from-cyan-500 to-cyan-600',
    'case-study': 'from-amber-500 to-amber-600',
    'faq': 'from-pink-500 to-pink-600',
    'news': 'from-red-500 to-red-600',
  };

  const priorityColors: Record<string, string> = {
    'high': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'low': 'bg-gray-500',
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-12 flex items-center justify-center">
        <div className="text-white text-xl">⏳ Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🎯 Topical Authority Content Plan</h1>
        <p className="text-gray-400 text-lg">
          Genereer een uitgebreid content plan met clusters voor volledige topical authority
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* No Projects Warning */}
      {projects.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Geen projecten gevonden</h3>
          <p className="text-gray-400 mb-4">
            Je hebt nog geen projecten aangemaakt. Maak eerst een project aan om content te kunnen genereren.
          </p>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-all"
          >
            + Maak Project
          </button>
        </div>
      )}

      {/* Project Selection & Settings */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <label className="block text-white font-medium mb-3">Selecteer Project</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project || null);
                if (project) {
                  localStorage.setItem('selectedProject', JSON.stringify(project));
                }
                setError(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Kies een project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.website_url}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <label className="block text-white font-medium mb-3">Aantal Artikel Ideeën</label>
            <div className="flex gap-2">
              {[100, 250, 500, 750, 1000].map((count) => (
                <button
                  key={count}
                  onClick={() => setTargetCount(count)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    targetCount === count
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Meer ideeën = betere topical authority coverage
            </p>
          </div>
        </div>
      )}

      {/* Selected Project Info */}
      {selectedProject && (
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedProject.name}</h3>
              <p className="text-gray-400">🌐 {selectedProject.website_url}</p>
              {niche && <p className="text-orange-400 mt-1">🎯 Niche: {niche}</p>}
            </div>
            {stats?.dataForSEOEnriched && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
                <span className="text-green-400 text-sm font-medium">✓ DataForSEO Data</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-500 mb-1">{stats.totalArticles}</div>
            <div className="text-gray-400 text-sm">Totaal Ideeën</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-500 mb-1">{stats.pillarPages}</div>
            <div className="text-gray-400 text-sm">Pillar Pages</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-500 mb-1">{stats.clusters}</div>
            <div className="text-gray-400 text-sm">Clusters</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-500 mb-1">{stats.byContentType['how-to'] || 0}</div>
            <div className="text-gray-400 text-sm">How-to&apos;s</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-500 mb-1">{stats.byContentType['guide'] || 0}</div>
            <div className="text-gray-400 text-sm">Guides</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-500 mb-1">{stats.byContentType['comparison'] || 0}</div>
            <div className="text-gray-400 text-sm">Vergelijkingen</div>
          </div>
        </div>
      )}

      {/* Clusters Overview */}
      {clusters.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">📊 Content Clusters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {clusters.map((cluster, index) => (
              <button
                key={index}
                onClick={() => setFilterCluster(filterCluster === cluster.pillarTopic ? 'all' : cluster.pillarTopic)}
                className={`p-3 rounded-lg text-left transition-all ${
                  filterCluster === cluster.pillarTopic
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-sm truncate">{cluster.pillarTopic}</div>
                <div className="text-xs opacity-70">{cluster.articleCount} artikelen</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={generatePlan}
          disabled={!selectedProject || generating}
          className="flex-1 min-w-[300px] bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating 
            ? `⏳ AI genereert ${targetCount} ideeën... (dit kan 1-3 min duren)` 
            : `🚀 Genereer ${targetCount} Content Ideeën`
          }
        </button>
        
        {contentPlan.length > 0 && (
          <>
            <button
              onClick={exportPlan}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all"
            >
              📥 Export CSV
            </button>
            <button
              onClick={clearPlan}
              className="px-6 py-4 bg-gray-800 border border-gray-700 text-gray-400 rounded-xl font-medium hover:bg-gray-700 hover:text-white transition-all"
            >
              🗑️ Wissen
            </button>
          </>
        )}
      </div>

      {/* Filters */}
      {contentPlan.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterContentType}
            onChange={(e) => setFilterContentType(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
          >
            <option value="all">Alle Types</option>
            <option value="pillar">Pillar Pages</option>
            <option value="how-to">How-to</option>
            <option value="guide">Guides</option>
            <option value="comparison">Vergelijkingen</option>
            <option value="list">Lijsten</option>
            <option value="case-study">Case Studies</option>
            <option value="faq">FAQ</option>
            <option value="news">Nieuws</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
          >
            <option value="default">Standaard Volgorde</option>
            <option value="searchVolume">Zoekvolume (hoog → laag)</option>
            <option value="priority">Prioriteit</option>
            <option value="cluster">Cluster</option>
          </select>

          {filterCluster !== 'all' && (
            <button
              onClick={() => setFilterCluster('all')}
              className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              Cluster: {filterCluster} <span>✕</span>
            </button>
          )}

          <div className="ml-auto text-gray-400">
            {filteredPlan.length} van {contentPlan.length} ideeën
          </div>
        </div>
      )}

      {/* Content Plan List */}
      {filteredPlan.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            👇 Klik op een idee om te schrijven
          </h2>
          <div className="space-y-4">
            {filteredPlan.map((idea, index) => (
              <div
                key={index}
                onClick={() => selectIdea(idea)}
                className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group ${
                  idea.contentType === 'pillar' 
                    ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-purple-500/20' 
                    : 'border-gray-700 hover:border-orange-500 hover:shadow-orange-500/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {idea.contentType && (
                    <span className={`px-3 py-1 bg-gradient-to-r ${contentTypeColors[idea.contentType] || 'from-gray-500 to-gray-600'} text-white rounded-full text-sm font-medium`}>
                      {idea.contentType === 'pillar' ? '⭐ Pillar' : idea.contentType}
                    </span>
                  )}
                  {idea.cluster && (
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      📁 {idea.cluster}
                    </span>
                  )}
                  {idea.priority && (
                    <span className={`w-2 h-2 rounded-full ${priorityColors[idea.priority] || 'bg-gray-500'}`} title={`Prioriteit: ${idea.priority}`} />
                  )}
                  {idea.searchVolume && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      🔍 {idea.searchVolume.toLocaleString()} zoekvolume
                    </span>
                  )}
                  {idea.competition && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      idea.competition === 'LOW' ? 'bg-green-500/20 text-green-400' :
                      idea.competition === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {idea.competition}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  {idea.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{idea.description}</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {idea.keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {kw}
                    </span>
                  ))}
                  {idea.keywords.length > 5 && (
                    <span className="text-xs text-gray-500">+{idea.keywords.length - 5} meer</span>
                  )}
                </div>
                <div className="text-orange-400 font-semibold group-hover:text-orange-300">
                  ✍️ Klik om te schrijven →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {contentPlan.length === 0 && !generating && (
        <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-2">Bouw Topical Authority</h3>
          <p className="text-gray-400 max-w-lg mx-auto">
            {projects.length === 0 
              ? 'Maak eerst een project aan om te beginnen'
              : 'Selecteer een project en genereer een uitgebreid content plan met clusters om volledige topical authority op te bouwen in je niche.'
            }
          </p>
          <div className="mt-6 text-gray-500 text-sm">
            💡 Tip: Kies 500+ ideeën voor maximale coverage
          </div>
        </div>
      )}

      {/* Generating State */}
      {generating && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4 animate-pulse">🤖</div>
          <h3 className="text-2xl font-bold text-white mb-2">AI is aan het werk...</h3>
          <p className="text-gray-400">
            Content clusters en {targetCount} artikel ideeën worden gegenereerd.
            <br />
            Dit kan 1-3 minuten duren afhankelijk van het aantal ideeën.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
