'use client';

/**
 * Unified Planning Interface
 * Single page for all content planning and research needs
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  RefreshCw,
  Search,
  TrendingUp,
  Target,
  BarChart3,
  Globe,
  Sparkles,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  websiteUrl?: string;
  niche?: string;
}

interface ContentIdea {
  id: string;
  title: string;
  focusKeyword: string;
  priority: string;
  status: string;
  aiScore: number;
  trending: boolean;
  competitorGap: boolean;
}

export default function PlanningPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load content ideas when project changes
  useEffect(() => {
    if (selectedProject) {
      loadContentPlan();
    }
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const res = await fetch('/api/client/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.projects?.length > 0) {
        setSelectedProject(data.projects[0].id);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Kon projecten niet laden');
    }
  }

  async function loadContentPlan() {
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/client/planning?projectId=${selectedProject}`);
      if (!res.ok) throw new Error('Failed to load content plan');
      const data = await res.json();
      setContentIdeas(data.articleIdeas || []);
    } catch (error: any) {
      console.error('Error loading content plan:', error);
    }
  }

  async function generatePlan() {
    if (!selectedProject) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/client/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          projectId: selectedProject,
          options: {}
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate plan');
      }

      const data = await res.json();
      toast.success(data.message || 'Content plan gegenereerd!');
      await loadContentPlan();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast.error(error.message || 'Fout bij genereren plan');
    } finally {
      setLoading(false);
    }
  }

  async function refreshPlan() {
    if (!selectedProject) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/client/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh',
          projectId: selectedProject,
          options: {}
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to refresh plan');
      }

      const data = await res.json();
      toast.success(data.message || 'Plan vernieuwd!');
      await loadContentPlan();
    } catch (error: any) {
      console.error('Error refreshing plan:', error);
      toast.error(error.message || 'Fout bij vernieuwen plan');
    } finally {
      setLoading(false);
    }
  }

  async function analyzeSite() {
    if (!selectedProject) {
      toast.error('Selecteer eerst een project');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/client/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          projectId: selectedProject,
          options: {}
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to analyze site');
      }

      const data = await res.json();
      toast.success(data.message || 'Website geanalyseerd!');
    } catch (error: any) {
      console.error('Error analyzing site:', error);
      toast.error(error.message || 'Fout bij analyseren website');
    } finally {
      setLoading(false);
    }
  }

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Planning</h1>
            <p className="text-gray-400">
              Unified interface voor content planning en keyword research
            </p>
          </div>
          
          {/* Project Selector */}
          <div className="flex items-center gap-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Selecteer project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        {currentProject && (
          <Card className="bg-[#1a1a1a] border-gray-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={generatePlan}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? 'Genereren...' : 'Genereer Plan'}
              </Button>
              
              <Button
                onClick={refreshPlan}
                disabled={loading}
                variant="outline"
                className="border-gray-700 text-white hover:bg-[#2a2a2a]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Vernieuw Ideeën
              </Button>
              
              <Button
                onClick={analyzeSite}
                disabled={loading}
                variant="outline"
                className="border-gray-700 text-white hover:bg-[#2a2a2a]"
              >
                <Globe className="w-4 h-4 mr-2" />
                Analyseer Website
              </Button>
            </div>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1a1a1a] border-b border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2a2a2a]">
              <Calendar className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ideas" className="data-[state=active]:bg-[#2a2a2a]">
              <Lightbulb className="w-4 h-4 mr-2" />
              Content Ideas ({contentIdeas.length})
            </TabsTrigger>
            <TabsTrigger value="keywords" className="data-[state=active]:bg-[#2a2a2a]">
              <Search className="w-4 h-4 mr-2" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-[#2a2a2a]">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1a1a1a] border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Lightbulb className="w-8 h-8 text-orange-500" />
                  <Badge variant="secondary">{contentIdeas.length}</Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">Content Ideeën</h3>
                <p className="text-gray-400 text-sm">
                  Gegenereerde content ideeën voor dit project
                </p>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-blue-500" />
                  <Badge variant="secondary">
                    {contentIdeas.filter(i => i.priority === 'high').length}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">High Priority</h3>
                <p className="text-gray-400 text-sm">
                  Belangrijke content om snel mee te starten
                </p>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <Badge variant="secondary">
                    {contentIdeas.filter(i => i.trending).length}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">Trending</h3>
                <p className="text-gray-400 text-sm">
                  Actuele onderwerpen met veel potentie
                </p>
              </Card>
            </div>

            {currentProject && (
              <Card className="bg-[#1a1a1a] border-gray-800 p-6 mt-6">
                <h3 className="text-xl font-semibold mb-4">Project Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Naam:</span>{' '}
                    <span className="text-white">{currentProject.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Website:</span>{' '}
                    <span className="text-white">{currentProject.websiteUrl || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Niche:</span>{' '}
                    <span className="text-white">{currentProject.niche || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Content Ideeën:</span>{' '}
                    <span className="text-white">{contentIdeas.length}</span>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Content Ideas Tab */}
          <TabsContent value="ideas" className="mt-6">
            <Card className="bg-[#1a1a1a] border-gray-800 p-6">
              <h3 className="text-xl font-semibold mb-4">Content Ideeën</h3>
              
              {contentIdeas.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Nog geen content ideeën gegenereerd
                  </p>
                  <Button
                    onClick={generatePlan}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genereer Content Plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentIdeas.map(idea => (
                    <div
                      key={idea.id}
                      className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 hover:bg-[#3a3a3a] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-semibold flex-1">{idea.title}</h4>
                        <div className="flex gap-2 ml-4">
                          {idea.trending && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                          {idea.competitorGap && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                              <Target className="w-3 h-3 mr-1" />
                              Gap
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-gray-600">
                            {idea.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Keyword: {idea.focusKeyword}</span>
                        <span>•</span>
                        <span>Score: {idea.aiScore}</span>
                        <span>•</span>
                        <span className="capitalize">{idea.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="mt-6">
            <Card className="bg-[#1a1a1a] border-gray-800 p-6">
              <h3 className="text-xl font-semibold mb-4">Keyword Research</h3>
              <p className="text-gray-400 mb-4">
                Keyword research functionaliteit wordt binnenkort toegevoegd via het unified research endpoint.
              </p>
              <Button variant="outline" className="border-gray-700" disabled>
                <Search className="w-4 h-4 mr-2" />
                Start Keyword Research
              </Button>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6">
            <Card className="bg-[#1a1a1a] border-gray-800 p-6">
              <h3 className="text-xl font-semibold mb-4">Trending Topics</h3>
              <p className="text-gray-400 mb-4">
                Trending topics worden automatisch meegenomen bij het genereren van een content plan.
              </p>
              <Button
                onClick={generatePlan}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Update Trends
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
