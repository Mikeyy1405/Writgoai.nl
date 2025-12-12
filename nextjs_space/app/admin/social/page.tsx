'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Share2,
  Loader2,
  MessageSquare,
  Hash,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PipelineStep, PipelineContainer } from '@/components/pipeline/PipelineStep';
import { AutopilotToggle } from '@/components/autopilot/AutopilotToggle';
import WebsiteAnalyzer from '@/components/analyzer/WebsiteAnalyzer';
import SocialMediaStrategyGenerator from '@/components/social/SocialMediaStrategyGenerator';

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

interface WebsiteAnalysis {
  niche: string;
  nicheConfidence: number;
  targetAudience: string;
  audienceConfidence: number;
  tone: string;
  toneConfidence: number;
  keywords: string[];
  themes: string[];
  reasoning: string;
}

export default function AdminSocialMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'pipeline' | 'strategy-generator'>('pipeline');
  const [clientId, setClientId] = useState<string>('');
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [showStrategyGenerator, setShowStrategyGenerator] = useState(false);
  
  // Pipeline state
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch pipeline status
      const pipelineRes = await fetch('/api/admin/social/pipeline/status');
      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        setSocialPipeline(pipelineData);
      }

      // Get current user/client
      const session = await fetch('/api/auth/session');
      if (session.ok) {
        const sessionData = await session.json();
        // In admin context, we might need to select a client
        // For now, using a placeholder - you'll need to implement client selection
        setClientId('default-client-id');
      }

      // Try to fetch existing website analysis
      if (clientId) {
        const analysisRes = await fetch(`/api/admin/analyzer/website?clientId=${clientId}`);
        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          setWebsiteAnalysis(analysisData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
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
      fetchInitialData();
    } catch (error) {
      toast.error('Fout bij starten social media generatie');
    }
  };

  const handleAnalysisComplete = (analysis: WebsiteAnalysis) => {
    setWebsiteAnalysis(analysis);
    toast.success('✅ Website analyse beschikbaar voor strategie!');
  };

  const handleStrategyComplete = () => {
    setShowStrategyGenerator(false);
    setView('pipeline');
    fetchInitialData();
    toast.success('✅ Social media strategie aangemaakt!');
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
        <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-blue-500/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Social Media Management
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Complete Social Media Pipeline
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Van AI-gestuurde strategie tot automatische posting op alle platforms
            </p>
          </div>
        </div>

        {/* View: Pipeline */}
        {view === 'pipeline' && (
          <div className="space-y-8">
            
            {/* AI Website Analyzer */}
            <WebsiteAnalyzer
              clientId={clientId}
              onAnalysisComplete={handleAnalysisComplete}
              existingAnalysis={websiteAnalysis}
            />

            {/* Social Media Pipeline */}
            <PipelineContainer
              title="📱 Social Media Content Pipeline"
              description="Van strategie tot automatische posting voor alle platforms"
              icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
            >
              {/* Step 1: Strategy */}
              <PipelineStep
                number={1}
                title="Social Media Strategie"
                description="Genereer 100-500 posts voor LinkedIn, Instagram, Facebook, Twitter en meer platforms"
                action={socialPipeline.hasActivePlan ? 'Bekijk Strategie' : 'Start Planning'}
                onClick={() => setShowStrategyGenerator(true)}
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
                description="Automatisch alle posts genereren - engaging content voor elk platform met AI"
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
                description="Automatisch posten via Later.com - consistente social media aanwezigheid zonder handmatig werk"
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

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-blue-500/20 rounded-lg">
                  <Hash className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hoe werkt de Social Media Pipeline?
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>
                      <strong>Stap 0:</strong> AI analyseert je website om niche, doelgroep en tone te detecteren
                    </p>
                    <p>
                      <strong>Stap 1:</strong> Genereer een complete social media strategie (100-500 posts) met AI
                    </p>
                    <p>
                      <strong>Stap 2:</strong> Laat AI automatisch alle content genereren per platform
                    </p>
                    <p>
                      <strong>Stap 3:</strong> Zet autopilot aan voor automatische posting via Later.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Strategy Generator Modal/View */}
        {showStrategyGenerator && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen px-4 py-8">
              <div className="max-w-5xl mx-auto">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl text-white flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        Social Media Strategie Generator
                      </CardTitle>
                      <Button
                        variant="ghost"
                        onClick={() => setShowStrategyGenerator(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ← Terug
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SocialMediaStrategyGenerator
                      clientId={clientId}
                      websiteAnalysis={websiteAnalysis}
                      onComplete={handleStrategyComplete}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
