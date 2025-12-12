'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Project type definition
export interface Project {
  id: string;
  clientId: string;
  name: string;
  websiteUrl: string;
  description?: string | null;
  status?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  
  // Content settings
  targetAudience?: string | null;
  brandVoice?: string | null;
  niche?: string | null;
  keywords?: string[];
  contentPillars?: string[];
  writingStyle?: string | null;
  
  // WordPress settings
  wordpressUrl?: string | null;
  wordpressUsername?: string | null;
  wordpressPassword?: string | null;
  wordpressCategory?: string | null;
  wordpressAutoPublish?: boolean;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  switchProject: (projectId: string) => void;
  addProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects || []);

      // Set current project from localStorage or default to first project
      const lastProjectId = typeof window !== 'undefined' 
        ? localStorage.getItem('lastProjectId') 
        : null;

      let defaultProject: Project | null = null;

      if (lastProjectId) {
        defaultProject = data.projects.find((p: Project) => p.id === lastProjectId) || null;
      }

      // Fall back to primary project or first project
      if (!defaultProject) {
        defaultProject = 
          data.projects.find((p: Project) => p.isPrimary) || 
          data.projects[0] || 
          null;
      }

      if (defaultProject) {
        setCurrentProject(defaultProject);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastProjectId', defaultProject.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      setCurrentProject(project);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastProjectId', projectId);
        
        // Trigger custom event to notify components of project change
        window.dispatchEvent(
          new CustomEvent('projectChanged', { 
            detail: { projectId } 
          })
        );
      }
    }
  };

  const addProject = async (projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects([...projects, newProject.project]);
      switchProject(newProject.project.id);
      
      return newProject.project;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, data: Partial<Project>): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update project');
      }

      // Refresh projects after update
      await fetchProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      // If we deleted the current project, switch to another one
      if (currentProject?.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          switchProject(remainingProjects[0].id);
        } else {
          setCurrentProject(null);
        }
      }

      // Refresh projects
      await fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        switchProject,
        addProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  
  return context;
}
