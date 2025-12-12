'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  websiteUrl?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  switchProject: (projectId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
  ensureDefaultProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'writgo_current_project';
const PROJECT_EVENT = 'writgo_project_switched';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
      
      // If no current project but we have projects, set the first one
      if (!currentProject && data.length > 0) {
        const lastProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
        const projectToSet = lastProjectId 
          ? data.find((p: Project) => p.id === lastProjectId) || data[0]
          : data[0];
        
        setCurrentProject(projectToSet);
        localStorage.setItem(PROJECT_STORAGE_KEY, projectToSet.id);
      }
      
      return data;
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Failed to load projects');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, []);

  // Refresh projects
  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  // Switch to a different project
  const switchProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }
    
    setCurrentProject(project);
    localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent(PROJECT_EVENT, { 
      detail: { projectId, project } 
    }));
  }, [projects]);

  // Add a new project
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) => {
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      const newProject = await response.json();
      
      // Refresh projects list
      await refreshProjects();
      
      // Auto-switch to new project
      await switchProject(newProject.id);
      
      return newProject;
    } catch (err: any) {
      console.error('Failed to add project:', err);
      setError(err.message || 'Failed to create project');
      return null;
    }
  }, [refreshProjects, switchProject]);

  // Update a project
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      await refreshProjects();
      
      // If we updated the current project, refresh it
      if (currentProject?.id === projectId) {
        const updatedProject = projects.find(p => p.id === projectId);
        if (updatedProject) {
          setCurrentProject(updatedProject);
        }
      }
      
      return true;
    } catch (err: any) {
      console.error('Failed to update project:', err);
      setError(err.message || 'Failed to update project');
      return false;
    }
  }, [currentProject, projects, refreshProjects]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // If we deleted the current project, switch to another
      if (currentProject?.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          await switchProject(remainingProjects[0].id);
        } else {
          setCurrentProject(null);
          localStorage.removeItem(PROJECT_STORAGE_KEY);
        }
      }
      
      await refreshProjects();
      return true;
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setError(err.message || 'Failed to delete project');
      return false;
    }
  }, [currentProject, projects, refreshProjects, switchProject]);

  // Ensure at least one default project exists
  const ensureDefaultProject = useCallback(async () => {
    if (projects.length === 0 && !loading) {
      console.log('[ProjectContext] No projects found, creating default project...');
      
      await addProject({
        name: 'Mijn Website',
        websiteUrl: 'https://example.com',
        description: 'Standaard project',
        status: 'active'
      });
    }
  }, [projects, loading, addProject]);

  const value: ProjectContextType = {
    currentProject,
    projects,
    loading,
    error,
    switchProject,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
    ensureDefaultProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  
  return context;
}

// Custom hook to listen for project switches
export function useProjectSwitch(callback: (project: Project) => void) {
  useEffect(() => {
    const handleProjectSwitch = (event: CustomEvent) => {
      callback(event.detail.project);
    };
    
    window.addEventListener(PROJECT_EVENT as any, handleProjectSwitch as any);
    
    return () => {
      window.removeEventListener(PROJECT_EVENT as any, handleProjectSwitch as any);
    };
  }, [callback]);
}
