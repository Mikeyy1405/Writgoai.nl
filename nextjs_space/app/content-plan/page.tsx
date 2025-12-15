'use client';

import { useState, useEffect } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp, Globe, Keyboard } from 'lucide-react';

interface Topic {
  title: string;
  description: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  reason?: string;
}

interface ContentPlan {
  id: string;
  source: string;
  name: string;
  plan: {
    keyword?: string;
    source?: string;
    analyzedUrl?: string;
    existingPosts?: number;
    topics: Topic[];
    generatedAt: string;
  };
  lastGenerated: string;
}

type GenerationMode = 'manual' | 'auto';

export default function ContentPlanPage() {
  const [mode, setMode] = useState<GenerationMode>('manual');
  const [keyword, setKeyword] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{ keyword?: string; source?: string; analyzedUrl?: string; existingPosts?: number; topics: Topic[] } | null>(null);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPlans();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/simplified/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/simplified/content-plan');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'manual' && !keyword.trim()) return;
    if (mode === 'auto' && !selectedProject) {
      setError('Selecteer eerst een project om de WordPress site te analyseren');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      let response;
      
      if (mode === 'manual') {
        // Handmatige keyword-based generatie
        response = await fetch('/api/simplified/content-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keyword.trim(),
            projectId: selectedProject || undefined,
          }),
        });
      } else {
        // Automatische WordPress analyse
        response = await fetch('/api/simplified/content-plan/analyze-wordpress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProject,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      
      if (mode === 'manual') {
        setCurrentPlan({
          keyword: data.keyword,
          topics: data.topics,
        });
      } else {
        setCurrentPlan({
          source: data.source,
          analyzedUrl: data.analyzedUrl,
          existingPosts: data.existingPosts,
          topics: data.topics,
        });
      }

      // Refresh plans list
      fetchPlans();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setError(error.message || 'Er ging iets mis bij het genereren van het content plan.');
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Hoog';
      case 'medium':
        return 'Middel';
      case 'low':
        return 'Laag';
      default:
        return priority;
    }
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">📝 Content Plan</h1>
          <p className="text-lg text-slate-600 mt-2">Plan je content strategie met AI</p>
        </div>

        {/* Generator */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">🎯 Nieuw Content Plan</h2>
          
          {/* Mode Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-slate-200">
            <button
              onClick={() => {
                setMode('manual');
                setError('');
              }}
              className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                mode === 'manual'
                  ? 'border-orange-500 text-orange-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Handmatig</span>
            </button>
            <button
              onClick={() => {
                setMode('auto');
                setError('');
              }}
              className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                mode === 'auto'
                  ? 'border-orange-500 text-orange-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Automatisch (WordPress)</span>
            </button>
          </div>

          {/* Mode Description */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            {mode === 'manual' ? (
              <p className="text-sm text-blue-800">
                <strong>Handmatige modus:</strong> Voer een keyword in en AI genereert een content plan met gerelateerde topics.
              </p>
            ) : (
              <p className="text-sm text-blue-800">
                <strong>Automatische modus:</strong> AI analyseert je WordPress site, identificeert content gaps en genereert automatisch relevante topics.
              </p>
            )}
          </div>

          {/* Project Selection */}
          {projects.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {mode === 'auto' ? 'Selecteer project *' : 'Koppel aan project (optioneel)'}
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required={mode === 'auto'}
              >
                <option value="">{mode === 'auto' ? 'Selecteer een project...' : 'Geen project (opslaan in account)'}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.websiteUrl && ` - ${project.websiteUrl}`}
                  </option>
                ))}
              </select>
              {mode === 'auto' && !selectedProject && (
                <p className="text-xs text-slate-500 mt-1">
                  ℹ️ Selecteer een project met een WordPress URL
                </p>
              )}
            </div>
          )}

          {/* Manual Mode Input */}
          {mode === 'manual' && (
            <div className="flex space-x-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Voer een keyword in (bijv. 'fitness tips')"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={generating}
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !keyword.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg flex items-center space-x-2 hover:shadow-xl transition-shadow disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Genereren...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Genereer Plan</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Auto Mode Button */}
          {mode === 'auto' && (
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProject}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg flex items-center justify-center space-x-2 hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>WordPress analyseren...</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  <span>Analyseer WordPress & Genereer Plan</span>
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {/* Loading State */}
          {generating && (
            <div className="mt-4 text-center text-sm text-slate-600">
              {mode === 'manual' ? (
                <>
                  <p>AI genereert een topical authority map voor "{keyword}"...</p>
                  <p className="text-xs mt-1">Dit kan 10-20 seconden duren</p>
                </>
              ) : (
                <>
                  <p>AI analyseert je WordPress site en identificeert content gaps...</p>
                  <p className="text-xs mt-1">Dit kan 20-30 seconden duren</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Current Plan (just generated) */}
        {currentPlan && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <Check className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">
                {currentPlan.keyword 
                  ? `Content Plan: ${currentPlan.keyword}`
                  : `WordPress Content Plan`
                }
              </h2>
            </div>
            
            {currentPlan.source === 'wordpress-analysis' && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ <strong>WordPress Analyse Voltooid</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  📊 Geanalyseerde site: {currentPlan.analyzedUrl}
                </p>
                <p className="text-xs text-green-700">
                  📝 Bestaande posts: {currentPlan.existingPosts}
                </p>
              </div>
            )}
            
            <p className="text-slate-600 mb-4">
              {currentPlan.topics.length} nieuwe topics gegenereerd
            </p>
            <div className="space-y-3">
              {currentPlan.topics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-800 flex-1">{topic.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                        topic.priority
                      )}`}
                    >
                      {getPriorityLabel(topic.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{topic.description}</p>
                  {topic.reason && (
                    <p className="text-xs text-blue-600 mb-2 italic">
                      💡 {topic.reason}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Plans */}
        {!loading && plans.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4">📚 Bestaande Content Plans</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800">
                        {plan.plan.keyword || 'WordPress Analyse'}
                        {plan.plan.source === 'wordpress-analysis' && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            WordPress
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {plan.name} • {plan.plan.topics.length} topics
                        {plan.plan.analyzedUrl && ` • ${plan.plan.analyzedUrl}`}
                      </p>
                    </div>
                    {expandedPlan === plan.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {expandedPlan === plan.id && (
                    <div className="px-4 pb-4 space-y-2">
                      {plan.plan.topics.map((topic: Topic, index: number) => (
                        <div
                          key={index}
                          className="bg-slate-50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-slate-800">{topic.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                                topic.priority
                              )}`}
                            >
                              {getPriorityLabel(topic.priority)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs">{topic.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SimplifiedLayout>
  );
}
