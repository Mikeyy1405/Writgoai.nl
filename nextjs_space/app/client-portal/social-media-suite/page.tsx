'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountsTab from './components/accounts-tab';
import PlanningTab from './components/planning-tab';
import CreatePostTab from './components/create-post-tab';
import OverviewTab from './components/overview-tab';
import ProjectSelector, { Project } from '@/components/project-selector';

export default function SocialMediaSuitePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectChange = (projectId: string | null, project: Project | null) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📱 Social Media Suite</h1>
          <p className="text-muted-foreground">
            Beheer al je social media accounts en posts op één plek
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="max-w-md">
        <label className="block text-sm font-medium mb-2">
          Selecteer Project
        </label>
        <ProjectSelector
          value={selectedProjectId}
          onChange={handleProjectChange}
          autoSelectPrimary={true}
          showKnowledgeBase={false}
        />
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">🔗 Accounts</TabsTrigger>
          <TabsTrigger value="planning">📅 Planning</TabsTrigger>
          <TabsTrigger value="create">✏️ Post Maken</TabsTrigger>
          <TabsTrigger value="overview">📊 Overzicht</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsTab projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="planning">
          <PlanningTab />
        </TabsContent>

        <TabsContent value="create">
          <CreatePostTab />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
