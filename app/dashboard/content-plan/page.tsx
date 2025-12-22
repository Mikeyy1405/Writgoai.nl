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

interface JobData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  niche?: string;
  language?: string;
  target_count?: number;
  competition_level?: string;
  reasoning?: string;
  plan?: ContentIdea[];
  clusters?: any[];
  stats?: Stats;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

interface Stats {
  totalArticles: number;
  pillarPages: number;
  clusters: number;
  byContentType: Record<string, number>;
}

export default function ContentPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Job state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Results state
  const [niche, setNiche] = useState('');
  const [language, setLanguage] = useState('nl');
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
  
  // Filters
  const [filterCluster, setFilterCluster] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [searchQuery, setSearchQuery] = useState('');

  // Load projects and check for active jobs on mount
  useEffect(() => {
    fetchProjects();
    loadSavedPlan();
    checkForActiveJob();
  }, []);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Update displayed plan when filters change
  useEffect(() => {
    let filtered = [...contentPlan];

    if (filterCluster !== 'all') {
      filtered = filtered.filter(idea => idea.cluster === filterCluster);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(idea => idea.contentType === filterType);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(idea => idea.priority === filterPriority);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(idea => 
        idea.title.toLowerCase().includes(query) ||
        idea.description?.toLowerCase().includes(query) ||
        idea.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      }
      if (sortBy === 'cluster') {
        return a.cluster.localeCompare(b.cluster);
      }
      if (sortBy === 'type') {
        return a.contentType.localeCompare(b.contentType);
      }
      return 0;
    });

    // Batch display
    setDisplayedPlan(filtered.slice(0, currentBatch * batchSize));
  }, [contentPlan, filterCluster, filterType, filterPriority, sortBy, searchQuery, currentBatch, batchSize]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const loadSavedPlan = () => {
    const savedPlan = localStorage.getItem('contentPlan');
    const savedClusters = localStorage.getItem('contentClusters');
    const savedStats = localStorage.getItem('contentStats');
    const savedNiche = localStorage.getItem('contentNiche');
    const savedLanguage = localStorage.getItem('contentLanguage');
    
    if (savedPlan) {
      try {
        setContentPlan(JSON.parse(savedPlan));
      } catch {}
    }
    if (savedClusters) {
      try {
        setClusters(JSON.parse(savedClusters));
      } catch {}
    }
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch {}
    }
    if (savedNiche) setNiche(savedNiche);
    if (savedLanguage) setLanguage(savedLanguage);
  };

  const checkForActiveJob = async () => {
    // Check localStorage for active job
    const savedJobId = localStorage.getItem('activeContentPlanJobId');
    if (savedJobId) {
      setCurrentJobId(savedJobId);
      startPolling(savedJobId);
    }
  };

  const startPolling = (jobId: string) => {
    setIsPolling(true);
    setLoading(true);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately
    pollJobStatus(jobId);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setLoading(false);
    localStorage.removeItem('activeContentPlanJobId');
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/simple/generate-content-plan-background?jobId=${jobId}`);
      
      if (!response.ok) {
        console.error('Failed to poll job status');
        return;
      }

      const job: JobData = await response.json();
      setJobData(job);

      // Update UI with progress
      if (job.niche) setNiche(job.niche);
      if (job.language) setLanguage(job.language);
      if (job.target_count) setTargetCount(job.target_count);
      if (job.competition_level) setCompetitionLevel(job.competition_level);
      if (job.reasoning) setReasoning(job.reasoning);

      // Check if job is complete
      if (job.status === 'completed') {
        stopPolling();
        
        // Update state with results
        if (job.plan) {
          setContentPlan(job.plan);
          localStorage.setItem('contentPlan', JSON.stringify(job.plan));
        }
        if (job.clusters) {
          setClusters(job.clusters);
          localStorage.setItem('contentClusters', JSON.stringify(job.clusters));
        }
        if (job.stats) {
          setStats(job.stats);
          localStorage.setItem('contentStats', JSON.stringify(job.stats));
        }
        if (job.niche) localStorage.setItem('contentNiche', job.niche);
        if (job.language) localStorage.setItem('contentLanguage', job.language);
        
        setCurrentJobId(null);
      } else if (job.status === 'failed') {
        stopPolling();
        setError(job.error || 'Er is een fout opgetreden');
        setCurrentJobId(null);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  const generateContentPlan = async () => {
    if (!selectedProject) {
      setError('Selecteer eerst een project');
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    if (!project?.website_url) {
      setError('Project heeft geen website URL');
      return;
    }

    setError('');
    setLoading(true);
    setContentPlan([]);
    setDisplayedPlan([]);
    setClusters([]);
    setStats(null);
    setNiche('');
    setTargetCount(0);
    setCurrentBatch(1);
    setJobData(null);

    try {
      // Start background job
      const response = await fetch('/api/simple/generate-content-plan-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: project.website_url,
          project_id: selectedProject,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start content plan generation');
      }

      const { jobId } = await response.json();
      
      // Save job ID and start polling
      setCurrentJobId(jobId);
      localStorage.setItem('activeContentPlanJobId', jobId);
      startPolling(jobId);

    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const cancelGeneration = () => {
    stopPolling();
    setCurrentJobId(null);
    setJobData(null);
  };

  const loadMore = () => {
    setCurrentBatch(prev => prev + 1);
  };

  const exportToCSV = () => {
    if (contentPlan.length === 0) return;

    const headers = ['Titel', 'Cluster', 'Type', 'Prioriteit', 'Keywords', 'Beschrijving'];
    const rows = contentPlan.map(idea => [
      idea.title,
      idea.cluster,
      idea.contentType,
      idea.priority,
      idea.keywords?.join('; ') || '',
      idea.description || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-plan-${niche.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleWriteArticle = (idea: ContentIdea) => {
    localStorage.setItem('selectedIdea', JSON.stringify({ ...idea, language }));
    localStorage.setItem('contentLanguage', language);
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

  const uniqueClusters = [...new Set(contentPlan.map(idea => idea.cluster))];
  const uniqueTypes = [...new Set(contentPlan.map(idea => idea.contentType))];
  const hasMoreToLoad = displayedPlan.length < contentPlan.filter(idea => {
    let match = true;
    if (filterCluster !== 'all') match = match && idea.cluster === filterCluster;
    if (filterType !== 'all') match = match && idea.contentType === filterType;
    if (filterPriority !== 'all') match = match && idea.priority === filterPriority;
    return match;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">📋 Content Plan</h1>
      <p className="text-gray-400 mb-6">AI genereert een volledig topical authority content plan</p>

      {/* Project Selection */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecteer Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">-- Kies een project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.website_url})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            {loading ? (
              <button
                onClick={cancelGeneration}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
              >
                ⏹️ Stop Generatie
              </button>
            ) : (
              <button
                onClick={generateContentPlan}
                disabled={!selectedProject}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Genereer Content Plan
              </button>
            )}
          </div>
        </div>

        {/* Info about background processing */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 <strong>Tip:</strong> Je kunt deze pagina verlaten - de generatie gaat door op de achtergrond. 
              Kom later terug om je content plan te bekijken!
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Progress Section */}
      {loading && jobData && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {jobData.current_step || 'Bezig met genereren...'}
            </h3>
            <span className="text-orange-400 font-bold">{jobData.progress || 0}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${jobData.progress || 0}%` }}
            />
          </div>

          {/* Niche Info */}
          {niche && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Niche</p>
                <p className="text-white font-semibold">{niche}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Doel Artikelen</p>
                <p className="text-orange-400 font-semibold">{targetCount}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Concurrentie</p>
                <p className="text-white font-semibold capitalize">{competitionLevel}</p>
              </div>
            </div>
          )}

          {reasoning && (
            <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
              <p className="text-gray-300 text-sm">{reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-3xl font-bold text-orange-400">{stats.totalArticles}</p>
            <p className="text-gray-400 text-sm">Totaal Artikelen</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-3xl font-bold text-purple-400">{stats.pillarPages}</p>
            <p className="text-gray-400 text-sm">Pillar Pages</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-3xl font-bold text-blue-400">{stats.clusters}</p>
            <p className="text-gray-400 text-sm">Clusters</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-3xl font-bold text-green-400">{language.toUpperCase()}</p>
            <p className="text-gray-400 text-sm">Taal</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {contentPlan.length > 0 && !loading && (
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Zoeken</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek artikelen..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cluster</label>
              <select
                value={filterCluster}
                onChange={(e) => setFilterCluster(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">Alle Clusters</option>
                {uniqueClusters.map(cluster => (
                  <option key={cluster} value={cluster}>{cluster}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">Alle Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{getContentTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Prioriteit</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">Alle</option>
                <option value="high">Hoog</option>
                <option value="medium">Medium</option>
                <option value="low">Laag</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sorteren</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="priority">Prioriteit</option>
                <option value="cluster">Cluster</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              {displayedPlan.length} van {contentPlan.length} artikelen
            </p>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Content Plan List */}
      {displayedPlan.length > 0 && !loading && (
        <div className="space-y-3">
          {displayedPlan.map((idea, index) => (
            <div 
              key={index}
              className={`bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-orange-500/50 transition-all ${
                idea.contentType === 'pillar' ? 'ring-2 ring-purple-500/30' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(idea.priority)}`}>
                      {idea.priority === 'high' ? '🔥 Hoog' : idea.priority === 'medium' ? '⚡ Medium' : '📝 Laag'}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {getContentTypeLabel(idea.contentType)}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                      {idea.cluster}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{idea.title}</h3>
                  {idea.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{idea.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {idea.keywords?.slice(0, 5).map((keyword, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                        {keyword}
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
      )}

      {/* Load More Button */}
      {hasMoreToLoad && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
          >
            Laad meer artikelen
          </button>
        </div>
      )}

      {/* Empty State */}
      {contentPlan.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">
            Nog geen content plan gegenereerd
          </p>
          <p className="text-gray-500">
            Selecteer een project en klik op "Genereer Content Plan" om te beginnen
          </p>
        </div>
      )}
    </div>
  );
}
