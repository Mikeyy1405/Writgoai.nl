'use client';

import { useState, useEffect } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Topic {
  title: string;
  description: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ContentPlan {
  id: string;
  source: string;
  name: string;
  plan: {
    keyword: string;
    topics: Topic[];
    generatedAt: string;
  };
  lastGenerated: string;
}

export default function ContentPlanPage() {
  const [keyword, setKeyword] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{ keyword: string; topics: Topic[] } | null>(null);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

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
    if (!keyword.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/simplified/content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          projectId: selectedProject || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      setCurrentPlan({
        keyword: data.keyword,
        topics: data.topics,
      });

      // Refresh plans list
      fetchPlans();
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Er ging iets mis bij het genereren van het content plan.');
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
          
          {projects.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Koppel aan project (optioneel)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Geen project (opslaan in account)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {generating && (
            <div className="mt-4 text-center text-sm text-slate-600">
              <p>AI genereert een topical authority map voor "{keyword}"...</p>
              <p className="text-xs mt-1">Dit kan 10-20 seconden duren</p>
            </div>
          )}
        </div>

        {/* Current Plan (just generated) */}
        {currentPlan && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <Check className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">
                Content Plan: {currentPlan.keyword}
              </h2>
            </div>
            <p className="text-slate-600 mb-4">
              {currentPlan.topics.length} topics gegenereerd
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
                        {plan.plan.keyword}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {plan.name} • {plan.plan.topics.length} topics
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
