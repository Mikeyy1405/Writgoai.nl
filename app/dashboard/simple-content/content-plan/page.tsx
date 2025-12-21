'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
}

interface ArticleIdea {
  title: string;
  category: string;
  description: string;
  keywords: string[];
}

export default function ContentPlanPage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [contentPlan, setContentPlan] = useState<ArticleIdea[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedProject = localStorage.getItem('selectedProject');
    if (!savedProject) {
      alert('Geen project geselecteerd!');
      router.push('/dashboard/simple-content');
      return;
    }
    setProject(JSON.parse(savedProject));
  }, [router]);

  async function generatePlan() {
    setLoading(true);
    try {
      const response = await fetch('/api/simple/generate-content-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche: project?.niche 
        })
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      setContentPlan(data.plan);
      alert(`✅ ${data.count} artikel ideeën gegenereerd!`);
    } catch (error) {
      console.error('Plan error:', error);
      alert('❌ Fout bij genereren content plan');
    } finally {
      setLoading(false);
    }
  }

  function selectIdea(idea: ArticleIdea) {
    localStorage.setItem('selectedIdea', JSON.stringify(idea));
    router.push('/dashboard/simple-content/writer');
  }

  function goBack() {
    router.push('/dashboard/simple-content');
  }

  if (!project) {
    return <div className="p-8">⏳ Laden...</div>;
  }

  const categoryColors: Record<string, string> = {
    'Google SEO': 'bg-blue-100 text-blue-800',
    'AI & SEO': 'bg-purple-100 text-purple-800',
    'WordPress': 'bg-green-100 text-green-800',
    'Content Marketing': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="mb-4 text-blue-600 hover:underline"
          >
            ← Terug naar Projecten
          </button>
          <h1 className="text-4xl font-bold mb-2">📋 Stap 2: Content Plan</h1>
          <p className="text-gray-600">AI genereert content plan voor: <strong>{project.name}</strong></p>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold mb-2">{project.name}</h3>
          <p className="text-gray-600 mb-1">🌐 {project.website_url}</p>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {project.niche}
          </span>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="text-3xl font-bold text-blue-600">{contentPlan.length}</div>
          <div className="text-gray-600">Artikel ideeën</div>
        </div>

        {/* Generate Button */}
        {contentPlan.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">🤖 AI Content Plan</h2>
            <p className="text-gray-600 mb-6">
              AI genereert automatisch 30 artikel ideeën voor {project.niche}
            </p>
            <button
              onClick={generatePlan}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
            >
              {loading ? '⏳ AI aan het werk...' : '🚀 Genereer Content Plan'}
            </button>
          </div>
        )}

        {/* Content Plan List */}
        {contentPlan.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">👇 Klik op een artikel idee</h2>
              <button
                onClick={generatePlan}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                🔄 Nieuw Plan
              </button>
            </div>

            <div className="space-y-3">
              {contentPlan.map((idea, index) => (
                <div 
                  key={index} 
                  onClick={() => selectIdea(idea)}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl hover:border-2 hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[idea.category] || 'bg-gray-100'}`}>
                      {idea.category}
                    </span>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{idea.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{idea.description}</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {idea.keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-blue-600 font-semibold text-lg">
                    ✍️ Klik om te schrijven →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
