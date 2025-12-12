'use client';

import { useState, useEffect } from 'react';
import { Plus, Globe, Settings, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Mijn Projecten</h1>
            <p className="text-gray-600 mt-2">Beheer al je websites en projecten</p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nieuw Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onAdd={() => setShowAddDialog(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onRefresh={fetchProjects}
              />
            ))}
          </div>
        )}

        {showAddDialog && (
          <AddProjectDialog
            onClose={() => setShowAddDialog(false)}
            onSuccess={() => {
              setShowAddDialog(false);
              fetchProjects();
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
          <Globe className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700">Nog geen projecten</h3>
        <p className="text-gray-600 mb-6">
          Voeg je eerste website toe om te beginnen met content management
        </p>
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
        >
          Eerste Project Toevoegen
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Weet je zeker dat je "${project.name}" wilt verwijderen?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Verwijderen mislukt');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Verwijderen mislukt');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">{project.name}</h3>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
              project.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {project.status === 'active' ? 'Actief' : 'Inactief'}
            </span>
          </div>
        </div>
      </div>
      
      {project.websiteUrl && (
        <a
          href={project.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-3 group"
        >
          <span className="truncate">{project.websiteUrl}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      )}
      
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
      )}
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => window.location.href = `/admin/blog?project=${project.id}`}
          className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-all font-medium"
        >
          Open Project
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Project verwijderen"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
}

function AddProjectDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">Nieuw Project Toevoegen</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Project Naam *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="bijv. WritGo.nl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Website URL *
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                placeholder="https://writgo.nl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Beschrijving (optioneel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Korte beschrijving van het project"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all shadow-md font-medium"
            >
              {loading ? 'Toevoegen...' : 'Project Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
