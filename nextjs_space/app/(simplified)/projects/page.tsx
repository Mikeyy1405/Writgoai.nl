'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Folder, ExternalLink, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';

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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    websiteUrl: '',
    description: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressCategory: '',
  });
  const [wpSectionOpen, setWpSectionOpen] = useState(false);


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
      const url = editingProject 
        ? `/api/simplified/projects/${editingProject.id}`
        : '/api/simplified/projects';
      
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        setShowNewProject(false);
        setEditingProject(null);
        setNewProject({ 
          name: '', 
          websiteUrl: '', 
          description: '',
          wordpressUrl: '',
          wordpressUsername: '',
          wordpressPassword: '',
          wordpressCategory: '',
        });
        setWpSectionOpen(false);
        setConnectionStatus(null);
        fetchProjects();
        alert(editingProject ? '✅ Project bijgewerkt!' : '✅ Project aangemaakt!');
      } else {
        const error = await res.json();
        alert(`❌ Fout: ${error.error || 'Kon project niet opslaan'}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('❌ Er is een fout opgetreden bij het opslaan');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      websiteUrl: project.websiteUrl || '',
      description: project.description || '',
      wordpressUrl: '',
      wordpressUsername: '',
      wordpressPassword: '',
      wordpressCategory: '',
    });
    setShowNewProject(true);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Weet je zeker dat je "${projectName}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/simplified/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProjects();
        alert('✅ Project verwijderd!');
      } else {
        const error = await res.json();
        alert(`❌ Fout: ${error.error || 'Kon project niet verwijderen'}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('❌ Er is een fout opgetreden bij het verwijderen');
    }
  };

  const handleCancelEdit = () => {
    setShowNewProject(false);
    setEditingProject(null);
    setNewProject({ 
      name: '', 
      websiteUrl: '', 
      description: '',
      wordpressUrl: '',
      wordpressUsername: '',
      wordpressPassword: '',
      wordpressCategory: '',
    });
    setWpSectionOpen(false);
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
            <h2 className="text-xl font-semibold text-white">
              {editingProject ? '✏️ Project Bewerken' : '➕ Nieuw Project'}
            </h2>
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

            {/* WordPress Integration Section */}
            <Collapsible.Root open={wpSectionOpen} onOpenChange={setWpSectionOpen}>
              <Collapsible.Trigger className="w-full flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                <span className="text-sm font-medium text-gray-300">
                  🔌 WordPress Integratie (optioneel)
                </span>
                {wpSectionOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </Collapsible.Trigger>
              
              <Collapsible.Content className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WordPress URL
                  </label>
                  <input
                    type="url"
                    value={newProject.wordpressUrl}
                    onChange={(e) => setNewProject({ ...newProject, wordpressUrl: e.target.value })}
                    placeholder="https://jouwsite.nl"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gebruikersnaam
                  </label>
                  <input
                    type="text"
                    value={newProject.wordpressUsername}
                    onChange={(e) => setNewProject({ ...newProject, wordpressUsername: e.target.value })}
                    placeholder="admin"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Application Password
                  </label>
                  <input
                    type="password"
                    value={newProject.wordpressPassword}
                    onChange={(e) => setNewProject({ ...newProject, wordpressPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Maak een Application Password aan in WordPress → Gebruikers → Profiel → Application Passwords
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Standaard Categorie
                  </label>
                  <input
                    type="text"
                    value={newProject.wordpressCategory}
                    onChange={(e) => setNewProject({ ...newProject, wordpressCategory: e.target.value })}
                    placeholder="blog"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 De WordPress verbinding wordt automatisch getest wanneer je het project aanmaakt.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>

            <div className="flex space-x-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
              >
                {editingProject ? 'Project Bijwerken' : 'Project Aanmaken'}
              </button>
              <button
                onClick={handleCancelEdit}
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
                    <button 
                      onClick={() => handleEditProject(project)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Project bewerken"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Project verwijderen"
                    >
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
