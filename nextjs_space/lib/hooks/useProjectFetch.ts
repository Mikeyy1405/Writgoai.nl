'use client';

import { useProject } from '@/lib/contexts/ProjectContext';
import { useCallback } from 'react';

/**
 * Custom hook that automatically adds projectId to fetch requests
 * Usage:
 * 
 * const projectFetch = useProjectFetch();
 * const data = await projectFetch('/api/admin/blog');
 * // Automatically adds ?projectId=xyz to the URL
 */
export function useProjectFetch() {
  const { currentProject } = useProject();

  const projectFetch = useCallback(async (
    url: string,
    options?: RequestInit
  ) => {
    if (!currentProject) {
      throw new Error('No project selected');
    }

    // Add projectId to URL
    const separator = url.includes('?') ? '&' : '?';
    const urlWithProject = `${url}${separator}projectId=${currentProject.id}`;

    return fetch(urlWithProject, options);
  }, [currentProject]);

  return projectFetch;
}

/**
 * Custom hook that returns the current project ID
 */
export function useCurrentProjectId() {
  const { currentProject } = useProject();
  return currentProject?.id || null;
}

/**
 * Custom hook that checks if a project is selected
 */
export function useHasProject() {
  const { currentProject, loading } = useProject();
  return { hasProject: !!currentProject, loading };
}
