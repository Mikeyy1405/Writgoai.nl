'use client';

import React, { useState } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { AddProjectDialog } from './AddProjectDialog';
import { useRouter } from 'next/navigation';

export function ProjectSwitcher() {
  const { currentProject, projects, switchProject, loading } = useProject();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg animate-pulse">
        <Globe className="w-4 h-4" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
    );
  }

  if (!currentProject && projects.length === 0) {
    return (
      <Button
        onClick={() => setShowAddDialog(true)}
        className="w-full justify-start gap-2"
        variant="outline"
      >
        <Plus className="w-4 h-4" />
        <span>Voeg Project Toe</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 bg-white/5 hover:bg-white/10 border-white/10 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 flex-shrink-0 text-orange-400" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-sm">
                  {currentProject?.name || 'Selecteer Project'}
                </div>
                {currentProject?.websiteUrl && (
                  <div className="text-xs text-muted-foreground truncate">
                    {currentProject.websiteUrl}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[320px]">
          {/* Huidig Project */}
          {currentProject && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Huidig Project
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-start gap-2 py-3 cursor-default">
                <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{currentProject.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {currentProject.websiteUrl}
                  </div>
                  {currentProject.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {currentProject.description}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Andere Projecten */}
          {projects.filter(p => p.id !== currentProject?.id).length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Andere Projecten
              </DropdownMenuLabel>
              {projects
                .filter(p => p.id !== currentProject?.id)
                .map(project => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => switchProject(project.id)}
                    className="flex items-start gap-2 py-3 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 mt-0.5 text-orange-400/60 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {project.websiteUrl}
                      </div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Acties */}
          <DropdownMenuItem
            onClick={() => setShowAddDialog(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw Project Toevoegen</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push('/admin/projects')}
            className="gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Projecten Beheren</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Project Dialog */}
      {showAddDialog && (
        <AddProjectDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </>
  );
}
