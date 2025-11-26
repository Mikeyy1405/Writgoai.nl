
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Lightbulb,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectSelector, { Project } from '@/components/project-selector';
import ProjectResearchManager from '@/components/project-research-manager';

export default function ContentPlanningPage() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(false);
  
  // Project state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Analysis & Strategy state
  const [contentAnalysis, setContentAnalysis] = useState({
    currentSituation: '',
    competitorAnalysis: '',
    contentGaps: '',
    opportunities: '',
    challenges: '',
  });
  
  const [contentStrategy, setContentStrategy] = useState({
    goals: '',
    targetAudience: '',
    contentPillars: '',
    contentCalendar: '',
    kpis: '',
    timeline: '',
    budget: '',
  });

  const [activeTab, setActiveTab] = useState<'analysis' | 'strategy'>('analysis');

  // Handle project selection
  const handleProjectChange = (newProjectId: string | null, project: Project | null) => {
    setProjectId(newProjectId);
    setSelectedProject(project);
  };

  // Bundle analysis data for saving
  const getAnalysisData = () => ({
    ...contentAnalysis,
    timestamp: new Date().toISOString(),
  });

  // Bundle strategy data for saving
  const getStrategyData = () => ({
    ...contentStrategy,
    timestamp: new Date().toISOString(),
  });

  // Load analysis data
  const handleLoadAnalysisData = (data: any) => {
    if (!data) return;
    try {
      setContentAnalysis({
        currentSituation: data.currentSituation || '',
        competitorAnalysis: data.competitorAnalysis || '',
        contentGaps: data.contentGaps || '',
        opportunities: data.opportunities || '',
        challenges: data.challenges || '',
      });
      toast.success('Analyse data geladen');
    } catch (error) {
      console.error('Error loading analysis data:', error);
      toast.error('Fout bij laden van data');
    }
  };

  // Load strategy data
  const handleLoadStrategyData = (data: any) => {
    if (!data) return;
    try {
      setContentStrategy({
        goals: data.goals || '',
        targetAudience: data.targetAudience || '',
        contentPillars: data.contentPillars || '',
        contentCalendar: data.contentCalendar || '',
        kpis: data.kpis || '',
        timeline: data.timeline || '',
        budget: data.budget || '',
      });
      toast.success('Strategie data geladen');
    } catch (error) {
      console.error('Error loading strategy data:', error);
      toast.error('Fout bij laden van data');
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br bg-[#ff6b35] rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Content Planning</h1>
            <p className="text-gray-300">Beheer je content analyses en strategieën</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/client-portal')}
          variant="outline"
          className="border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
        >
          ← Terug naar Tools
        </Button>
      </div>

      {/* Project Selector */}
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
        <ProjectSelector
          value={projectId}
          onChange={handleProjectChange}
        />
      </Card>

      {!projectId ? (
        <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold mb-2 text-white">Selecteer een project</h3>
          <p className="text-gray-400">
            Kies een project hierboven om je content analyses en strategieën te beheren
          </p>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'analysis'
                  ? 'border-[#ff6b35] text-[#ff6b35]'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Content Analyse
              </div>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'strategy'
                  ? 'border-[#ff6b35] text-[#ff6b35]'
                  : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Content Strategie
              </div>
            </button>
          </div>

          {/* Content Analysis Tab */}
          {activeTab === 'analysis' && (
            <>
              <ProjectResearchManager
                projectId={projectId}
                projectName={selectedProject?.name || ''}
                type="content-analysis"
                data={getAnalysisData()}
                onLoad={handleLoadAnalysisData}
                autoSave={false}
              />

              <div className="space-y-4">
                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Huidige Situatie</h3>
                  </div>
                  <Textarea
                    value={contentAnalysis.currentSituation}
                    onChange={(e) => setContentAnalysis({...contentAnalysis, currentSituation: e.target.value})}
                    placeholder="Beschrijf de huidige content situatie van je website..."
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Concurrent Analyse</h3>
                  </div>
                  <Textarea
                    value={contentAnalysis.competitorAnalysis}
                    onChange={(e) => setContentAnalysis({...contentAnalysis, competitorAnalysis: e.target.value})}
                    placeholder="Wat doen je concurrenten goed? Wat kan beter?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Content Gaps</h3>
                  </div>
                  <Textarea
                    value={contentAnalysis.contentGaps}
                    onChange={(e) => setContentAnalysis({...contentAnalysis, contentGaps: e.target.value})}
                    placeholder="Welke onderwerpen of keywords ontbreken nog?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Kansen</h3>
                  </div>
                  <Textarea
                    value={contentAnalysis.opportunities}
                    onChange={(e) => setContentAnalysis({...contentAnalysis, opportunities: e.target.value})}
                    placeholder="Welke kansen zie je voor nieuwe content?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Uitdagingen</h3>
                  </div>
                  <Textarea
                    value={contentAnalysis.challenges}
                    onChange={(e) => setContentAnalysis({...contentAnalysis, challenges: e.target.value})}
                    placeholder="Welke uitdagingen verwacht je?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>
              </div>
            </>
          )}

          {/* Content Strategy Tab */}
          {activeTab === 'strategy' && (
            <>
              <ProjectResearchManager
                projectId={projectId}
                projectName={selectedProject?.name || ''}
                type="content-strategy"
                data={getStrategyData()}
                onLoad={handleLoadStrategyData}
                autoSave={false}
              />

              <div className="space-y-4">
                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Doelen</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.goals}
                    onChange={(e) => setContentStrategy({...contentStrategy, goals: e.target.value})}
                    placeholder="Wat wil je bereiken met je content? (bijv. meer traffic, conversies, autoriteit)"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Doelgroep</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.targetAudience}
                    onChange={(e) => setContentStrategy({...contentStrategy, targetAudience: e.target.value})}
                    placeholder="Wie is je doelgroep? Wat zijn hun pijnpunten en behoeften?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Content Pilaren</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.contentPillars}
                    onChange={(e) => setContentStrategy({...contentStrategy, contentPillars: e.target.value})}
                    placeholder="Wat zijn de hoofdthema's waar je content over gaat?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Content Kalender</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.contentCalendar}
                    onChange={(e) => setContentStrategy({...contentStrategy, contentCalendar: e.target.value})}
                    placeholder="Plan je content publicaties (frequentie, timing, etc.)"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">KPI's & Metrics</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.kpis}
                    onChange={(e) => setContentStrategy({...contentStrategy, kpis: e.target.value})}
                    placeholder="Hoe ga je succes meten? (bijv. pageviews, engagement, conversies)"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Timeline</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.timeline}
                    onChange={(e) => setContentStrategy({...contentStrategy, timeline: e.target.value})}
                    placeholder="Wat is de planning? Wanneer wil je welke mijlpalen bereiken?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>

                <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="text-[#ff6b35]" size={20} />
                    <h3 className="text-lg font-semibold text-white">Budget</h3>
                  </div>
                  <Textarea
                    value={contentStrategy.budget}
                    onChange={(e) => setContentStrategy({...contentStrategy, budget: e.target.value})}
                    placeholder="Wat is je budget voor content creatie en promotie?"
                    className="min-h-[120px] bg-gray-900 border-gray-800 text-white"
                  />
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
