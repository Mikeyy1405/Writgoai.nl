'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateProjectModal from '@/components/CreateProjectModal';

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

  return (
    <div className="p-6 lg:p-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Projecten</h1>
            <p className="text-gray-400 text-lg">
              Beheer al je WordPress projecten op één plek
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/50 transition-all"
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {project.name}
                    </h3>
                    <p className="text-gray-400 mb-4">{project.website_url}</p>
                    <div className="flex items-center space-x-4 text-sm">
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
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        // Store project in localStorage and go to content plan
                        localStorage.setItem('selectedProject', JSON.stringify(project));
                        router.push('/dashboard/content-plan');
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
    </div>
  );
}
