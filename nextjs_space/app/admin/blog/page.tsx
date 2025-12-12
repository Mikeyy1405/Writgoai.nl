'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  MessageSquare,
  Loader2,
  TrendingUp,
  Hash,
  FileEdit,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PipelineStep, PipelineContainer } from '@/components/pipeline/PipelineStep';
import { AutopilotToggle } from '@/components/autopilot/AutopilotToggle';
import TopicalAuthorityMapGenerator from '@/components/blog/TopicalAuthorityMapGenerator';

interface PipelineStatus {
  hasActivePlan: boolean;
  planId?: string;
  plannedArticles: number;
  generatedArticles: number;
  publishedArticles: number;
  generationProgress: number;
  generationStatus: 'idle' | 'active' | 'completed' | 'paused';
  autopilotEnabled: boolean;
}

interface SocialPipelineStatus {
  hasActivePlan: boolean;
  planId?: string;
  plannedPosts: number;
  generatedPosts: number;
  postedPosts: number;
  generationProgress: number;
  generationStatus: 'idle' | 'active' | 'completed' | 'paused';
  autopilotEnabled: boolean;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'pipelines' | 'topical-map' | 'social-strategy'>('pipelines');
  
  // Pipeline states
  const [blogPipeline, setBlogPipeline] = useState<PipelineStatus>({
    hasActivePlan: false,
    plannedArticles: 0,
    generatedArticles: 0,
    publishedArticles: 0,
    generationProgress: 0,
    generationStatus: 'idle',
    autopilotEnabled: false,
  });

  const [socialPipeline, setSocialPipeline] = useState<SocialPipelineStatus>({
    hasActivePlan: false,
    plannedPosts: 0,
    generatedPosts: 0,
    postedPosts: 0,
    generationProgress: 0,
    generationStatus: 'idle',
    autopilotEnabled: false,
  });

  useEffect(() => {
    fetchPipelineStatus();
  }, []);

