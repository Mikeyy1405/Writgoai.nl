'use client';

import { useEffect, useState } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Plus, Globe, Trash2, Check, X, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  wordpressUrl: string;
  wordpressUsername: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    getLateDevApiKey: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/simplified/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Reset form
      setFormData({
        name: '',
        wordpressUrl: '',
        wordpressUsername: '',
        wordpressPassword: '',
        getLateDevApiKey: '',
      });
      setShowModal(false);
      fetchProjects();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/simplified/projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">📁 Mijn Projecten</h1>
            <p className="text-lg text-slate-600 mt-2">Beheer je WordPress websites</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuw Project</span>
          </button>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nog geen projecten</h2>
            <p className="text-slate-600">Maak je eerste project aan om te beginnen!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                      <p className="text-sm text-slate-500">{project.websiteUrl}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      project.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {project.isActive ? 'Actief' : 'Inactief'}
                  </span>
                  <span className="text-slate-400">
                    • {new Date(project.createdAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800">Nieuw Project</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project Naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Bijv. Mijn Blog"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    WordPress URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.wordpressUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, wordpressUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://jouwwebsite.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    WordPress Gebruikersnaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.wordpressUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, wordpressUsername: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    WordPress Application Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.wordpressPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, wordpressPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maak een Application Password aan in WordPress onder Gebruikers → Profiel
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    GetLate.dev API Key (optioneel)
                  </label>
                  <input
                    type="text"
                    value={formData.getLateDevApiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, getLateDevApiKey: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Voor social media automatisering"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Aanmaken...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Project Aanmaken</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SimplifiedLayout>
  );
}
