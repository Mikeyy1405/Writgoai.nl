'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  FileText,
  Rocket,
  Lightbulb,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  Loader2,
} from 'lucide-react';
import CalendarTab from './tabs/calendar-tab';
import PostsTab from './tabs/posts-tab';
import QueueTab from './tabs/queue-tab';
import IdeasTab from './tabs/ideas-tab';
import AnalyticsTab from './tabs/analytics-tab';
import SettingsTab from './tabs/settings-tab';
import PostCreatorModal from './components/post-creator-modal';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  isPrimary: boolean;
}

export default function SocialMediaSuitePage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch('/api/client/projects');
      
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);

      // Auto-select primary project
      const primaryProject = data.projects?.find((p: Project) => p.isPrimary);
      if (primaryProject) {
        setSelectedProjectId(primaryProject.id);
      } else if (data.projects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Kon projecten niet laden');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handlePostCreated = () => {
    setShowPostCreator(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Post succesvol aangemaakt!');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📱 Social Media Suite
            <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/50">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Complete social media management met AI, scheduling en analytics
          </p>
        </div>
        
        <Button
          onClick={() => setShowPostCreator(true)}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600"
          disabled={!selectedProjectId || loadingProjects}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Post
        </Button>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="project-select" className="text-sm font-medium whitespace-nowrap">
              Project:
            </label>
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              disabled={loadingProjects}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {loadingProjects ? (
                <option>Laden...</option>
              ) : projects.length === 0 ? (
                <option>Geen projecten beschikbaar</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.isPrimary ? '(Primair)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Kalender</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            <span className="hidden sm:inline">Wachtrij</span>
          </TabsTrigger>
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Ideeën</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Instellingen</span>
          </TabsTrigger>
        </TabsList>

        {selectedProjectId && !loadingProjects ? (
          <>
            <TabsContent value="calendar" className="mt-6">
              <CalendarTab projectId={selectedProjectId} refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="posts" className="mt-6">
              <PostsTab projectId={selectedProjectId} refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="queue" className="mt-6">
              <QueueTab projectId={selectedProjectId} refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="ideas" className="mt-6">
              <IdeasTab projectId={selectedProjectId} onCreatePost={() => setShowPostCreator(true)} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsTab projectId={selectedProjectId} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsTab projectId={selectedProjectId} />
            </TabsContent>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            {loadingProjects ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            ) : (
              <p className="text-muted-foreground">Selecteer een project om te beginnen</p>
            )}
          </div>
        )}
      </Tabs>

      {/* Post Creator Modal */}
      {selectedProjectId && (
        <PostCreatorModal
          isOpen={showPostCreator}
          onClose={() => setShowPostCreator(false)}
          projectId={selectedProjectId}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
