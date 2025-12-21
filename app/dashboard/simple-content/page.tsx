'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  website_url: string;
  niche: string;
  created_at: string;
}

export default function ProjectSelectionPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [newProject, setNewProject] = useState({
    name: '',
    website_url: '',
    niche: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const response = await fetch('/api/projects/list');
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Load error:', error);
      alert('❌ Fout bij laden projecten');
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!newProject.name || !newProject.website_url || !newProject.niche) {
      alert('Vul alle velden in!');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });

      if (!response.ok) throw new Error('Failed to create project');

      alert('✅ Project aangemaakt!');
      setShowAddProject(false);
      setNewProject({ name: '', website_url: '', niche: '' });
      loadProjects();
    } catch (error) {
      console.error('Create error:', error);
      alert('❌ Fout bij aanmaken project');
    } finally {
      setCreating(false);
    }
  }

  function selectProject(project: Project) {
    localStorage.setItem('selectedProject', JSON.stringify(project));
    
    if (mode === 'auto') {
      // Automatische modus - ga naar auto pagina
      router.push('/dashboard/simple-content/auto');
    } else {
      // Handmatige modus - ga naar content plan
      router.push('/dashboard/simple-content/content-plan');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-xl">⏳ Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🚀 Simple Content</h1>
          <p className="text-gray-600">Kies modus en selecteer project</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Kies Modus</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('manual')}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'manual' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">👆</div>
              <div className="font-bold text-lg mb-2">Handmatig</div>
              <div className="text-sm text-gray-600">
                Stap voor stap: Plan → Schrijven → Editor → Publiceren
              </div>
              {mode === 'manual' && (
                <div className="mt-3 text-blue-600 font-semibold">✓ Geselecteerd</div>
              )}
            </button>

            <button
              onClick={() => setMode('auto')}
              className={`p-6 rounded-lg border-2 transition-all ${
                mode === 'auto' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">🤖</div>
              <div className="font-bold text-lg mb-2">Automatisch</div>
              <div className="text-sm text-gray-600">
                AI doet alles: Plan + Schrijven + Opslaan → Klaar!
              </div>
              {mode === 'auto' && (
                <div className="mt-3 text-green-600 font-semibold">✓ Geselecteerd</div>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
          <div className="text-gray-600">Projecten beschikbaar</div>
        </div>

        {/* Add Project Button */}
        <button
          onClick={() => setShowAddProject(!showAddProject)}
          className="mb-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
        >
          {showAddProject ? '❌ Annuleren' : '➕ Nieuw Project'}
        </button>

        {/* Add Project Form */}
        {showAddProject && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Nieuw Project Aanmaken</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Naam
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Bijv. Mijn Blog"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newProject.website_url}
                  onChange={(e) => setNewProject({...newProject, website_url: e.target.value})}
                  placeholder="https://mijnwebsite.nl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niche / Onderwerp
                </label>
                <input
                  type="text"
                  value={newProject.niche}
                  onChange={(e) => setNewProject({...newProject, niche: e.target.value})}
                  placeholder="Bijv. WordPress SEO"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={createProject}
                disabled={creating}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {creating ? '⏳ Aanmaken...' : '✅ Project Aanmaken'}
              </button>
            </div>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Geen projecten gevonden</h2>
            <p className="text-gray-600">Maak eerst een project aan om te beginnen</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              👇 Selecteer Project ({mode === 'auto' ? 'Automatisch' : 'Handmatig'})
            </h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => selectProject(project)}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl hover:border-2 hover:border-blue-500 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                      <p className="text-gray-600 mb-2">🌐 {project.website_url}</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {project.niche}
                      </span>
                    </div>
                    <div className="text-blue-600 font-semibold text-lg">
                      {mode === 'auto' ? '🤖 Auto →' : '👆 Handmatig →'}
                    </div>
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
