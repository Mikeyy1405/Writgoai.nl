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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
  
  // Track if user explicitly cancelled to prevent auto-resume
  const userCancelledRef = useRef(false);
  // Cooldown period after cancellation to allow backend to process the cancellation
  // 5 seconds chosen to: (1) give backend time to receive DELETE request,
  // (2) allow in-flight updateJob() calls to complete, (3) prevent immediate re-polling
  const CANCELLATION_COOLDOWN_MS = 5000;
  
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

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set project from URL
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [projectId]);

  // Load saved plan when project changes
  useEffect(() => {
    if (selectedProject) {
      loadSavedPlan(selectedProject);
      checkForActiveJob(selectedProject);
    } else {
      // Clear plan when no project selected
      clearPlanState();
    }
  }, [selectedProject]);

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
        // Auto-select first project if none selected
        if (!selectedProject && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const clearPlanState = () => {
    setContentPlan([]);
    setDisplayedPlan([]);
    setClusters([]);
    setStats(null);
    setNiche('');
    setLanguage('nl');
    setTargetCount(0);
    setCompetitionLevel('');
    setReasoning('');
    setCurrentBatch(1);
    setFilterCluster('all');
    setFilterType('all');
    setFilterPriority('all');
    setSearchQuery('');
  };

  const loadSavedPlan = async (projectId: string) => {
    // Clear current state first
    clearPlanState();
    
    try {
      // Load from database
      const response = await fetch(`/api/content-plan?project_id=${projectId}`);
      const data = await response.json();
      
      if (data.plan) {
        if (data.plan.plan) setContentPlan(data.plan.plan);
        if (data.plan.clusters) setClusters(data.plan.clusters);
        if (data.plan.stats) setStats(data.plan.stats);
        if (data.plan.niche) setNiche(data.plan.niche);
        if (data.plan.language) setLanguage(data.plan.language);
        if (data.plan.target_count) setTargetCount(data.plan.target_count);
        if (data.plan.competition_level) setCompetitionLevel(data.plan.competition_level);
        if (data.plan.reasoning) setReasoning(data.plan.reasoning);
      }
    } catch (err) {
      console.error('Failed to load content plan from database:', err);
    }
  };

  const savePlanToDatabase = async (
    projectId: string, 
    plan: ContentIdea[], 
    clusters: any[], 
    stats: Stats | null, 
    nicheValue: string, 
    languageValue: string,
    targetCountValue?: number,
    competitionLevelValue?: string,
    reasoningValue?: string
  ) => {
    try {
      await fetch('/api/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          niche: nicheValue,
          language: languageValue,
          target_count: targetCountValue,
          competition_level: competitionLevelValue,
          reasoning: reasoningValue,
          plan,
          clusters,
          stats,
        }),
      });
    } catch (err) {
      console.error('Failed to save content plan to database:', err);
    }
  };

  const checkForActiveJob = async (projectId: string) => {
    // Don't resume if user just cancelled
    if (userCancelledRef.current) {
      console.log('User cancelled, not resuming job');
      return;
    }
    
    // Check database for active job for this project
    try {
      const response = await fetch(`/api/simple/generate-content-plan-background?projectId=${projectId}&status=processing`);
      if (response.ok) {
        const data = await response.json();
        // Only resume if job is actually processing or pending (NOT cancelled or failed)
        if (data.id && data.status === 'processing') {
          // Double check it's not cancelled
          if (data.status !== 'cancelled' && data.status !== 'failed') {
            setCurrentJobId(data.id);
            startPolling(data.id, projectId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check for active job:', err);
    }
  };

  const startPolling = (jobId: string, projectId: string) => {
    setIsPolling(true);
    setLoading(true);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately
    pollJobStatus(jobId, projectId);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollJobStatus(jobId, projectId);
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setLoading(false);
  };

  const pollJobStatus = async (jobId: string, projectId: string) => {
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
        }
        if (job.clusters) {
          setClusters(job.clusters);
        }
        if (job.stats) {
          setStats(job.stats);
        }
        
        // Save to database
        savePlanToDatabase(
          projectId,
          job.plan || [],
          job.clusters || [],
          job.stats || null,
          job.niche || '',
          job.language || 'nl',
          job.target_count,
          job.competition_level,
          job.reasoning
        );
        
        setCurrentJobId(null);
      } else if (job.status === 'failed') {
        stopPolling();
        setError(job.error || 'Er is een fout opgetreden');
        setCurrentJobId(null);
      } else if (job.status === 'cancelled') {
        stopPolling();
        setCurrentJobId(null);
        setLoading(false);
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
    clearPlanState();
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
      
      // Save job ID and start polling - no localStorage, job status is in database
      setCurrentJobId(jobId);
      startPolling(jobId, selectedProject);

    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const cancelGeneration = async () => {
    // Set flag to prevent auto-resume
    userCancelledRef.current = true;
    
    // First cancel the backend job
    if (currentJobId) {
      try {
        await fetch(`/api/simple/generate-content-plan-background?jobId=${currentJobId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to cancel job:', err);
      }
    }
    
    // Then stop polling and clear state
    stopPolling();
    setCurrentJobId(null);
    setJobData(null);
    setLoading(false);
    
    // Reset flag after a delay
    setTimeout(() => {
      userCancelledRef.current = false;
    }, CANCELLATION_COOLDOWN_MS);
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
    link.download = `content-plan-${niche || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleWriteArticle = (idea: ContentIdea, index: number) => {
    // Navigate to writer with project and article index - no localStorage needed
    router.push(`/dashboard/writer?project=${selectedProject}&article=${index}`);
  };

  const deleteContentPlanItem = async (index: number) => {
    if (!window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
      return;
    }

    try {
      // Remove from local state
      const newPlan = contentPlan.filter((_, i) => i !== index);
      setContentPlan(newPlan);

      // Update in database if project selected
      if (selectedProject) {
        await savePlanToDatabase(
          selectedProject,
          newPlan,
          clusters,
          stats,
          niche,
          language,
          targetCount,
          competitionLevel,
          reasoning
        );
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Fout bij verwijderen');
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    // Reset cancellation flag when changing projects
    userCancelledRef.current = false;
    
    // Stop any active polling for the old project
    if (isPolling && selectedProject) {
      stopPolling();
    }
    
    // Update selected project
    setSelectedProject(newProjectId);
    
    // Update URL
    router.push(`/dashboard/content-plan?project=${newProjectId}`);
  };

  const uniqueClusters = [...new Set(contentPlan.map(idea => idea.cluster))];
  const uniqueTypes = [...new Set(contentPlan.map(idea => idea.contentType))];

  const getProgressMessage = () => {
    if (!jobData) return 'Starten...';
    return jobData.current_step || `Bezig... ${jobData.progress || 0}%`;
  };

  const getProgressSteps = () => {
    const progress = jobData?.progress || 0;
    return [
      { id: 1, name: 'Taal', icon: '🌍', done: progress >= 10 },
      { id: 2, name: 'Website', icon: '🔍', done: progress >= 20 },
      { id: 3, name: 'Niche', icon: '🎯', done: progress >= 25 },
      { id: 4, name: 'Topics', icon: '📊', done: progress >= 35 },
      { id: 5, name: 'Clusters', icon: '📝', done: progress >= 75 },
      { id: 6, name: 'Long-tail', icon: '🔄', done: progress >= 90 },
      { id: 7, name: 'Klaar', icon: '✅', done: progress >= 100 },
    ];
  };

  return (
    <div className="p-6 lg:p-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Content Plan</h1>
        <p className="text-gray-400 text-lg">AI bepaalt automatisch hoeveel artikelen je nodig hebt voor topical authority</p>
      </div>

      {/* Project Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Selecteer Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              disabled={loading}
            >
              <option value="">Kies een project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.website_url}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={generateContentPlan}
            disabled={!selectedProject || loading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Genereren...' : 'Genereer Content Plan'}
          </button>
        </div>

        {/* Tip */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 <strong>Tip:</strong> Je kunt deze pagina verlaten - de generatie gaat door op de achtergrond. 
              Kom later terug om je content plan te bekijken.
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Progress Section */}
      {loading && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Content Plan Genereren</h3>
            <button
              onClick={cancelGeneration}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Annuleren
            </button>
          </div>

          {/* Visual Steps */}
          <div className="flex flex-wrap justify-between gap-2 mb-6">
            {getProgressSteps().map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                  step.done 
                    ? 'bg-green-500/20 border-2 border-green-500' 
                    : 'bg-gray-700/50 border-2 border-gray-600'
                }`}>
                  {step.done ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-1 ${step.done ? 'text-green-400' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-500 relative"
              style={{ width: `${jobData?.progress || 0}%` }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {jobData?.progress || 0}%
              </span>
            </div>
          </div>
          
          {/* Current Step */}
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-300 font-medium">{getProgressMessage()}</p>
          </div>
          
          {/* Show detected info */}
          {niche && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Niche</div>
                <div className="text-white font-medium">{niche}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Taal</div>
                <div className="text-white font-medium">{language.toUpperCase()}</div>
              </div>
              {targetCount > 0 && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Artikelen</div>
                  <div className="text-white font-medium">{targetCount}</div>
                </div>
              )}
              {competitionLevel && (
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Concurrentie</div>
                  <div className="text-white font-medium">{competitionLevel}</div>
                </div>
              )}
            </div>
          )}
          
          {reasoning && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">AI Analyse</div>
              <p className="text-gray-300 text-sm">{reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-orange-500">{stats.totalArticles}</div>
            <div className="text-gray-400 text-sm">Totaal Artikelen</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-500">{stats.pillarPages}</div>
            <div className="text-gray-400 text-sm">Pillar Pages</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-500">{stats.clusters}</div>
            <div className="text-gray-400 text-sm">Clusters</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-500">{language.toUpperCase()}</div>
            <div className="text-gray-400 text-sm">Taal</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {contentPlan.length > 0 && !loading && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm text-gray-400 mr-2">Cluster:</label>
              <select
                value={filterCluster}
                onChange={(e) => setFilterCluster(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Alle</option>
                {uniqueClusters.map(cluster => (
                  <option key={cluster} value={cluster}>{cluster}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mr-2">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Alle</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mr-2">Prioriteit:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Alle</option>
                <option value="high">Hoog</option>
                <option value="medium">Medium</option>
                <option value="low">Laag</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mr-2">Sorteer:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm"
              >
                <option value="priority">Prioriteit</option>
                <option value="cluster">Cluster</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm"
              />
            </div>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Content Plan List */}
      {displayedPlan.length > 0 && !loading && (
        <>
          <div className="space-y-3 mb-6">
            {displayedPlan.map((idea, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-orange-500/50 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        idea.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        idea.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {idea.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                        {idea.contentType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                        {idea.cluster}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{idea.title}</h3>
                    {idea.description && (
                      <p className="text-gray-400 text-sm mb-2">{idea.description}</p>
                    )}
                    {idea.keywords && idea.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Find the actual index in the full contentPlan array
                        const actualIndex = contentPlan.findIndex(p => p.title === idea.title);
                        deleteContentPlanItem(actualIndex >= 0 ? actualIndex : 0);
                      }}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="Verwijderen"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => {
                        // Find the actual index in the full contentPlan array
                        const actualIndex = contentPlan.findIndex(p => p.title === idea.title);
                        handleWriteArticle(idea, actualIndex >= 0 ? actualIndex : 0);
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all whitespace-nowrap"
                    >
                      Schrijven
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {displayedPlan.length < contentPlan.length && (
            <div className="text-center">
              <button
                onClick={loadMore}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                Laad meer ({displayedPlan.length} van {contentPlan.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && contentPlan.length === 0 && selectedProject && (
        <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-white mb-2">Geen Content Plan</h3>
          <p className="text-gray-400 mb-6">
            Genereer een content plan om te beginnen met schrijven
          </p>
          <button
            onClick={generateContentPlan}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            Genereer Content Plan
          </button>
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProject && (
        <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-2xl font-bold text-white mb-2">Selecteer een Project</h3>
          <p className="text-gray-400">
            Kies een project om het content plan te bekijken of te genereren
          </p>
        </div>
      )}
    </div>
  );
}
