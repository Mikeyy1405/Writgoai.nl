'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectSettingsModal from '@/components/ProjectSettingsModal';

interface Project {
  id: string;
  name: string;
  website_url: string;
  wp_url: string | null;
  wp_username: string | null;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSuccess = () => {
    loadProjects();
    router.refresh();
  };

  const isWordPressConnected = (project: Project) => {
    return project.wp_url && project.wp_username;
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Weet je zeker dat je "${projectName}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt. Alle artikelen en instellingen van dit project worden ook verwijderd.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/delete?id=${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload projects list
        loadProjects();
      } else {
        alert(`Fout bij verwijderen project: ${data.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Kan geen verbinding maken met de server. Probeer het later opnieuw.');
    }
  };

  return (
    <div className="p-6 lg:p-12">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Projecten</h1>
            <p className="text-gray-400 text-lg">
              Beheer al je WordPress projecten op één plek
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all whitespace-nowrap"
          >
            + Nieuw Project
          </button>
        </div>

        {loading ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <div className="text-center py-12 text-gray-400">
              Projecten laden...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nog geen projecten
              </h3>
              <p className="text-gray-400 mb-6">
                Maak je eerste WordPress project aan om te beginnen
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                + Maak je eerste project
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
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 break-words">
                      {project.name}
                    </h3>
                    <p className="text-gray-400 mb-4 break-words">{project.website_url}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {isWordPressConnected(project) ? (
                        <span className="text-green-500">✓ WordPress verbonden</span>
                      ) : (
                        <span className="text-gray-500">○ Geen WordPress koppeling</span>
                      )}
                      <span className="text-gray-500">
                        Toegevoegd: {new Date(project.created_at).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="px-3 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-all"
                      title="Project Verwijderen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSettingsProject(project)}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2"
                      title="Project Instellingen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Instellingen
                    </button>
                    <button
                      onClick={() => {
                        // Navigate with project ID - no localStorage needed
                        router.push(`/dashboard/content-plan?project=${project.id}`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                    >
                      Genereer Content
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
         )}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
      {settingsProject && (
        <ProjectSettingsModal
          isOpen={!!settingsProject}
          onClose={() => setSettingsProject(null)}
          projectId={settingsProject.id}
          projectName={settingsProject.name}
        />
      )}
    </div>
  );
}
