'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SitePlannerWizard } from '@/components/site-planner/SitePlannerWizard';
import { 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  FileText,
  Target,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SitePlan } from '@/types/database';
import Link from 'next/link';

export default function SitePlannerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<{
    name: string;
    websiteUrl: string;
    keywords: string[];
    targetAudience: string;
    niche: string;
  } | null>(null);
  const [existingPlan, setExistingPlan] = useState<SitePlan | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Fetch project info
  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch('/api/client/projects');
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const proj = data.projects?.find((p: { id: string }) => p.id === projectId);
      if (proj) {
        setProject({
          name: proj.name,
          websiteUrl: proj.websiteUrl,
          keywords: proj.keywords || [],
          targetAudience: proj.targetAudience || '',
          niche: proj.niche || '',
        });
      } else {
        toast.error('Project niet gevonden');
        router.push('/client/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Fout bij ophalen project');
    }
  }, [projectId, router]);

  // Check for existing site plan
  const checkSitePlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/site-plan`);
      const data = await response.json();
      
      if (data.sitePlan) {
        setExistingPlan(data.sitePlan);
      } else {
        setShowWizard(true);
      }
    } catch (error) {
      console.error('Error checking site plan:', error);
      setShowWizard(true);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    checkSitePlan();
  }, [fetchProject, checkSitePlan]);

  // Handle wizard completion
  const handleWizardComplete = (sitePlan: SitePlan) => {
    if (sitePlan) {
      setExistingPlan(sitePlan);
      setShowWizard(false);
    }
    router.push(`/client/projects/${projectId}/content-planner`);
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setShowWizard(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showWizard && project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setShowWizard(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Site Planner</h1>
              <p className="text-muted-foreground">
                Genereer een complete content strategie
              </p>
            </div>
          </div>

          <SitePlannerWizard
            projectId={projectId}
            projectName={project.name}
            websiteUrl={project.websiteUrl}
            existingKeywords={project.keywords}
            existingTargetAudience={project.targetAudience}
            existingNiche={project.niche}
            onComplete={handleWizardComplete}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    );
  }

  // Show existing plan summary
  if (existingPlan) {
    const pillarCount = Array.isArray(existingPlan.pillarPages) 
      ? existingPlan.pillarPages.length : 0;
    const clusterCount = Array.isArray(existingPlan.clusterPages) 
      ? existingPlan.clusterPages.length : 0;
    const blogCount = Array.isArray(existingPlan.blogPosts) 
      ? existingPlan.blogPosts.length : 0;
    const totalArticles = pillarCount + clusterCount + blogCount;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/client/projects">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Site Planner</h1>
                <p className="text-muted-foreground">
                  {project?.name} - Content Strategie
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate}>
                Opnieuw Genereren
              </Button>
              <Button asChild>
                <Link href={`/client/projects/${projectId}/content-planner`}>
                  Naar Content Planner
                </Link>
              </Button>
            </div>
          </div>

          {/* Plan Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Target className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pillarCount}</p>
                    <p className="text-sm text-muted-foreground">Pillar Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <Layers className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{clusterCount}</p>
                    <p className="text-sm text-muted-foreground">Cluster Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{blogCount}</p>
                    <p className="text-sm text-muted-foreground">Blog Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">
                  Content Strategie Gereed!
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Je site plan is succesvol gegenereerd met {totalArticles} artikel ideeën.
                  Ga naar de Content Planner om je artikelen te beheren.
                </p>
                <Button size="lg" asChild>
                  <Link href={`/client/projects/${projectId}/content-planner`}>
                    Open Content Planner
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          {existingPlan.keywords && existingPlan.keywords.length > 0 && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {existingPlan.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return null;
}
