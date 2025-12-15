'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Folder, ExternalLink, Edit, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    websiteUrl: '',
    description: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/simplified/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('Project naam is verplicht');
      return;
    }

    try {
      const res = await fetch('/api/simplified/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        setShowNewProject(false);
        setNewProject({ name: '', websiteUrl: '', description: '' });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              📁 Mijn Projecten
            </h1>
            <p className="text-gray-400 mt-2">Beheer je WordPress sites en content</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuw Project</span>
          </button>
        </div>

        {/* New Project Form */}
        {showNewProject && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Nieuw Project</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Naam <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Mijn WordPress Site"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website URL (optioneel)
              </label>
              <input
                type="url"
                value={newProject.websiteUrl}
                onChange={(e) => setNewProject({ ...newProject, websiteUrl: e.target.value })}
                placeholder="https://mijnsite.nl"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschrijving (optioneel)
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Korte beschrijving van het project"
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
              >
                Project Aanmaken
              </button>
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProject({ name: '', websiteUrl: '', description: '' });
                }}
                className="flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Projecten laden...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
            <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nog geen projecten</h3>
            <p className="text-gray-400 mb-6">
              Maak je eerste project aan om te beginnen met content genereren
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
            >
              Maak je eerste project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-orange-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Folder className="w-8 h-8 text-orange-500" />
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-400 mb-4">{project.description}</p>
                )}
                {project.websiteUrl && (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-400 hover:text-orange-300 flex items-center space-x-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Website bezoeken</span>
                  </a>
                )}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Aangemaakt: {new Date(project.createdAt).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
