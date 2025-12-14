'use client';

import { useProject } from '@/lib/contexts/ProjectContext';
import { useWordPressData } from '@/lib/contexts/WordPressDataContext';
import { ChevronDown, Loader2, FolderKanban, Database } from 'lucide-react';

export default function ProjectSelector() {
  const { currentProject, projects, switchProject, loading } = useProject();
  const { loading: wpLoading, data: wpData, error: wpError } = useWordPressData();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Projecten laden...</p>
        </div>
      </div>
    );
  }

  if ((projects || []).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-500">Geen projecten gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Actief Project
      </label>
      <div className="relative">
        <select
          value={currentProject?.id || ''}
          onChange={(e) => {
            if (e.target.value) {
              switchProject(e.target.value);
            }
          }}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg appearance-none bg-white pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        >
          {(projects || []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {currentProject?.description && (
        <p className="text-xs text-gray-500 mt-2">{currentProject.description}</p>
      )}
      
      {/* WordPress Data Loading Indicator */}
      {wpLoading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>WordPress gegevens laden...</span>
        </div>
      )}
      
      {/* WordPress Data Summary */}
      {!wpLoading && wpData && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
          <Database className="w-3 h-3" />
          <span>
            {wpData.categories.length} categorieën, {wpData.posts.length} posts, {wpData.pages.length} pagina's
          </span>
        </div>
      )}
      
      {/* WordPress Error */}
      {wpError && (
        <div className="mt-3 text-xs text-red-600">
          WordPress niet beschikbaar
        </div>
      )}
    </div>
  );
}
