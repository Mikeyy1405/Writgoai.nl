'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        const projectsWithStatus = await Promise.all(
          (data.projects || []).map(async (project: any) => {
            try {
              const configResponse = await fetch(`/api/autopilot/config?project_id=${project.id}`);
              const configData = await configResponse.json();
              return {
                ...project,
                autopilot: configData.config || { enabled: false },
              };
            } catch (e) {
              return { ...project, autopilot: { enabled: false } };
            }
          })
        );
        setProjects(projectsWithStatus);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (projectId: string) => {
    if (!confirm('🚀 Activate Autonomous SEO System?\n\nThis will:\n- Analyze your site\n- Research keywords\n- Create 30-day content plan\n- Enable AutoPilot\n\nContinue?')) {
      return;
    }

    setActivating(projectId);
    try {
      const response = await fetch('/api/autonomous/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Autonomous SEO System Activated!

📊 Niche: ${data.niche}
🎯 Keywords: ${data.keywords_found}
📝 Articles Planned: ${data.articles_planned}

Your site will now run on autopilot!`);
        loadProjects();
      } else {
        throw new Error(data.error || 'Activation failed');
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setActivating(null);
    }
  };

  const getStatusBadge = (project: any) => {
    if (project.autopilot?.enabled) {
      return (
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-green-400 text-sm font-medium">Autonomous Active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        <span className="text-gray-400 text-sm font-medium">Manual Mode</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6 lg:p-12">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="p-6 lg:p-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">WritGo AI</span>
          </h1>
          <p className="text-gray-400 text-xl">
            Autonomous SEO System for WordPress
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Sites</div>
            <div className="text-3xl font-bold text-white">{projects.length}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Active AutoPilot</div>
            <div className="text-3xl font-bold text-green-400">
              {projects.filter(p => p.autopilot?.enabled).length}
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Articles</div>
            <div className="text-3xl font-bold text-blue-400">0</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">This Month</div>
            <div className="text-3xl font-bold text-orange-400">0</div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Your Sites</h2>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            + Add New Site
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready to Dominate SEO?
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Add your first WordPress site and let AI handle everything.
              </p>
              <button
                onClick={() => router.push('/dashboard/projects')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                🎯 Add Your First Site
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {project.name}
                      </h3>
                      {getStatusBadge(project)}
                    </div>
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {project.website_url}
                    </a>
                    {project.niche && (
                      <div className="mt-2 inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {project.niche}
                      </div>
                    )}
                  </div>
                </div>

                {!project.autopilot?.enabled && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🚀</span>
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">
                          Ready to Go Autonomous?
                        </div>
                        <div className="text-gray-400 text-sm">
                          Let AI analyze, research, and create a complete strategy - one click!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  {!project.autopilot?.enabled ? (
                    <button
                      onClick={() => handleActivate(project.id)}
                      disabled={activating === project.id}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 transition-all"
                    >
                      {activating === project.id ? '🔄 Activating...' : '🚀 Make This Site Successful'}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/dashboard/autopilot?project=${project.id}`)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all"
                    >
                      📊 View Dashboard
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
