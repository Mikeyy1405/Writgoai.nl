'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Plus, Settings, Check } from 'lucide-react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useRouter } from 'next/navigation';

export default function ProjectSwitcher() {
  const { currentProject, projects, switchProject, loading } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProjectSelect = async (projectId: string) => {
    await switchProject(projectId);
    setIsOpen(false);
    
    // Dispatch event to trigger data refresh in current page
    window.dispatchEvent(new CustomEvent('project-changed', { detail: { projectId } }));
  };

  const handleManageProjects = () => {
    setIsOpen(false);
    router.push('/admin/projects');
  };

  const handleNewProject = () => {
    setIsOpen(false);
    router.push('/admin/projects?new=true');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg animate-pulse">
        <Globe className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-400">Laden...</span>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <button
        onClick={handleNewProject}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        Project Toevoegen
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors w-full min-w-[200px]"
      >
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <div className="text-sm font-medium text-white truncate">
            {currentProject.name}
          </div>
          {currentProject.websiteUrl && (
            <div className="text-xs text-gray-400 truncate">
              {new URL(currentProject.websiteUrl).hostname}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            {/* Current Projects */}
            <div className="p-2 border-b border-gray-700">
              <div className="text-xs font-medium text-gray-400 px-2 py-1 uppercase">
                Mijn Projecten
              </div>
              {(projects || []).map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-700 transition-colors ${
                    currentProject.id === project.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                      {project.name}
                      {currentProject.id === project.id && (
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {project.websiteUrl && (
                      <div className="text-xs text-gray-400 truncate">
                        {new URL(project.websiteUrl).hostname}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleNewProject}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-green-400 hover:bg-gray-700 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nieuw Project
              </button>
              <button
                onClick={handleManageProjects}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded transition-colors"
              >
                <Settings className="w-4 h-4" />
                Projecten Beheren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
