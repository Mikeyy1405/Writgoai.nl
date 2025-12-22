'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ContentIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
  contentType: string;
  cluster: string;
  priority: string;
  difficulty?: string;
  searchIntent?: string;
  searchVolume?: number | null;
  competition?: string | null;
}

interface ProgressData {
  step: number;
  totalSteps: number;
  progress: number;
  message: string;
  detail: string;
  estimatedTime?: string;
  nicheInfo?: {
    niche: string;
    targetCount: number;
    competitionLevel: string;
    reasoning: string;
  };
  currentCluster?: {
    index: number;
    total: number;
    topic: string;
  };
}

interface Stats {
  totalArticles: number;
  pillarPages: number;
  clusters: number;
  byContentType: Record<string, number>;
  dataForSEOEnriched: boolean;
}

export default function ContentPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Progress state
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Results state
  const [niche, setNiche] = useState('');
  const [targetCount, setTargetCount] = useState(0);
  const [competitionLevel, setCompetitionLevel] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [contentPlan, setContentPlan] = useState<ContentIdea[]>([]);
  const [displayedPlan, setDisplayedPlan] = useState<ContentIdea[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Batch loading state
  const [batchSize] = useState(50);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filters
  const [filterCluster, setFilterCluster] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchProjects();
    loadSavedPlan();
  }, []);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId]);

  // Update displayed plan when filters change
  useEffect(() => {
    let filtered = [...contentPlan];

    if (filterCluster !== 'all') {
      filtered = filtered.filter(item => item.cluster === filterCluster);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.contentType === filterType);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keywords.some(kw => kw.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      }
      if (sortBy === 'searchVolume') {
        return (b.searchVolume || 0) - (a.searchVolume || 0);
      }
      if (sortBy === 'cluster') {
        return a.cluster.localeCompare(b.cluster);
      }
      return 0;
    });

    const batchLimit = currentBatch * batchSize;
    setDisplayedPlan(filtered.slice(0, batchLimit));
  }, [contentPlan, filterCluster, filterType, filterPriority, sortBy, searchQuery, currentBatch, batchSize]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const loadSavedPlan = () => {
    try {
      const saved = localStorage.getItem('contentPlan');
      const savedClusters = localStorage.getItem('contentClusters');
      const savedStats = localStorage.getItem('contentStats');
      const savedNiche = localStorage.getItem('contentNiche');
      
      if (saved) setContentPlan(JSON.parse(saved));
      if (savedClusters) setClusters(JSON.parse(savedClusters));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedNiche) setNiche(savedNiche);
    } catch (err) {
      console.error('Error loading saved plan:', err);
    }
  };

  const generateContentPlan = async () => {
    if (!selectedProject) {
      setError('Selecteer eerst een project');
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    if (!project) {
      setError('Project niet gevonden');
      return;
    }

    setError('');
    setIsGenerating(true);
    setLoading(true);
    setProgress(null);
    setContentPlan([]);
    setDisplayedPlan([]);
    setClusters([]);
    setStats(null);
    setNiche('');
    setTargetCount(0);
    setCurrentBatch(1);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/simple/generate-content-plan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: project.website_url,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start content plan generation');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data);
                
                if (data.nicheInfo) {
                  setNiche(data.nicheInfo.niche);
                  setTargetCount(data.nicheInfo.targetCount);
                  setCompetitionLevel(data.nicheInfo.competitionLevel);
                  setReasoning(data.nicheInfo.reasoning);
                }
              } else if (data.type === 'complete') {
                setContentPlan(data.plan || []);
                setClusters(data.clusters || []);
                setStats(data.stats || null);
                setNiche(data.niche || '');
                setTargetCount(data.targetCount || data.count || 0);
                setCompetitionLevel(data.competitionLevel || '');
                setReasoning(data.reasoning || '');
                setIsGenerating(false);
                setLoading(false);
                
                // Save to localStorage
                localStorage.setItem('contentPlan', JSON.stringify(data.plan || []));
                localStorage.setItem('contentClusters', JSON.stringify(data.clusters || []));
                localStorage.setItem('contentStats', JSON.stringify(data.stats || null));
                localStorage.setItem('contentNiche', data.niche || '');
              } else if (data.type === 'error') {
                setError(data.message);
                setIsGenerating(false);
                setLoading(false);
              }
            } catch (e) {
              console.warn('Failed to parse SSE message:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generatie geannuleerd');
      } else {
        setError(err.message || 'Er is een fout opgetreden');
      }
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentBatch(prev => prev + 1);
      setIsLoadingMore(false);
    }, 300);
  };

  const clearPlan = () => {
    setContentPlan([]);
    setClusters([]);
    setStats(null);
    setNiche('');
    localStorage.removeItem('contentPlan');
    localStorage.removeItem('contentClusters');
    localStorage.removeItem('contentStats');
    localStorage.removeItem('contentNiche');
  };

  const exportToCSV = () => {
    const headers = ['Titel', 'Cluster', 'Type', 'Prioriteit', 'Keywords', 'Zoekvolume', 'Beschrijving'];
    const rows = contentPlan.map(item => [
      item.title,
      item.cluster,
      item.contentType,
      item.priority,
      item.keywords.join('; '),
      item.searchVolume || '',
      item.description,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-plan-${niche.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleWriteArticle = (idea: ContentIdea) => {
    localStorage.setItem('selectedIdea', JSON.stringify(idea));
    router.push(`/dashboard/writer?project=${selectedProject}`);
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pillar': '📚 Pillar Page',
      'how-to': '🔧 How-to',
      'guide': '📖 Gids',
      'comparison': '⚖️ Vergelijking',
      'list': '📋 Lijst',
      'faq': '❓ FAQ',
      'case-study': '📊 Case Study',
      'news': '📰 Nieuws',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const uniqueClusters = [...new Set(contentPlan.map(item => item.cluster))];
  const uniqueTypes = [...new Set(contentPlan.map(item => item.contentType))];
  const totalFiltered = contentPlan.filter(item => {
    if (filterCluster !== 'all' && item.cluster !== filterCluster) return false;
    if (filterType !== 'all' && item.contentType !== filterType) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(query) && 
          !item.description.toLowerCase().includes(query) &&
          !item.keywords.some(kw => kw.toLowerCase().includes(query))) {
        return false;
      }
    }
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎯 Topical Authority Content Plan</h1>
          <p className="text-gray-400">
            AI bepaalt automatisch hoeveel artikelen je nodig hebt voor volledige niche dominantie
          </p>
        </div>

        {/* Project Selection */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-300 mb-2 font-medium">Selecteer Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50"
              >
                <option value="">Kies een project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.website_url}
                  </option>
                ))}
              </select>
            </div>
            
            {isGenerating ? (
              <button
                onClick={cancelGeneration}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuleren
              </button>
            ) : (
              <button
                onClick={generateContentPlan}
                disabled={!selectedProject || loading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Genereer Content Plan
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Progress Section */}
        {isGenerating && progress && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">{progress.message}</span>
                <span className="text-orange-400 font-bold">{progress.progress}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              
              <p className="text-gray-400 text-sm mt-2">{progress.detail}</p>
              {progress.estimatedTime && (
                <p className="text-gray-500 text-xs mt-1">{progress.estimatedTime}</p>
              )}
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {Array.from({ length: progress.totalSteps }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i + 1 < progress.step ? 'bg-green-500 text-white' :
                    i + 1 === progress.step ? 'bg-orange-500 text-white animate-pulse' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {i + 1 < progress.step ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 hidden md:block">
                    {['Analyse', 'Topics', 'Clusters', 'Long-tail', 'SEO Data', 'Afronden'][i]}
                  </span>
                </div>
              ))}
            </div>

            {/* Niche Info Card */}
            {niche && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Niche</p>
                    <p className="text-white font-medium">{niche}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Doel Artikelen</p>
                    <p className="text-orange-400 font-bold text-xl">{targetCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Concurrentie</p>
                    <p className={`font-medium ${
                      competitionLevel === 'low' ? 'text-green-400' :
                      competitionLevel === 'medium' ? 'text-yellow-400' :
                      competitionLevel === 'high' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>{competitionLevel || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Voortgang</p>
                    <p className="text-white font-medium">{contentPlan.length} / {targetCount}</p>
                  </div>
                </div>
                {reasoning && (
                  <p className="text-gray-400 text-sm mt-3 italic">&quot;{reasoning}&quot;</p>
                )}
              </div>
            )}

            {/* Current Cluster Progress */}
            {progress.currentCluster && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 text-sm">
                  <span className="font-bold">Cluster {progress.currentCluster.index}/{progress.currentCluster.total}:</span>{' '}
                  {progress.currentCluster.topic}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {contentPlan.length > 0 && !isGenerating && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Totaal Artikelen</p>
                <p className="text-3xl font-bold text-white">{stats?.totalArticles || contentPlan.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Pillar Pages</p>
                <p className="text-3xl font-bold text-orange-400">{stats?.pillarPages || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Clusters</p>
                <p className="text-3xl font-bold text-blue-400">{stats?.clusters || clusters.length}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">How-to&apos;s</p>
                <p className="text-3xl font-bold text-green-400">{stats?.byContentType?.['how-to'] || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Vergelijkingen</p>
                <p className="text-3xl font-bold text-purple-400">{stats?.byContentType?.comparison || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">DataForSEO</p>
                <p className="text-xl font-bold">{stats?.dataForSEOEnriched ? '✅ Ja' : '❌ Nee'}</p>
              </div>
            </div>

            {/* Niche Summary */}
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">📊 {niche}</h2>
                  <p className="text-gray-400">{reasoning}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    📥 Export CSV
                  </button>
                  <button
                    onClick={clearPlan}
                    className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    🗑️ Wissen
                  </button>
                </div>
              </div>
            </div>

            {/* Cluster Overview */}
            {clusters.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="text-white font-medium mb-3">📁 Clusters</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCluster('all')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filterCluster === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Alle ({contentPlan.length})
                  </button>
                  {clusters.map((cluster, i) => (
                    <button
                      key={i}
                      onClick={() => setFilterCluster(filterCluster === cluster.pillarTopic ? 'all' : cluster.pillarTopic)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        filterCluster === cluster.pillarTopic ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {cluster.pillarTopic} ({cluster.articleCount})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Zoeken</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentBatch(1); }}
                    placeholder="Zoek artikelen..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setCurrentBatch(1); }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="all">Alle types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Prioriteit</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => { setFilterPriority(e.target.value); setCurrentBatch(1); }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="all">Alle</option>
                    <option value="high">Hoog</option>
                    <option value="medium">Medium</option>
                    <option value="low">Laag</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Sorteren</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="priority">Prioriteit</option>
                    <option value="searchVolume">Zoekvolume</option>
                    <option value="cluster">Cluster</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <p className="text-sm text-gray-400">
                    {displayedPlan.length} van {totalFiltered} artikelen
                  </p>
                </div>
              </div>
            </div>

            {/* Content Plan List */}
            <div className="space-y-3">
              {displayedPlan.map((idea, index) => (
                <div
                  key={index}
                  className={`bg-gray-900 border rounded-xl p-4 hover:border-orange-500/50 transition-colors ${
                    idea.contentType === 'pillar' ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">
                          {getContentTypeLabel(idea.contentType)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(idea.priority)}`}>
                          {idea.priority}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {idea.cluster}
                        </span>
                        {idea.searchVolume && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            🔍 {idea.searchVolume.toLocaleString()} /mo
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{idea.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {idea.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleWriteArticle(idea)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all text-sm whitespace-nowrap"
                    >
                      ✍️ Schrijven
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {displayedPlan.length < totalFiltered && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Laden...
                    </>
                  ) : (
                    <>
                      Laad meer ({totalFiltered - displayedPlan.length} resterend)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isGenerating && contentPlan.length === 0 && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Klaar om te beginnen?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Selecteer een project en laat AI automatisch bepalen hoeveel artikelen je nodig hebt voor volledige topical authority.
            </p>
            <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
              <p>✅ AI analyseert je niche en concurrentie</p>
              <p>✅ Bepaalt automatisch het optimale aantal artikelen</p>
              <p>✅ Genereert clusters met pillar pages en supporting content</p>
              <p>✅ Verrijkt met DataForSEO zoekvolume data (indien geconfigureerd)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
