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
}

export default function ContentPlanPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contentPlan, setContentPlan] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (saved) setContentPlan(JSON.parse(saved));
      if (savedProject) setSelectedProject(JSON.parse(savedProject));
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
        body: JSON.stringify({ website_url: selectedProject.website_url })
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
      localStorage.setItem('contentPlan', JSON.stringify(plan));
      localStorage.setItem('selectedProject', JSON.stringify(selectedProject));
      
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
    localStorage.removeItem('contentPlan');
  }

  const categoryColors: Record<string, string> = {
    'Google SEO': 'from-blue-500 to-blue-600',
    'AI & SEO': 'from-purple-500 to-purple-600',
    'WordPress': 'from-green-500 to-green-600',
    'WordPress SEO': 'from-green-500 to-green-600',
    'Content Marketing': 'from-orange-500 to-orange-600',
    'Technical SEO': 'from-red-500 to-red-600',
    'Guides': 'from-cyan-500 to-cyan-600',
    'Best Practices': 'from-indigo-500 to-indigo-600',
    'Tips': 'from-yellow-500 to-yellow-600',
    'Beginners': 'from-pink-500 to-pink-600',
    'Advanced': 'from-violet-500 to-violet-600',
    'Tools': 'from-teal-500 to-teal-600',
    'Case Studies': 'from-amber-500 to-amber-600',
    'Trends': 'from-rose-500 to-rose-600',
    'Checklists': 'from-lime-500 to-lime-600',
    'Mistakes': 'from-red-500 to-red-600',
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
          <h1 className="text-4xl font-bold text-white mb-2">📋 Content Plan</h1>
          <p className="text-gray-400 text-lg">
            Genereer en beheer je content planning
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

        {/* Project Selection */}
        {projects.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
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
        )}

        {/* Selected Project Info */}
        {selectedProject && (
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{selectedProject.name}</h3>
            <p className="text-gray-400">🌐 {selectedProject.website_url}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-orange-500 mb-2">{contentPlan.length}</div>
            <div className="text-gray-400">Artikel Ideeën</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">{selectedProject ? '1' : '0'}</div>
            <div className="text-gray-400">Geselecteerd Project</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">
              {contentPlan.length > 0 ? '✓' : '○'}
            </div>
            <div className="text-gray-400">Plan Status</div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={generatePlan}
            disabled={!selectedProject || generating}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '⏳ AI aan het werk... (dit kan 30-60 sec duren)' : '🤖 Genereer Content Plan (30 ideeën)'}
          </button>
          
          {contentPlan.length > 0 && (
            <button
              onClick={clearPlan}
              className="px-6 py-4 bg-gray-800 border border-gray-700 text-gray-400 rounded-xl font-medium hover:bg-gray-700 hover:text-white transition-all"
            >
              🗑️ Wissen
            </button>
          )}
        </div>

        {/* Content Plan List */}
        {contentPlan.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              👇 Klik op een idee om te schrijven ({contentPlan.length} ideeën)
            </h2>
            <div className="space-y-4">
              {contentPlan.map((idea, index) => (
                <div
                  key={index}
                  onClick={() => selectIdea(idea)}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 bg-gradient-to-r ${categoryColors[idea.category] || 'from-gray-500 to-gray-600'} text-white rounded-full text-sm font-medium`}>
                      {idea.category}
                    </span>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
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
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-2">Geen Content Plan</h3>
            <p className="text-gray-400">
              {projects.length === 0 
                ? 'Maak eerst een project aan om te beginnen'
                : 'Selecteer een project en genereer een content plan om te beginnen'
              }
            </p>
          </div>
        )}
    </div>
  );
}
