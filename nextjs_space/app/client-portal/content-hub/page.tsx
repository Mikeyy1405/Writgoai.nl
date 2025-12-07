'use client';

import { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import ProjectSelector, { Project } from '@/components/project-selector';
import ProjectContentHub from '@/components/project-content-hub';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Content Hub Standalone Page
 * 
 * This page provides a centralized Content Hub where users can:
 * - Select a project from a dropdown
 * - Access all Content Planning functionality (Topical Map, Bibliotheek, Autopilot)
 * - Manage content generation for the selected project
 * 
 * All project data (site info, knowledge base, affiliate links, integrations) 
 * is automatically available based on the selected project.
 */
export default function ContentHubPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectChange = (projectId: string | null, project: Project | null) => {
    setSelectedProjectId(projectId);
    setSelectedProject(project);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-[#ff6b35]" />
            <h1 className="text-3xl font-bold text-white">Content Hub</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Selecteer een project om content te plannen en te beheren
          </p>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Selecteer Project
          </label>
          <ProjectSelector
            value={selectedProjectId}
            onChange={handleProjectChange}
            autoSelectPrimary={true}
            showKnowledgeBase={true}
            label="Selecteer een project"
          />
        </div>

        {/* Content Hub Content */}
        {selectedProject ? (
          <ProjectContentHub 
            projectId={selectedProject.id} 
            projectUrl={selectedProject.websiteUrl}
          />
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Geen project geselecteerd
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Selecteer een project bovenaan om de Content Hub te gebruiken. 
                Als je nog geen project hebt, maak er dan eerst een aan via de Projecten pagina.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
