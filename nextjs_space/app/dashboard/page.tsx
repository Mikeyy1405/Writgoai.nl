'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Globe, FileText, Sparkles, Plus, Edit, Trash2, 
  Check, X, Loader2, ExternalLink, Calendar, TrendingUp,
  Clock, Zap, Map, ArrowRight
} from 'lucide-react';

/**
 * UNIFIED DASHBOARD - Alles op één scherm
 * 
 * 3 Secties:
 * A. Sites Sectie - WordPress sites beheren
 * B. Content Generator - Direct content maken
 * C. Content Overzicht - Recente content bekijken
 */

interface Project {
  id: string;
  name: string;
  websiteUrl: string | null;
  wordpressUrl?: string | null;
  wordpressUsername?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    savedContent: number;
  };
}

interface Content {
  id: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  project?: {
    name: string;
  };
}

interface GeneratedContent {
  id: string;
  contentId: string;
  title: string;
  content: string;
  wordCount: number;
  imageCount: number;
  internalLinksCount: number;
}

export default function UnifiedDashboardPage() {
  const { data: session } = useSession();
  
  // Sites State
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddSite, setShowAddSite] = useState(false);
  const [editingSite, setEditingSite] = useState<Project | null>(null);
  const [newSite, setNewSite] = useState({
    name: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
  });
  const [savingSite, setSavingSite] = useState(false);

  // Content Generator State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generateError, setGenerateError] = useState('');

  // Content Overview State
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  // Publishing State
  const [publishing, setPublishing] = useState(false);

  // GSC Connection State
  const [gscConnected, setGscConnected] = useState(false);
  const [gscLoading, setGscLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchProjects();
    fetchRecentContent();
    checkGSCConnection();
  }, []);

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        console.log('[Dashboard] Projects loaded:', data);
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const checkGSCConnection = async () => {
    try {
      const res = await fetch('/api/client/gsc/status');
      if (res.ok) {
        const data = await res.json();
        setGscConnected(data.connected);
      }
    } catch (error) {
      console.error('Error checking GSC connection:', error);
    } finally {
      setGscLoading(false);
    }
  };

  const handleConnectGSC = async () => {
    try {
      const res = await fetch('/api/client/gsc/connect');
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Google Search Console verbinding wordt opgezet...');
      }
    } catch (error) {
      console.error('Error connecting GSC:', error);
      alert('Er is een fout opgetreden bij het verbinden met Google Search Console.');
    }
  };

  const fetchRecentContent = async () => {
    try {
      const res = await fetch('/api/simplified/stats');
      if (res.ok) {
        const data = await res.json();
        setRecentContent(data.recentContent || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleSaveSite = async () => {
    if (!newSite.name.trim() || !newSite.wordpressUrl.trim()) {
      alert('Naam en WordPress URL zijn verplicht');
      return;
    }

    setSavingSite(true);
    try {
      const url = editingSite 
        ? `/api/simplified/projects/${editingSite.id}`
        : '/api/simplified/projects';
      
      const method = editingSite ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      });

      if (res.ok) {
        alert(editingSite ? '✅ Site bijgewerkt!' : '✅ Site toegevoegd!');
        setShowAddSite(false);
        setEditingSite(null);
        setNewSite({
          name: '',
          wordpressUrl: '',
          wordpressUsername: '',
          wordpressPassword: '',
        });
        fetchProjects();
      } else {
        const error = await res.json();
        alert(`❌ Fout: ${error.error || 'Kon site niet opslaan'}`);
      }
    } catch (error) {
      console.error('Error saving site:', error);
      alert('❌ Er is een fout opgetreden');
    } finally {
      setSavingSite(false);
    }
  };

  const handleEditSite = (project: Project) => {
    setEditingSite(project);
    setNewSite({
      name: project.name,
      wordpressUrl: project.wordpressUrl || '',
      wordpressUsername: project.wordpressUsername || '',
      wordpressPassword: '',
    });
    setShowAddSite(true);
  };

  const handleDeleteSite = async (projectId: string, projectName: string) => {
    if (!confirm(`Weet je zeker dat je "${projectName}" wilt verwijderen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/simplified/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('✅ Site verwijderd!');
        fetchProjects();
      } else {
        const error = await res.json();
        alert(`❌ Fout: ${error.error || 'Kon site niet verwijderen'}`);
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('❌ Er is een fout opgetreden');
    }
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      setGenerateError('Voer een onderwerp of keyword in');
      return;
    }

    if (!selectedProjectId || selectedProjectId === 'none') {
      setGenerateError('Selecteer een WordPress site');
      return;
    }

    setGenerateError('');
    setGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch('/api/simplified/generate/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: topic.trim(),
          projectId: selectedProjectId,
          toneOfVoice: 'professioneel',
          contentType: 'article',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fout bij genereren');
      }

      setGeneratedContent(data.article);
      fetchRecentContent(); // Refresh content list
    } catch (error: any) {
      console.error('Error generating content:', error);
      setGenerateError(error.message || 'Er is iets misgegaan');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishContent = async () => {
    if (!generatedContent?.id || !selectedProjectId) {
      alert('❌ Geen content om te publiceren');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/simplified/publish/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: generatedContent.id,
          projectId: selectedProjectId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fout bij publiceren');
      }

      alert(`✅ Gepubliceerd!\n\nURL: ${data.wordpressUrl}`);
      
      // Clear form and refresh
      setTopic('');
      setGeneratedContent(null);
      fetchRecentContent();
    } catch (error: any) {
      alert(`❌ Fout: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyContent = () => {
    if (!generatedContent?.content) return;
    navigator.clipboard.writeText(generatedContent.content);
    alert('✅ Content gekopieerd naar klembord!');
  };

  const getStatusBadge = (status: string, publishedAt: string | null) => {
    if (publishedAt) {
      return (
        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-semibold">
          ✓ Gepubliceerd
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full font-semibold">
        ⏳ Concept
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-900 border-2 border-orange-500 rounded-2xl p-6 md:p-8 shadow-xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 text-white">
            👋 Welkom terug, {session?.user?.name || 'daar'}!
          </h1>
          <p className="text-base md:text-lg text-gray-200">
            Alles wat je nodig hebt om content te maken voor je WordPress sites
          </p>
        </div>

        {/* Topical Authority Banner - NEW */}
        <div 
          onClick={() => window.location.href = '/topical-authority'}
          className="bg-gradient-to-r from-orange-900/50 via-orange-900/50 to-blue-900/50 border-2 border-orange-500/50 rounded-2xl p-6 md:p-8 shadow-2xl cursor-pointer hover:border-orange-400 transition-all hover:scale-[1.01] group"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/50 group-hover:bg-orange-500/30 transition-colors">
                <Map className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  🗺️ Topical Authority Maps
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-semibold border border-green-500/50">
                    NIEUW
                  </span>
                </h2>
                <p className="text-sm md:text-base text-gray-300 mb-2">
                  Bouw complete topical authority met 400-500 gestructureerde artikelen
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                  <span className="bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    ✓ Automatische niche detectie
                  </span>
                  <span className="bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    ✓ Pillar + Subtopic structuur
                  </span>
                  <span className="bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    ✓ DataForSEO integratie
                  </span>
                  <span className="bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    ✓ WordPress sitemap analyse
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl font-semibold text-white transition-colors group-hover:gap-4">
              <span>Start Planning</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Google Search Console Connection Banner */}
        {!gscLoading && !gscConnected && (
          <div className="bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-blue-900/50 border-2 border-blue-500/50 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/50">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                    📊 Verbind Google Search Console
                  </h2>
                  <p className="text-sm md:text-base text-gray-300 mb-2">
                    Krijg inzicht in je content performance: clicks, impressions, CTR en posities
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                    <span className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                      ✓ Real-time performance metrics
                    </span>
                    <span className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                      ✓ AI-powered improvement tips
                    </span>
                    <span className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                      ✓ Performance alerts
                    </span>
                    <span className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                      ✓ Google updates tracking
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectGSC}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 px-6 py-3 rounded-xl font-semibold text-white transition-colors"
              >
                <span>Verbinden</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* GSC Connected Success Banner */}
        {!gscLoading && gscConnected && (
          <div className="bg-gradient-to-r from-green-900/50 via-green-900/50 to-blue-900/50 border-2 border-green-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/50">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    ✅ Google Search Console Verbonden
                  </h3>
                  <p className="text-sm text-gray-300">
                    Je GSC data wordt dagelijks gesynchroniseerd. Bekijk performance metrics in het Content Overzicht.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/content'}
                className="bg-green-500 hover:bg-green-400 px-6 py-3 rounded-xl font-semibold text-white transition-colors"
              >
                Bekijk Metrics
              </button>
            </div>
          </div>
        )}

        {/* Main Content - 3 Column Layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. SITES SECTIE */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-500" />
                  WordPress Sites
                </h2>
                <button
                  onClick={() => {
                    setShowAddSite(!showAddSite);
                    if (!showAddSite) {
                      setEditingSite(null);
                      setNewSite({
                        name: '',
                        wordpressUrl: '',
                        wordpressUsername: '',
                        wordpressPassword: '',
                      });
                    }
                  }}
                  className="p-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  {showAddSite ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {/* Add/Edit Site Form */}
              {showAddSite && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">
                    {editingSite ? '✏️ Site Bewerken' : '➕ Site Toevoegen'}
                  </h3>
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    placeholder="Site naam *"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                  />
                  <input
                    type="url"
                    value={newSite.wordpressUrl}
                    onChange={(e) => setNewSite({ ...newSite, wordpressUrl: e.target.value })}
                    placeholder="WordPress URL * (https://...)"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                  />
                  <input
                    type="text"
                    value={newSite.wordpressUsername}
                    onChange={(e) => setNewSite({ ...newSite, wordpressUsername: e.target.value })}
                    placeholder="Gebruikersnaam"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                  />
                  <input
                    type="password"
                    value={newSite.wordpressPassword}
                    onChange={(e) => setNewSite({ ...newSite, wordpressPassword: e.target.value })}
                    placeholder="Application Password"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                  />
                  <button
                    onClick={handleSaveSite}
                    disabled={savingSite}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {savingSite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Opslaan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingSite ? 'Bijwerken' : 'Opslaan'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sites List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto wordpress-sites-scroll smooth-scroll">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-200">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nog geen sites</p>
                    <p className="text-xs mt-1 text-slate-200">Voeg je eerste WordPress site toe</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={`bg-gray-800/50 border rounded-lg p-3 hover:border-orange-500 transition-all ${
                        selectedProjectId === project.id ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                            {project.isActive && (
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            )}
                          </div>
                          {project.wordpressUrl && (
                            <p className="text-xs text-slate-200 truncate">{project.wordpressUrl}</p>
                          )}
                          <p className="text-xs text-slate-200 mt-1">
                            {project._count?.savedContent || 0} artikelen
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSite(project)}
                            className="p-1.5 text-slate-200 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSite(project.id, project.name)}
                            className="p-1.5 text-slate-200 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* B. CONTENT GENERATOR */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Content Genereren
              </h2>

              <div className="space-y-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WordPress Site <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedProjectId || 'none'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedProjectId(value === 'none' ? '' : value);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    disabled={generating}
                  >
                    <option value="none">-- Selecteer site --</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Onderwerp/Keyword <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="bijv. 'Beste fitness tips voor beginners'"
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                    disabled={generating}
                  />
                </div>

                {/* Error Message */}
                {generateError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {generateError}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateContent}
                  disabled={generating || !topic.trim() || !selectedProjectId || selectedProjectId === 'none'}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Bezig met genereren...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Genereer Artikel (1500 woorden)</span>
                    </>
                  )}
                </button>

                {/* Generated Content Preview */}
                {generatedContent && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Artikel gegenereerd!</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white">{generatedContent.title}</p>
                      <div className="flex gap-3 text-xs text-slate-200">
                        <span>📝 {generatedContent.wordCount} woorden</span>
                        <span>🖼️ {generatedContent.imageCount} afbeeldingen</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCopyContent}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        📋 Kopieer
                      </button>
                      <button
                        onClick={handlePublishContent}
                        disabled={publishing}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {publishing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Publiceren...</span>
                          </>
                        ) : (
                          <>
                            <span>🚀 Publiceer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* New Article Button */}
                    <button
                      onClick={() => {
                        setGeneratedContent(null);
                        setTopic('');
                        setGenerateError('');
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                    >
                      Nieuw Artikel
                    </button>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-gray-300">
                    ✨ <strong>Writgo AI</strong> genereert:
                  </p>
                  <ul className="text-xs text-slate-200 mt-2 space-y-1 ml-4">
                    <li>• 1500 woorden, 100% menselijk</li>
                    <li>• SEO geoptimaliseerd</li>
                    <li>• Flux Pro afbeeldingen</li>
                    <li>• Automatische interne links</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* C. CONTENT OVERZICHT */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Recente Content
              </h2>

              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : recentContent.length === 0 ? (
                <div className="text-center py-12 text-slate-200">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nog geen content</p>
                  <p className="text-xs mt-1 text-slate-200">Genereer je eerste artikel!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentContent.map((content) => (
                    <div
                      key={content.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-orange-500/50 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
                            {content.title}
                          </h3>
                          {getStatusBadge(content.status, content.publishedAt)}
                        </div>
                        
                        {content.project && (
                          <p className="text-xs text-slate-200 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {content.project.name}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-slate-200">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(content.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Statistieken
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{projects.length}</div>
                  <div className="text-xs text-slate-200 mt-1">Sites</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{recentContent.length}</div>
                  <div className="text-xs text-slate-200 mt-1">Artikelen</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center col-span-2">
                  <div className="text-2xl font-bold text-green-400">
                    {recentContent.filter(c => c.publishedAt).length}
                  </div>
                  <div className="text-xs text-slate-200 mt-1">Gepubliceerd</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
