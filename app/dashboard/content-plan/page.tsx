'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
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
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadProjects();
    loadSavedPlan();
  }, []);

  async function loadProjects() {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  function loadSavedPlan() {
    const saved = localStorage.getItem('contentPlan');
    const savedProject = localStorage.getItem('selectedProject');
    if (saved) setContentPlan(JSON.parse(saved));
    if (savedProject) setSelectedProject(JSON.parse(savedProject));
  }

  async function generatePlan() {
    if (!selectedProject) {
      alert('Selecteer eerst een project!');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/simple/generate-content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: selectedProject.niche })
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      const plan = data.plan.map((idea: ContentIdea) => ({
        ...idea,
        project_id: selectedProject.id
      }));
      
      setContentPlan(plan);
      localStorage.setItem('contentPlan', JSON.stringify(plan));
      localStorage.setItem('selectedProject', JSON.stringify(selectedProject));
      alert(`✅ ${data.count} artikel ideeën gegenereerd!`);
    } catch (error) {
      console.error('Plan error:', error);
      alert('❌ Fout bij genereren content plan');
    } finally {
      setGenerating(false);
    }
  }

  function selectIdea(idea: ContentIdea) {
    localStorage.setItem('selectedIdea', JSON.stringify(idea));
    router.push('/dashboard/writer');
  }

  const categoryColors: Record<string, string> = {
    'Google SEO': 'from-blue-500 to-blue-600',
    'AI & SEO': 'from-purple-500 to-purple-600',
    'WordPress': 'from-green-500 to-green-600',
    'Content Marketing': 'from-orange-500 to-orange-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📋 Content Plan</h1>
          <p className="text-gray-400 text-lg">
            Genereer en beheer je content planning
          </p>
        </div>

        {/* Project Selection */}
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
            }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Kies een project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.niche}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Project Info */}
        {selectedProject && (
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{selectedProject.name}</h3>
            <p className="text-gray-400 mb-2">🌐 {selectedProject.website_url}</p>
            <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
              {selectedProject.niche}
            </span>
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
        <button
          onClick={generatePlan}
          disabled={!selectedProject || generating}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {generating ? '⏳ AI aan het werk...' : '🤖 Genereer Content Plan (30 ideeën)'}
        </button>

        {/* Content Plan List */}
        {contentPlan.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              👇 Klik op een idee om te schrijven
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
                    {idea.keywords.map((kw, i) => (
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
              Selecteer een project en genereer een content plan om te beginnen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