  const fetchPipelineStatus = async () => {
    try {
      // Fetch blog pipeline status
      const blogRes = await fetch('/api/admin/blog/pipeline/status');
      if (blogRes.ok) {
        const blogData = await blogRes.json();
        setBlogPipeline(blogData);
      }

      // Fetch social pipeline status
      const socialRes = await fetch('/api/admin/social/pipeline/status');
      if (socialRes.ok) {
        const socialData = await socialRes.json();
        setSocialPipeline(socialData);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBlogGeneration = async () => {
    if (!blogPipeline.planId) {
      toast.error('Geen actief plan gevonden');
      return;
    }

    try {
      const res = await fetch('/api/admin/blog/topical-map/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: blogPipeline.planId }),
      });

      if (!res.ok) throw new Error('Generatie mislukt');

      toast.success('✨ Batch generatie gestart!');
      fetchPipelineStatus();
    } catch (error) {
      toast.error('Fout bij starten generatie');
    }
  };

  const handleStartSocialGeneration = async () => {
    if (!socialPipeline.planId) {
      toast.error('Geen actief plan gevonden');
      return;
    }

    try {
      const res = await fetch('/api/admin/social/strategy/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: socialPipeline.planId }),
      });

      if (!res.ok) throw new Error('Generatie mislukt');

      toast.success('✨ Social media generatie gestart!');
      fetchPipelineStatus();
    } catch (error) {
      toast.error('Fout bij starten social media generatie');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-orange-500/20 border border-orange-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Content Management
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Content Pipelines
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Complete workflow van planning tot publicatie voor blog en social media
            </p>
          </div>
        </div>

        {/* View: Pipelines Overview */}
        {view === 'pipelines' && (
          <div className="space-y-8">
            
            {/* Blog Content Pipeline */}
            <PipelineContainer
              title="📝 Blog Content Pipeline"
              description="Complete workflow van planning tot publicatie voor blog artikelen"
              icon={<FileText className="w-8 h-8 text-orange-400" />}
            >
              {/* Step 1: Planning */}
              <PipelineStep
                number={1}
                title="Topical Authority Map"
                description="Genereer 100-500 artikel strategie met pillar/cluster structuur voor maximale SEO ranking"
                action={blogPipeline.hasActivePlan ? 'Bekijk Plan' : 'Start Planning'}
                onClick={() => setView('topical-map')}
                status={blogPipeline.hasActivePlan ? 'completed' : 'idle'}
                stats={
                  blogPipeline.hasActivePlan
                    ? [
                        {
                          label: 'Geplande Artikelen',
                          value: blogPipeline.plannedArticles,
                        },
                      ]
                    : undefined
                }
              />

              {/* Step 2: Generation */}
              <PipelineStep
                number={2}
                title="Batch Generatie"
                description="Automatisch alle artikelen genereren met WritgoAI - hoogwaardige, SEO-geoptimaliseerde content"
                action={
                  blogPipeline.generationStatus === 'active'
                    ? 'Bezig...'
                    : blogPipeline.generationStatus === 'completed'
                    ? 'Herstart Generatie'
                    : 'Start Generatie'
                }
                onClick={handleStartBlogGeneration}
                status={blogPipeline.generationStatus}
                disabled={!blogPipeline.hasActivePlan}
                stats={
                  blogPipeline.hasActivePlan
                    ? [
                        {
                          label: 'Gegenereerd',
                          value: `${blogPipeline.generatedArticles}/${blogPipeline.plannedArticles}`,
                        },
                        {
                          label: 'Voortgang',
                          value: `${blogPipeline.generationProgress}%`,
                        },
                      ]
                    : undefined
                }
              />

              {/* Step 3: Autopilot */}
              <PipelineStep
                number={3}
                title="Autopilot Publicatie"
                description="Automatisch publiceren naar WordPress volgens ingestelde schema - volledige hands-off workflow"
                status={
                  blogPipeline.autopilotEnabled
                    ? 'completed'
                    : blogPipeline.generatedArticles > 0
                    ? 'idle'
                    : 'idle'
                }
                disabled={blogPipeline.generatedArticles === 0}
                showConnector={false}
                toggle={
                  <AutopilotToggle
                    type="blog"
                    planId={blogPipeline.planId}
                    onConfigChange={(config) => {
                      setBlogPipeline({
                        ...blogPipeline,
                        autopilotEnabled: config.enabled,
                      });
                    }}
                  />
                }
                stats={
                  blogPipeline.publishedArticles > 0
                    ? [
                        {
                          label: 'Gepubliceerd',
                          value: blogPipeline.publishedArticles,
                        },
                      ]
                    : undefined
                }
              />
            </PipelineContainer>

            {/* Social Media Pipeline */}
            <PipelineContainer
              title="📱 Social Media Pipeline"
              description="Complete workflow van planning tot posting voor social media content"
              icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
            >
              {/* Step 1: Planning */}
              <PipelineStep
                number={1}
                title="Social Media Strategie"
                description="Genereer 100-500 posts strategie voor LinkedIn, Instagram, Facebook, Twitter en meer"
                action={socialPipeline.hasActivePlan ? 'Bekijk Strategie' : 'Start Planning'}
                onClick={() => setView('social-strategy')}
                status={socialPipeline.hasActivePlan ? 'completed' : 'idle'}
                stats={
                  socialPipeline.hasActivePlan
                    ? [
                        {
                          label: 'Geplande Posts',
                          value: socialPipeline.plannedPosts,
                        },
                      ]
                    : undefined
                }
              />

              {/* Step 2: Generation */}
              <PipelineStep
                number={2}
                title="Batch Generatie"
                description="Automatisch alle social media posts genereren - engaging content voor elk platform"
                action={
                  socialPipeline.generationStatus === 'active'
                    ? 'Bezig...'
                    : socialPipeline.generationStatus === 'completed'
                    ? 'Herstart Generatie'
                    : 'Start Generatie'
                }
                onClick={handleStartSocialGeneration}
                status={socialPipeline.generationStatus}
                disabled={!socialPipeline.hasActivePlan}
                stats={
                  socialPipeline.hasActivePlan
                    ? [
                        {
                          label: 'Gegenereerd',
                          value: `${socialPipeline.generatedPosts}/${socialPipeline.plannedPosts}`,
                        },
                        {
                          label: 'Voortgang',
                          value: `${socialPipeline.generationProgress}%`,
                        },
                      ]
                    : undefined
                }
              />

              {/* Step 3: Autopilot */}
              <PipelineStep
                number={3}
                title="Autopilot Posting"
                description="Automatisch posten via Later.com of Buffer - consistente social media aanwezigheid"
                status={
                  socialPipeline.autopilotEnabled
                    ? 'completed'
                    : socialPipeline.generatedPosts > 0
                    ? 'idle'
                    : 'idle'
                }
                disabled={socialPipeline.generatedPosts === 0}
                showConnector={false}
                toggle={
                  <AutopilotToggle
                    type="social"
                    planId={socialPipeline.planId}
                    onConfigChange={(config) => {
                      setSocialPipeline({
                        ...socialPipeline,
                        autopilotEnabled: config.enabled,
                      });
                    }}
                  />
                }
                stats={
                  socialPipeline.postedPosts > 0
                    ? [
                        {
                          label: 'Gepost',
                          value: socialPipeline.postedPosts,
                        },
                      ]
                    : undefined
                }
              />
            </PipelineContainer>

            {/* Quick Actions - Handmatig */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-gray-400" />
                  Handmatige Acties
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/admin/blog/editor')}
                  className="h-14 border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/10 text-white justify-start"
                >
                  <FileEdit className="w-5 h-5 mr-3 text-orange-400" />
                  <div className="text-left">
                    <div className="font-semibold">Nieuw Artikel Schrijven</div>
                    <div className="text-xs text-gray-400">Geavanceerde editor met SEO tools</div>
                  </div>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/admin/blog/library')}
                  className="h-14 border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-white justify-start"
                >
                  <FileText className="w-5 h-5 mr-3 text-blue-400" />
                  <div className="text-left">
                    <div className="font-semibold">Content Bibliotheek</div>
                    <div className="text-xs text-gray-400">Bekijk alle gegenereerde content</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-blue-500/20 rounded-lg">
                  <Hash className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hoe werken de pipelines?
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      <strong>Stap 1:</strong> Genereer een complete content strategie (100-500 items)
                    </p>
                    <p>
                      <strong>Stap 2:</strong> Laat AI automatisch alle content genereren
                    </p>
                    <p>
                      <strong>Stap 3:</strong> Zet autopilot aan voor automatische publicatie volgens schema
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* View: Topical Authority Map Generator */}
        {view === 'topical-map' && (
          <div className="space-y-6">
            {/* Header with back button */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                    Topical Authority Map Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView('pipelines');
                      fetchPipelineStatus();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ← Terug naar Pipelines
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Topical Authority Map Generator Component */}
            <TopicalAuthorityMapGenerator
              onComplete={() => {
                setView('pipelines');
                fetchPipelineStatus();
              }}
            />
          </div>
        )}

        {/* View: Social Media Strategy Generator */}
        {view === 'social-strategy' && (
          <div className="space-y-6">
            {/* Header with back button */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                    Social Media Strategie Generator
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView('pipelines');
                      fetchPipelineStatus();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ← Terug naar Pipelines
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Coming Soon Banner */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/30">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Social Media Pipeline - Coming Soon!
                </h3>
                <p className="text-gray-300 mb-6">
                  Deze functie komt binnenkort beschikbaar. Je kunt dan automatisch social media
                  content genereren en plannen voor alle platforms.
                </p>
                <Button
                  onClick={() => setView('pipelines')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Terug naar Pipelines
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
