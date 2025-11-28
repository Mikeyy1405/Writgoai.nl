'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/content-planner/KanbanBoard';
import { 
  Loader2, 
  ArrowLeft,
  Wand2,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ArticleIdea, ArticleStatus } from '@/types/database';
import Link from 'next/link';

export default function ContentPlannerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [ideas, setIdeas] = useState<Record<ArticleStatus, ArticleIdea[]>>({
    idea: [],
    planned: [],
    writing: [],
    review: [],
    published: [],
  });
  const [project, setProject] = useState<{ name: string; websiteUrl: string } | null>(null);
  const [hasSitePlan, setHasSitePlan] = useState(false);

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/ideas?groupByStatus=true`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ideas');
      }

      setIdeas(data.ideas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast.error('Fout bij ophalen ideeën');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch project info
  const fetchProject = useCallback(async () => {
    try {
      // Get project details from existing API
      const response = await fetch('/api/client/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const project = data.projects?.find((p: { id: string }) => p.id === projectId);
      if (project) {
        setProject({ name: project.name, websiteUrl: project.websiteUrl });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [projectId]);

  // Check if site plan exists
  const checkSitePlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/site-plan`);
      const data = await response.json();
      setHasSitePlan(!!data.sitePlan);
    } catch (error) {
      console.error('Error checking site plan:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchIdeas();
    checkSitePlan();
  }, [fetchProject, fetchIdeas, checkSitePlan]);

  // Calculate stats
  const stats = {
    total: Object.values(ideas).reduce((acc, list) => acc + list.length, 0),
    idea: ideas.idea.length,
    planned: ideas.planned.length,
    writing: ideas.writing.length,
    review: ideas.review.length,
    published: ideas.published.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/client/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Content Planner</h1>
              <p className="text-muted-foreground">
                {project?.name || 'Project'} - {project?.websiteUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!hasSitePlan && (
              <Button asChild>
                <Link href={`/client/projects/${projectId}/site-planner`}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Site Plan Genereren
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Totaal</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ideeën</p>
                  <p className="text-2xl font-bold">{stats.idea}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gepland</p>
                  <p className="text-2xl font-bold">{stats.planned}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Schrijven</p>
                  <p className="text-2xl font-bold">{stats.writing}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Review</p>
                  <p className="text-2xl font-bold">{stats.review}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gepubliceerd</p>
                  <p className="text-2xl font-bold">{stats.published}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats.total === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Geen content ideeën gevonden
                </h3>
                <p className="text-muted-foreground mb-4">
                  Genereer een site plan om automatisch 50+ artikel ideeën te krijgen
                </p>
                <Button asChild>
                  <Link href={`/client/projects/${projectId}/site-planner`}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Site Plan Genereren
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <KanbanBoard
            projectId={projectId}
            ideas={ideas}
            onRefresh={fetchIdeas}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
