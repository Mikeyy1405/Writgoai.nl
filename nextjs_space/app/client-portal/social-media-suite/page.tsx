'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Calendar, Users } from 'lucide-react';
import AccountsTab from './components/accounts-tab';
import PlanningTab from './components/planning-tab';
import CreatePostTab from './components/create-post-tab';
import OverviewTab from './components/overview-tab';
import ContentIdeasTab from './components/content-ideas-tab';
import ProjectSelector, { Project } from '@/components/project-selector';

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  suggestedPlatforms: string[];
  category: string;
  urgency: string;
  estimatedEngagement: number;
}

export default function SocialMediaSuitePage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ideas');
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  const handleProjectChange = (projectId: string | null, project: Project | null) => {
    setSelectedProjectId(projectId);
    setProjectLoading(false);
  };

  // Set loading to false after a timeout to handle cases where ProjectSelector
  // doesn't call onChange (e.g., when there are no projects)
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjectLoading(false);
    }, 2000); // Give ProjectSelector 2 seconds to load and auto-select
    return () => clearTimeout(timer);
  }, []);

  const handleCreateFromIdea = (idea: ContentIdea) => {
    // Switch to create post tab with the idea pre-filled
    setSelectedIdea(idea);
    setActiveTab('create');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Hero Section with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              📱 Social Media Suite
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Beheer al je social media accounts en posts op één plek
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Content Ideeën</p>
                  <p className="text-2xl font-bold text-white">AI Generator</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Multi-Platform</p>
                  <p className="text-2xl font-bold text-white">6 Platforms</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planning</p>
                  <p className="text-2xl font-bold text-white">Smart Scheduling</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ideas">💡 Ideeën</TabsTrigger>
          <TabsTrigger value="create">✏️ Post Maken</TabsTrigger>
          <TabsTrigger value="planning">📅 Planning</TabsTrigger>
          <TabsTrigger value="accounts">🔗 Accounts</TabsTrigger>
          <TabsTrigger value="overview">📊 Overzicht</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <ContentIdeasTab 
            projectId={selectedProjectId}
            projectLoading={projectLoading}
            onCreateFromIdea={handleCreateFromIdea}
          />
        </TabsContent>

        <TabsContent value="create">
          <CreatePostTab 
            projectId={selectedProjectId}
            projectLoading={projectLoading}
            initialIdea={selectedIdea}
          />
        </TabsContent>

        <TabsContent value="planning">
          <PlanningTab projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsTab projectId={selectedProjectId} />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
