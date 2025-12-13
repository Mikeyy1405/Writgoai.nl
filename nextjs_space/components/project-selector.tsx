'use client';

import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';

export interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  isPrimary: boolean;
  targetAudience?: string;
  toneOfVoice?: string;
  additionalInfo?: string;
  knowledgeBaseCount?: number;
  wordpressUrl?: string;
  wordpressUsername?: string;
  wordpressPassword?: string;
  wordpressCategory?: string;
  /** Number of active affiliate links configured for this project */
  affiliateLinksCount?: number;
  /** Number of URLs found in the project's sitemap */
  sitemapUrlsCount?: number;
  /** Whether the project has a valid sitemap with URLs */
  hasSitemap?: boolean;
  brandVoice?: string;
  niche?: string;
  keywords?: string[];
  /** Whether the current user owns this project */
  isOwner?: boolean;
  /** Whether the current user is a collaborator on this project */
  isCollaborator?: boolean;
  /** Role of the collaborator (if isCollaborator is true) */
  collaboratorRole?: string;
  /** Email of the person who shared this project (if isCollaborator is true) */
  sharedBy?: string;
  /** Name of the person who shared this project (if isCollaborator is true) */
  sharedByName?: string;
}

interface ProjectSelectorProps {
  value?: string | null;
  onChange: (projectId: string | null, project: Project | null) => void;
  className?: string;
  autoSelectPrimary?: boolean;
  showKnowledgeBase?: boolean;
  label?: string;
}

export default function ProjectSelector({ 
  value, 
  onChange, 
  className = '',
  autoSelectPrimary = true,
  showKnowledgeBase = true,
  label = 'Project (optioneel)'
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    // Clear any localStorage cache that might interfere
    try {
      localStorage.removeItem('cached_projects');
      localStorage.removeItem('projects_cache');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    fetchProjects();
  }, []);

  useEffect(() => {
    if (value && (projects || []).length > 0) {
      const project = (projects || []).find(p => p.id === value);
      setSelectedProject(project || null);
    }
  }, [value, projects]);

  const fetchProjects = async () => {
    try {
      setFetchAttempts(prev => prev + 1);
      console.log(`[ProjectSelector] Fetching projects (attempt ${fetchAttempts + 1})...`);
      
      // Ultra-aggressive cache busting
      const cacheBuster = `${Date.now()}-${Math.random()}`;
      const res = await fetch(`/api/client/projects?_t=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      const data = await res.json();
      console.log(`[ProjectSelector] Received ${data.projects?.length || 0} projects from API`);
      
      if (res.ok && data.projects) {
        setProjects(data.projects);
        console.log(`[ProjectSelector] Set ${data.projects.length} projects in state`);
        
        // Auto-select primary project ONLY if:
        // 1. autoSelectPrimary is enabled
        // 2. No value is currently set (!value)
        // 3. We haven't auto-selected before (!hasAutoSelected)
        // 4. There are projects available
        if (autoSelectPrimary && !value && !hasAutoSelected && data.projects.length > 0) {
          const primary = data.projects.find((p: Project) => p.isPrimary) || data.projects[0];
          console.log(`[ProjectSelector] Auto-selecting primary project: ${primary.name}`);
          setSelectedProject(primary);
          setHasAutoSelected(true); // Mark that we've auto-selected
          onChange(primary.id, primary);
        }
      } else {
        console.error('[ProjectSelector] Failed to fetch projects:', data);
      }
    } catch (error) {
      console.error('[ProjectSelector] Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    onChange(project.id, project);
    
    // Show knowledge base info if available
    if (showKnowledgeBase && project.knowledgeBaseCount && project.knowledgeBaseCount > 0) {
      toast.success(`Project geselecteerd met ${project.knowledgeBaseCount} kennisbank items`);
    }
  };

  const handleClearSelection = () => {
    setSelectedProject(null);
    onChange(null, null);
    toast.info('Geen project geselecteerd');
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 ${className}`}>
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">Laden...</span>
      </div>
    );
  }

  if ((projects || []).length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900">
          <AlertCircle className="w-4 h-4 text-[#ff6b35]" />
          <span className="text-sm text-gray-300">Geen projecten aangemaakt</span>
        </div>
        <Link href="/client-portal/projects/new">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            Maak je eerste project aan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-full flex items-center justify-between gap-2 bg-zinc-900 border-zinc-700 hover:border-[#ff6b35] hover:bg-zinc-800 text-white ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className={`w-4 h-4 flex-shrink-0 ${selectedProject ? 'text-[#ff6b35]' : 'text-gray-400'}`} />
            <span className="truncate text-sm">
              {selectedProject ? selectedProject.name : 'Selecteer project'}
            </span>
            {selectedProject && showKnowledgeBase && selectedProject.knowledgeBaseCount && selectedProject.knowledgeBaseCount > 0 && (
              <BookOpen className="w-3 h-3 text-[#ff6b35] flex-shrink-0" />
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-[70vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DropdownMenuLabel className="text-gray-400 text-xs sticky top-0 bg-zinc-900 z-10">Selecteer een project</DropdownMenuLabel>
        {(projects || []).map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleSelectProject(project)}
            className="flex items-start justify-between cursor-pointer hover:bg-zinc-800 text-white p-3"
          >
            <div className="flex-1 min-w-0 mr-2">
              <div className="font-medium text-sm flex items-center gap-2">
                {project.name}
                {project.isPrimary && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#ff6b35] text-white">
                    Primair
                  </span>
                )}
                {project.isCollaborator && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    👥 Gedeeld
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5">
                {project.websiteUrl.replace(/^https?:\/\//, '')}
              </div>
              {project.isCollaborator && project.sharedByName && (
                <div className="text-xs text-blue-400/70 mt-0.5">
                  Gedeeld door: {project.sharedByName}
                </div>
              )}
              <div className="flex flex-col gap-0.5 mt-1">
                {project.wordpressUrl && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-400">WordPress verbonden</span>
                  </div>
                )}
                {project.affiliateLinksCount && project.affiliateLinksCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">📍 {project.affiliateLinksCount} affiliate links</span>
                  </div>
                )}
                {project.hasSitemap && project.sitemapUrlsCount && project.sitemapUrlsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">🗺️ Sitemap geladen ({project.sitemapUrlsCount} URLs)</span>
                  </div>
                )}
                {showKnowledgeBase && project.knowledgeBaseCount && project.knowledgeBaseCount > 0 && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#ff6b35]" />
                    <span className="text-xs text-gray-400">
                      {project.knowledgeBaseCount} items in kennisbank
                    </span>
                  </div>
                )}
              </div>
            </div>
            {selectedProject?.id === project.id && (
              <Check className="w-4 h-4 text-[#ff6b35] flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        {selectedProject && (
          <>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              onClick={handleClearSelection}
              className="cursor-pointer hover:bg-zinc-800 text-gray-400 text-sm"
            >
              Geen project gebruiken
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-zinc-700" />
        <DropdownMenuItem asChild>
          <Link 
            href="/client-portal/projects" 
            className="cursor-pointer hover:bg-zinc-800 text-[#ff6b35] text-sm flex items-center gap-2"
          >
            <Globe className="w-3 h-3" />
            Beheer projecten
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
