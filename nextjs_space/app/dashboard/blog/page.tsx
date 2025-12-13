'use client';

import { useState } from 'react';
import { Rocket, BookOpen, Loader2, CheckCircle2, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import ProjectSelector, { Project } from '@/components/project-selector';

interface GenerationPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
}

const INITIAL_PHASES: GenerationPhase[] = [
  { name: 'SERP Analyse', status: 'pending', message: 'Top Google resultaten analyseren...' },
  { name: 'Content Generatie', status: 'pending', message: 'SEO-geoptimaliseerde content schrijven...' },
  { name: 'SEO & Afbeeldingen', status: 'pending', message: 'Meta data optimaliseren...' },
  { name: 'Opslaan', status: 'pending', message: 'Content opslaan...' },
];

// Dynamically import heavy components
const BlogContentLibrary = dynamic(() => import('@/components/blog/BlogContentLibrary'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
});

export default function ClientBlogPage() {
  const { data: session } = useSession();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('AI & Content Marketing');
  const [autoPublish, setAutoPublish] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState<GenerationPhase[]>(INITIAL_PHASES);
  const [showSuccess, setShowSuccess] = useState(false);
  const [libraryKey, setLibraryKey] = useState(Date.now());

  const updatePhaseByName = (phaseName: string, updates: Partial<GenerationPhase>) => {
    setPhases(currentPhases => {
      const phaseIndex = currentPhases.findIndex(p => p.name === phaseName);
      if (phaseIndex !== -1) {
        return currentPhases.map((phase, i) => 
          i === phaseIndex ? { ...phase, ...updates } : phase
        );
      }
      return currentPhases;
    });
  };

  const processKeywords = (keywords: string): string[] | undefined => {
    return keywords.trim() ? keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined;
  };

  const resetForm = () => {
    setTitle('');
    setKeywords('');
    setCategory('AI & Content Marketing');
    setAutoPublish(false);
    setProgress(0);
    setPhases(INITIAL_PHASES.map(phase => ({ ...phase })));
    setShowSuccess(false);
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Vul een titel in');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          title,
          keywords: processKeywords(keywords),
          category,
          targetWordCount: 1500,
          generateImages: true,
          includeFAQ: true,
          autoPublish,
          projectId: selectedProjectId,
          project: selectedProject,
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      // Stream the response for real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.phase) {
                updatePhaseByName(data.phase, { status: 'in-progress', message: data.message });
              }

              if (data.progress) {
                setProgress(data.progress);
              }

              if (data.phaseComplete) {
                updatePhaseByName(data.phaseComplete, { status: 'completed' });
              }

              if (data.complete) {
                setPhases(currentPhases => 
                  currentPhases.map(phase => ({ ...phase, status: 'completed' as const }))
                );
                setProgress(100);
                setShowSuccess(true);
                toast.success('Artikel succesvol gegenereerd!');
                // Refresh the library to show the new article
                setLibraryKey(Date.now());
                return;
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (err) {
              console.error('Error parsing SSE:', err);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Kon artikel niet genereren');
      
      // Mark current in-progress phase as failed
      setPhases(currentPhases => 
        currentPhases.map(phase => 
          phase.status === 'in-progress' ? { ...phase, status: 'failed' as const } : phase
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FF9933]/10 via-gray-900 to-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9933]/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#FF9933]/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-[#FF9933]" />
                </div>
                <h1 className="text-3xl font-bold text-white">Blog Artikel Genereren</h1>
              </div>
              <p className="text-gray-400 text-lg max-w-3xl">
                Genereer in 1 klik een SEO-geoptimaliseerd blog artikel met AI.
                Direct publiceren naar WordPress optioneel.
              </p>
            </div>
            <Link 
              href="/dashboard/blog/advanced"
              className="text-sm text-gray-400 hover:text-[#FF9933] transition-colors flex items-center gap-1"
            >
              Geavanceerde modus
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Simple Generation Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {!generating && !showSuccess ? (
          <div className="space-y-6">
            {/* Project Selector */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-white">
                Publiceren naar project
              </Label>
              <ProjectSelector
                value={selectedProjectId}
                onChange={(projectId, project) => {
                  setSelectedProjectId(projectId);
                  setSelectedProject(project);
                }}
                autoSelectPrimary={true}
                showKnowledgeBase={true}
              />
              {selectedProject && (
                <div className="flex items-center gap-2 mt-2">
                  {selectedProject.wordpressUrl ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">WordPress verbonden</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">
                        WordPress niet geconfigureerd.{' '}
                        <Link 
                          href="/client-portal/projects" 
                          className="underline hover:text-yellow-400"
                        >
                          Configureer in project settings
                        </Link>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Titel *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bijv: Hoe AI content marketing revolutioneert in 2024"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-white">
                Keywords (optioneel, komma-gescheiden)
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Bijv: AI content, content marketing, SEO"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">
                Categorie
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI & Content Marketing">AI & Content Marketing</SelectItem>
                  <SelectItem value="SEO & Ranking">SEO & Ranking</SelectItem>
                  <SelectItem value="WordPress Tips">WordPress Tips</SelectItem>
                  <SelectItem value="Automatisering">Automatisering</SelectItem>
                  <SelectItem value="Nieuws & Updates">Nieuws & Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Publish Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="space-y-0.5">
                <Label className="text-white">Direct publiceren naar WordPress</Label>
                <p className="text-sm text-gray-400">
                  {selectedProject?.wordpressUrl 
                    ? 'Publiceert automatisch naar je WordPress site'
                    : 'WordPress moet eerst geconfigureerd worden in je project'}
                </p>
              </div>
              <Switch
                checked={autoPublish}
                onCheckedChange={setAutoPublish}
                disabled={!selectedProject?.wordpressUrl}
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={!title.trim()}
              className="w-full bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
              size="lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Genereer Artikel
            </Button>
          </div>
        ) : generating ? (
          /* Generation Progress */
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-white">Voortgang</span>
                <span className="text-gray-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Phases */}
            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800/50"
                >
                  <div className="mt-0.5">
                    {phase.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {phase.status === 'in-progress' && (
                      <Loader2 className="h-5 w-5 animate-spin text-[#FF9933]" />
                    )}
                    {phase.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                    )}
                    {phase.status === 'failed' && (
                      <div className="h-5 w-5 rounded-full bg-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{phase.name}</div>
                    {phase.message && (
                      <div className="text-xs text-gray-400 mt-1">
                        {phase.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Artikel succesvol gegenereerd!</h3>
            <p className="text-gray-400">
              Je artikel is aangemaakt en staat {autoPublish ? 'gepubliceerd' : 'als concept'} klaar.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button
                onClick={resetForm}
                className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Nog een artikel genereren
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Articles List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Gegenereerde Artikelen</h2>
          <p className="text-sm text-gray-400">
            Overzicht van alle gegenereerde blog artikelen
          </p>
        </div>
        <BlogContentLibrary key={libraryKey} />
      </div>
    </div>
  );
}
