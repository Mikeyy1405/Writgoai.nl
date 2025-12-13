'use client';

import { useState, useEffect } from 'react';
import { Rocket, BookOpen, Loader2, CheckCircle2, ChevronRight, CheckCircle, AlertTriangle, Globe, ChevronDown, Check } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';
import { useProject } from '@/lib/contexts/ProjectContext';

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
  const { projects, currentProject, switchProject, loading: projectsLoading } = useProject();
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('AI & Content Marketing');
  const [autoPublish, setAutoPublish] = useState(false);
  const [addInternalLinks, setAddInternalLinks] = useState(true);
  const [addAffiliateLinks, setAddAffiliateLinks] = useState(true);
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
    setAddInternalLinks(true);
    setAddAffiliateLinks(true);
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
          projectId: currentProject?.id,
          project: currentProject,
          addInternalLinks,
          addAffiliateLinks,
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
                Project *
              </Label>
              {projectsLoading ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Laden...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900">
                    <AlertTriangle className="w-4 h-4 text-[#ff6b35]" />
                    <span className="text-sm text-gray-300">Geen projecten aangemaakt</span>
                  </div>
                  <Link href="/dashboard/projects/new">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Maak je eerste project aan
                    </Button>
                  </Link>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between gap-2 bg-zinc-900 border-zinc-700 hover:border-[#ff6b35] hover:bg-zinc-800 text-white"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Globe className={`w-4 h-4 flex-shrink-0 ${currentProject ? 'text-[#ff6b35]' : 'text-gray-400'}`} />
                        <span className="truncate text-sm">
                          {currentProject ? currentProject.name : 'Selecteer project'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-[70vh] overflow-y-auto bg-zinc-900 border-zinc-700">
                    <DropdownMenuLabel className="text-gray-400 text-xs sticky top-0 bg-zinc-900 z-10">Selecteer een project</DropdownMenuLabel>
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.id}
                        onClick={() => switchProject(project.id)}
                        className="flex items-start justify-between cursor-pointer hover:bg-zinc-800 text-white p-3"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {project.name}
                          </div>
                          {project.websiteUrl && (
                            <div className="text-xs text-gray-400 truncate mt-0.5">
                              {project.websiteUrl.replace(/^https?:\/\//, '')}
                            </div>
                          )}
                        </div>
                        {currentProject?.id === project.id && (
                          <Check className="w-4 h-4 text-[#ff6b35] flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-zinc-700" />
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/dashboard/projects" 
                        className="cursor-pointer hover:bg-zinc-800 text-[#ff6b35] text-sm flex items-center gap-2"
                      >
                        <Globe className="w-3 h-3" />
                        Beheer projecten
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {currentProject && (
                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                  {currentProject.wordpressUrl && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-300">WordPress verbonden</span>
                    </div>
                  )}
                  {currentProject.affiliateLinksCount && currentProject.affiliateLinksCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">📍 {currentProject.affiliateLinksCount} affiliate links</span>
                    </div>
                  )}
                  {currentProject.hasSitemap && currentProject.sitemapUrlsCount && currentProject.sitemapUrlsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">🗺️ Sitemap geladen ({currentProject.sitemapUrlsCount} URLs)</span>
                    </div>
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

            {/* Content Options */}
            <div className="space-y-3">
              {/* Internal Links Toggle */}
              {currentProject?.hasSitemap && currentProject?.sitemapUrlsCount && currentProject.sitemapUrlsCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="space-y-0.5">
                    <Label className="text-white">Voeg interne links toe (via sitemap)</Label>
                    <p className="text-sm text-gray-400">
                      Voegt automatisch relevante interne links toe aan de content
                    </p>
                  </div>
                  <Switch
                    checked={addInternalLinks}
                    onCheckedChange={setAddInternalLinks}
                  />
                </div>
              )}

              {/* Affiliate Links Toggle */}
              {currentProject?.affiliateLinksCount && currentProject.affiliateLinksCount > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="space-y-0.5">
                    <Label className="text-white">Voeg affiliate links toe waar relevant</Label>
                    <p className="text-sm text-gray-400">
                      Integreert natuurlijk {currentProject.affiliateLinksCount} affiliate links in de content
                    </p>
                  </div>
                  <Switch
                    checked={addAffiliateLinks}
                    onCheckedChange={setAddAffiliateLinks}
                  />
                </div>
              )}

              {/* Auto Publish Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="space-y-0.5">
                  <Label className="text-white">Direct publiceren naar WordPress</Label>
                  <p className="text-sm text-gray-400">
                    {currentProject?.wordpressUrl 
                      ? 'Publiceert automatisch naar je WordPress site'
                      : 'WordPress moet eerst geconfigureerd worden in je project'}
                  </p>
                </div>
                <Switch
                  checked={autoPublish}
                  onCheckedChange={setAutoPublish}
                  disabled={!currentProject?.wordpressUrl}
                />
              </div>
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
